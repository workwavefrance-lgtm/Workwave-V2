/**
 * Seed Workwave AI : freelances NON-TECH via Sirene (recherche-entreprises.api.gouv.fr).
 *
 * Differences avec seed-sirene-tech.ts :
 *   - NAF codes : 7311Z (publicite), 7022Z (conseil), 7410Z (design),
 *     6920Z (compta), 6910Z (juridique), 7820Z (RH), 7430Z (traduction),
 *     7420Z (photo), 5911C (production), 5912Z (post-prod)
 *   - Mapping NAF -> category_id (macro non-tech) :
 *     7311Z, 7312Z -> marketing-communication
 *     7022Z -> strategie-management
 *     7410Z -> design-creation
 *     6920Z, 6619B -> finance-comptabilite
 *     6910Z -> juridique-conseil
 *     7820Z -> rh-recrutement
 *     7430Z -> redaction-copywriting
 *     7420Z, 5911C, 5912Z -> audiovisuel-medias
 *
 * Volume estime : ~150-200k freelances non-tech actifs en FR.
 * Duree estimee : ~10-15h @ 100ms/req (idempotent via ON CONFLICT siret).
 *
 * Run :
 *   npx tsx scripts/seed-sirene-nontech.ts                # dry-run
 *   npx tsx scripts/seed-sirene-nontech.ts --apply        # apply France entiere
 *   npx tsx scripts/seed-sirene-nontech.ts --naf=7311Z --apply  # 1 NAF
 *   npx tsx scripts/seed-sirene-nontech.ts --depts=75 --apply   # IDF only
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes("--apply");
const DEPTS_ARG = process.argv.find((a) => a.startsWith("--depts="));
const NAF_ARG = process.argv.find((a) => a.startsWith("--naf="));
const DEPTS_FILTER: string[] | null = DEPTS_ARG ? DEPTS_ARG.split("=")[1].split(",").map((d) => d.trim()) : null;
const NAF_FILTER: string | null = NAF_ARG ? NAF_ARG.split("=")[1] : null;

const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";
const RATE_LIMIT_MS = 100;
const PER_PAGE = 25;
const MAX_PAGES_PER_SLICE = 400;

// NAF non-tech -> macro slug
// IMPORTANT : format avec point (73.11Z) requis par l'API recherche-entreprises
const NAF_TO_MACRO: Array<{ code: string; label: string; macro: string }> = [
  { code: "73.11Z", label: "Activites des agences de publicite", macro: "marketing-communication" },
  { code: "73.12Z", label: "Regie publicitaire de medias", macro: "marketing-communication" },
  { code: "70.22Z", label: "Conseil pour les affaires et autres conseils de gestion", macro: "strategie-management" },
  { code: "74.10Z", label: "Activites specialisees de design", macro: "design-creation" },
  { code: "69.20Z", label: "Activites comptables", macro: "finance-comptabilite" },
  { code: "66.19B", label: "Autres activites auxiliaires de services financiers", macro: "finance-comptabilite" },
  { code: "69.10Z", label: "Activites juridiques", macro: "juridique-conseil" },
  { code: "78.20Z", label: "Activites des agences de travail temporaire", macro: "rh-recrutement" },
  { code: "74.30Z", label: "Traduction et interpretation", macro: "redaction-copywriting" },
  { code: "74.20Z", label: "Activites photographiques", macro: "audiovisuel-medias" },
  { code: "59.11C", label: "Production de films pour le cinema", macro: "audiovisuel-medias" },
  { code: "59.12Z", label: "Post-production de films cinema/video/TV", macro: "audiovisuel-medias" },
];

const ALL_DEPTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 76 }, (_, i) => String(i + 21).padStart(2, "0")),
  "971", "972", "973", "974", "976",
];

type RechercheEntrepriseResult = {
  siren: string;
  siret_siege?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  date_creation?: string;
  matching_etablissements?: Array<{
    siret: string;
    code_postal?: string;
    libelle_commune?: string;
    adresse?: string;
  }>;
  siege?: { siret?: string; code_postal?: string; adresse?: string };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(naf: string, dept: string, page: number): Promise<RechercheEntrepriseResult[]> {
  const url = new URL(API_BASE);
  url.searchParams.set("activite_principale", naf);
  url.searchParams.set("departement", dept);
  url.searchParams.set("est_entrepreneur_individuel", "true");
  url.searchParams.set("etat_administratif", "A");
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));
  try {
    const r = await fetch(url.toString());
    if (!r.ok) {
      if (r.status === 429) { await sleep(2000); return fetchPage(naf, dept, page); }
      return [];
    }
    const data = (await r.json()) as { results?: RechercheEntrepriseResult[] };
    return data.results || [];
  } catch { return []; }
}

function buildSlug(name: string, siretLast4: string): string {
  const base = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
  return `${base}-${siretLast4}`;
}

function calcExp(dateCreation?: string): number | null {
  if (!dateCreation) return null;
  const created = new Date(dateCreation);
  if (isNaN(created.getTime())) return null;
  const years = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(years));
}

async function loadCategoryId(slug: string): Promise<number | null> {
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).eq("vertical", "tech").maybeSingle();
  return data?.id || null;
}

function sanitize(r: { siret: string; siren: string; name: string; category_id: number; postal_code: string | null; address: string | null; years_experience: number | null }) {
  return {
    siret: r.siret.slice(0, 14),
    siren: r.siren.slice(0, 9),
    name: r.name.slice(0, 200),
    slug: buildSlug(r.name, r.siret.slice(-4)).slice(0, 200),
    category_id: r.category_id,
    address: r.address ? r.address.slice(0, 500) : null,
    postal_code: r.postal_code ? r.postal_code.slice(0, 5) : null,
    source: "sirene",
    is_active: true,
    years_experience: r.years_experience,
  };
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Workwave AI — Seed Sirene NON-TECH");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Mode  : ${APPLY ? "✓ APPLY" : "○ DRY-RUN"}`);
  console.log(`Depts : ${DEPTS_FILTER ? DEPTS_FILTER.join(",") : "France entiere"}`);
  console.log(`NAFs  : ${NAF_FILTER || NAF_TO_MACRO.map((n) => n.code).join(", ")}\n`);

  // Resolve category IDs
  const catIdByMacroSlug = new Map<string, number>();
  for (const { macro } of NAF_TO_MACRO) {
    if (!catIdByMacroSlug.has(macro)) {
      const id = await loadCategoryId(macro);
      if (!id) {
        console.error(`❌ Macro '${macro}' introuvable en DB. Lancer _seed-nontech-skills.ts d'abord.`);
        process.exit(1);
      }
      catIdByMacroSlug.set(macro, id);
    }
  }
  console.log(`[init] ${catIdByMacroSlug.size} macro-categories non-tech mappees`);

  // Cities map
  const cityIdMap = new Map<string, number>();
  let offset = 0;
  while (true) {
    const { data } = await supabase.from("cities").select("id, postal_code").not("postal_code", "is", null).range(offset, offset + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    rows.forEach((r) => r.postal_code && !cityIdMap.has(r.postal_code) && cityIdMap.set(r.postal_code, r.id));
    offset += rows.length;
  }
  console.log(`[init] ${cityIdMap.size} postaux mappes\n`);

  const depts = DEPTS_FILTER || ALL_DEPTS;
  const nafs = NAF_FILTER ? NAF_TO_MACRO.filter((n) => n.code === NAF_FILTER) : NAF_TO_MACRO;

  let totalFound = 0;
  let totalInserted = 0;
  let totalRequests = 0;
  const start = Date.now();

  for (const dept of depts) {
    for (const { code: naf, macro, label } of nafs) {
      const categoryId = catIdByMacroSlug.get(macro)!;
      let page = 1;
      let sliceFound = 0;
      const rowsToInsert: Array<ReturnType<typeof sanitize>> = [];

      while (page <= MAX_PAGES_PER_SLICE) {
        const results = await fetchPage(naf, dept, page);
        totalRequests++;
        await sleep(RATE_LIMIT_MS);
        if (results.length === 0) break;
        sliceFound += results.length;

        for (const res of results) {
          const etab = res.matching_etablissements?.[0] || res.siege;
          if (!etab) continue;
          const siret = (etab.siret || res.siret_siege || "").replace(/\s/g, "");
          if (!siret || siret.length !== 14) continue;
          const name = res.nom_complet || res.nom_raison_sociale || "";
          if (!name) continue;

          rowsToInsert.push(sanitize({
            siret,
            siren: res.siren,
            name: name.trim(),
            category_id: categoryId,
            postal_code: etab.code_postal?.trim() || null,
            address: etab.adresse?.trim() || null,
            years_experience: calcExp(res.date_creation),
          }));
        }

        if (results.length < PER_PAGE) break;
        page++;
      }

      totalFound += sliceFound;
      console.log(`[${dept}/${naf}] ${sliceFound} resultats, ${rowsToInsert.length} valides`);

      if (APPLY && rowsToInsert.length > 0) {
        // Batch insert 200
        let inserted = 0;
        for (let i = 0; i < rowsToInsert.length; i += 200) {
          const slice = rowsToInsert.slice(i, i + 200);
          const { data, error } = await supabase.from("pros").upsert(slice, { onConflict: "siret", ignoreDuplicates: true }).select("id");
          if (error) {
            // fallback single-row pour identifier les rows fautives
            for (const row of slice) {
              const { data: one, error: oneErr } = await supabase.from("pros").upsert([row], { onConflict: "siret", ignoreDuplicates: true }).select("id");
              if (!oneErr && one && one.length > 0) inserted++;
            }
          } else if (data) inserted += data.length;
        }
        totalInserted += inserted;
        console.log(`    → ${inserted} inseres`);
      }
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Requetes API : ${totalRequests}`);
  console.log(`Resultats    : ${totalFound}`);
  console.log(`Inseres      : ${APPLY ? totalInserted : "(dry-run)"}`);
  console.log(`Duree        : ${elapsed}s`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
