/**
 * Match nos pros (227k+) avec le dataset officiel RGE de l'ADEME (165k entreprises).
 *
 * Pattern : telecharger TOUT le dataset RGE en pages de 10k via l'API
 * data-fair de l'ADEME (cursor-based pagination), indexer en memoire par
 * SIRET, puis pour chaque pro Workwave avec siret valide, lookup local.
 *
 * Performance estimee :
 *   - DL dataset RGE : 17 pages * ~3s/page = ~50s
 *   - Pull pros avec siret : ~10s (paginated 5000 par 5000)
 *   - Update matches : parallele par chunks de 50 = ~10s pour 10k matches
 *   - Total : ~1-2 min
 *
 * Filtres :
 *   - On ne garde que les qualifs encore valides (date_fin >= today)
 *   - Une entreprise peut avoir plusieurs qualifs (Qualibat 5111 + 5232 + ...)
 *
 * Run :
 *   npx tsx scripts/match-rge-pros.ts             # dry-run, affiche stats
 *   npx tsx scripts/match-rge-pros.ts --apply     # applique les updates
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes("--apply");
const ADEME_DATASET = "liste-des-entreprises-rge-2";
const ADEME_BASE = `https://data.ademe.fr/data-fair/api/v1/datasets/${ADEME_DATASET}/lines`;
const PAGE_SIZE = 10000;
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

type RGELine = {
  siret: string;
  nom_qualification?: string;
  code_qualification?: string;
  organisme?: string;
  domaine?: string;
  meta_domaine?: string;
  lien_date_fin?: string;
};

type Qualif = {
  nom: string;
  code: string | null;
  organisme: string | null;
  domaine: string | null;
  meta_domaine: string | null;
  date_fin: string;
};

async function fetchAllRGE(): Promise<Map<string, Qualif[]>> {
  const map = new Map<string, Qualif[]>();
  const fields = [
    "siret",
    "nom_qualification",
    "code_qualification",
    "organisme",
    "domaine",
    "meta_domaine",
    "lien_date_fin",
  ].join(",");

  let url: string | null = `${ADEME_BASE}?size=${PAGE_SIZE}&select=${fields}`;
  let page = 0;
  let totalRows = 0;
  let validRows = 0;

  while (url) {
    page++;
    process.stdout.write(`  page ${page}... `);
    const r = await fetch(url);
    if (!r.ok) {
      console.error(`HTTP ${r.status} sur ${url}`);
      break;
    }
    const data = (await r.json()) as { results: RGELine[]; next?: string; total?: number };

    for (const row of data.results || []) {
      totalRows++;
      const siret = row.siret;
      const dateFin = row.lien_date_fin || "";
      // Skip qualif expirees
      if (!siret || !dateFin || dateFin < TODAY) continue;
      validRows++;

      const qualif: Qualif = {
        nom: row.nom_qualification || "",
        code: row.code_qualification || null,
        organisme: row.organisme || null,
        domaine: row.domaine || null,
        meta_domaine: row.meta_domaine || null,
        date_fin: dateFin,
      };

      const existing = map.get(siret) || [];
      existing.push(qualif);
      map.set(siret, existing);
    }

    console.log(`${data.results?.length || 0} rows | total cumule ${totalRows} | valides ${validRows} | siret uniques valides ${map.size}`);
    url = data.next || null;
  }

  return map;
}

/**
 * Recherche les fiches correspondant AUX SIRET DE L'ADEME, au lieu de
 * charger toute la base.
 *
 * 17/08/2026, pourquoi ce changement. La version precedente parcourait les
 * pros par tranches de 1000 avec un decalage croissant. Elle a ete ecrite
 * quand la base faisait 226 000 fiches ; elle en compte 2 561 166
 * aujourd'hui, soit plus de 2 500 allers-retours, chacun de plus en plus
 * lent (un decalage de 2 000 000 oblige Postgres a parcourir 2 millions de
 * lignes avant de renvoyer la suivante, cf. lecon du 26/05 sur la
 * pagination par decalage).
 *
 * Le sens inverse est bien plus court : l'ADEME ne publie que ~162 000
 * qualifications, donc quelques dizaines de milliers de SIRET distincts.
 * On interroge la base SUR CES SIRET uniquement, par paquets, ce qui
 * utilise l'index et ne ramene que ce qui nous interesse.
 */
async function fetchProsForSirets(sirets: string[]): Promise<{ id: number; siret: string }[]> {
  const trouves: { id: number; siret: string }[] = [];
  const PAQUET = 300; // au-dela, l'URL du filtre `in` devient trop longue
  for (let i = 0; i < sirets.length; i += PAQUET) {
    const lot = sirets.slice(i, i + PAQUET);
    const { data, error } = await supabase
      .from("pros")
      .select("id, siret")
      .in("siret", lot)
      .eq("is_active", true)
      .is("deleted_at", null);
    if (error) {
      console.error("  ERREUR de lecture:", error.message);
      process.exit(1);
    }
    trouves.push(...((data || []) as { id: number; siret: string }[]));
    if (i > 0 && (i / PAQUET) % 50 === 0) {
      process.stdout.write(`  ${i}/${sirets.length} SIRET interroges, ${trouves.length} fiches trouvees\n`);
    }
  }
  return trouves;
}

async function main() {
  console.log("=== Match RGE pros (source ADEME officielle) ===\n");

  // 1. DL dataset RGE
  console.log("1. Telechargement dataset RGE depuis l'API ADEME...");
  const t0 = Date.now();
  const rgeMap = await fetchAllRGE();
  console.log(
    `   -> ${rgeMap.size} SIRET uniques avec qualif valide (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`
  );

  // 2. Chercher NOS fiches correspondant aux SIRET de l'ADEME
  console.log("2. Recherche des fiches Workwave portant ces SIRET...");
  const siretsAdeme = [...rgeMap.keys()];
  const pros = await fetchProsForSirets(siretsAdeme);
  console.log(
    `   -> ${pros.length} fiches trouvees sur ${siretsAdeme.length} SIRET certifies RGE\n`
  );

  // 3. Match
  console.log("3. Matching SIRET...");
  const matches: { id: number; qualifications: Qualif[] }[] = [];
  for (const p of pros) {
    const qualifs = rgeMap.get(p.siret);
    if (qualifs && qualifs.length > 0) {
      matches.push({ id: p.id, qualifications: qualifs });
    }
  }
  console.log(`   -> ${matches.length} pros avec au moins 1 qualif RGE valide\n`);

  // Stats : top organismes
  const orgCount = new Map<string, number>();
  for (const m of matches) {
    for (const q of m.qualifications) {
      const o = q.organisme || "(unknown)";
      orgCount.set(o, (orgCount.get(o) || 0) + 1);
    }
  }
  console.log("   Top organismes (qualifs cumulees) :");
  const sorted = [...orgCount.entries()].sort((a, b) => b[1] - a[1]);
  for (const [org, cnt] of sorted.slice(0, 10)) {
    console.log(`     ${org.padEnd(25)} ${cnt}`);
  }
  console.log();

  if (!APPLY) {
    console.log("[DRY-RUN] Pour appliquer les updates :");
    console.log("  npx tsx scripts/match-rge-pros.ts --apply");
    console.log("\nExemple sample (3 pros) :");
    for (const m of matches.slice(0, 3)) {
      console.log(`  pro id=${m.id} | ${m.qualifications.length} qualif(s) :`);
      for (const q of m.qualifications) {
        console.log(`    - ${q.nom} (${q.organisme}) | ${q.domaine || "-"} | valide jusqu'au ${q.date_fin}`);
      }
    }
    return;
  }

  // 4. Update batch
  console.log("4. Update des pros matches (parallele par chunks de 50)...");
  const now = new Date().toISOString();
  let done = 0;
  const CHUNK = 50;
  for (let i = 0; i < matches.length; i += CHUNK) {
    const chunk = matches.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((m) =>
        supabase
          .from("pros")
          .update({
            rge_certified: true,
            rge_qualifications: m.qualifications,
            rge_synced_at: now,
          })
          .eq("id", m.id)
      )
    );
    done += chunk.length;
    if (i % (CHUNK * 10) === 0 || done === matches.length) {
      console.log(`   ${done}/${matches.length} updates`);
    }
  }

  // 5. RETRAIT DU BADGE AUX QUALIFICATIONS EXPIREES.
  //
  // 17/08/2026. Le script savait poser le badge, jamais l'enlever. Une
  // entreprise dont la qualification a expire depuis la derniere
  // synchronisation gardait rge_certified=true et affichait publiquement une
  // certification perimee, donc une affirmation fausse sur sa fiche. Les
  // qualifs expirees sont deja ecartees plus haut (date_fin < aujourd'hui),
  // il suffit donc de nettoyer tout ce qui porte encore le badge sans etre
  // dans la liste du jour.
  console.log("\n5. Retrait du badge aux qualifications expirees...");
  const marquesIds = new Set(matches.map((m) => m.id));
  const aNettoyer: number[] = [];
  {
    let offset = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await supabase
        .from("pros")
        .select("id")
        .eq("rge_certified", true)
        .range(offset, offset + PAGE - 1);
      const rows = (data || []) as { id: number }[];
      if (rows.length === 0) break;
      for (const r of rows) if (!marquesIds.has(r.id)) aNettoyer.push(r.id);
      offset += rows.length;
    }
  }
  if (aNettoyer.length === 0) {
    console.log("   aucune fiche a nettoyer.");
  } else {
    let nettoyees = 0;
    for (let i = 0; i < aNettoyer.length; i += 200) {
      const lot = aNettoyer.slice(i, i + 200);
      const { error, count } = await supabase
        .from("pros")
        .update(
          { rge_certified: false, rge_qualifications: [], rge_number: null, rge_synced_at: now },
          { count: "exact" }
        )
        .in("id", lot);
      if (error) {
        console.error("   ERREUR de nettoyage:", error.message);
        process.exit(1);
      }
      nettoyees += count || 0;
    }
    console.log(`   ${nettoyees} fiche(s) ont perdu un badge RGE devenu invalide.`);
  }

  console.log(
    `\nTermine : ${matches.length} pros marques rge_certified=true. Sync date : ${now}.`
  );
  console.log(
    `\nVerification :`
  );
  console.log(
    `  SELECT COUNT(*) FROM pros WHERE rge_certified = true; -- doit retourner ${matches.length}`
  );
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
