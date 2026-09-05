/**
 * Ecrit en base la forme juridique de chaque fiche.
 *
 * Source : fichier StockUniteLegale du repertoire Sirene (INSEE), colonne
 * categorieJuridiqueUniteLegale, extraite par
 * scripts/extraire-formes-juridiques.py vers /tmp/sirene/formes.csv.
 *
 * MESURE DU 19/08 : couverture 100 % (2 442 360 fiches), mais 47 % sont
 * "entrepreneur individuel". Cette donnee distingue donc deux voisins environ
 * une fois sur deux. Apport modeste, assume : c'est la derniere donnee
 * gratuite disponible sur l'ensemble de la base.
 *
 * Les ecritures sont GROUPEES PAR VALEUR : il n'y a qu'une soixantaine de
 * formes juridiques reellement utilisees, donc on ecrit par paquets de fiches
 * partageant la meme valeur, au lieu d'une requete par fiche.
 *
 * Usage :
 *   npx tsx scripts/ecrire-formes-juridiques.ts              (simulation)
 *   npx tsx scripts/ecrire-formes-juridiques.ts --appliquer
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import readline from "readline";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const APPLIQUER = process.argv.includes("--appliquer");
const LOT = 300; // taille du filtre `in`, au-dela l'URL devient trop longue

(async () => {
  console.log("1. Lecture du fichier extrait...");
  const parForme = new Map<string, string[]>();
  const rl = readline.createInterface({
    input: fs.createReadStream("/tmp/sirene/formes.csv", { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let premiere = true;
  let total = 0;
  for await (const ligne of rl) {
    if (premiere) { premiere = false; continue; }
    const [siret, forme] = ligne.split(",");
    if (!siret || !forme) continue;
    total++;
    const l = parForme.get(forme);
    if (l) l.push(siret);
    else parForme.set(forme, [siret]);
  }
  const tri = [...parForme.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log(`   ${total.toLocaleString("fr-FR")} fiches, ${tri.length} formes juridiques distinctes\n`);
  console.log("   les plus frequentes :");
  const { libelleFormeJuridique } = await import("../lib/data/formes-juridiques");
  for (const [code, l] of tri.slice(0, 8)) {
    const pct = ((l.length / total) * 100).toFixed(1);
    console.log(`      ${code}  ${String(l.length).padStart(9)}  ${pct.padStart(5)} %  ${libelleFormeJuridique(code) || "(libellé inconnu)"}`);
  }
  const sansLibelle = tri.filter(([c]) => !libelleFormeJuridique(c));
  const nbSansLibelle = sansLibelle.reduce((s, [, l]) => s + l.length, 0);
  console.log(`\n   codes sans libellé dans notre table : ${sansLibelle.length} (${nbSansLibelle.toLocaleString("fr-FR")} fiches)`);
  console.log("   ces fiches n'afficheront rien, la carte reste masquée.");

  if (!APPLIQUER) {
    console.log("\nSIMULATION. Relancer avec --appliquer.");
    return;
  }

  // 2. Correspondance SIRET -> identifiant.
  //
  // POURQUOI CETTE ETAPE. Le premier essai mettait a jour en filtrant sur le
  // SIRET : cette colonne n'est pas indexee, donc chaque requete parcourait
  // les 2,4 millions de lignes et la base a coupe ("statement timeout").
  // Resultat : 0 fiche ecrite. On passe donc par l'identifiant, qui est la
  // cle primaire, donc immediat.
  console.log("\n2. Correspondance SIRET vers identifiant...");
  const idParSiret = new Map<string, number>();
  {
    let dernier = 0;
    while (true) {
      const { data, error } = await sb
        .from("pros")
        .select("id, siret")
        .eq("is_active", true)
        .is("deleted_at", null)
        .not("siret", "is", null)
        .gt("id", dernier)
        .order("id", { ascending: true })
        .limit(1000);
      if (error) { console.error("   ERREUR de lecture :", error.message); process.exit(1); }
      const rows = data || [];
      if (rows.length === 0) break;
      for (const r of rows) if (r.siret) idParSiret.set(r.siret, r.id);
      dernier = rows[rows.length - 1].id;
      if (idParSiret.size % 500000 < 1000) console.log(`   ${idParSiret.size.toLocaleString("fr-FR")} fiches lues...`);
    }
  }
  console.log(`   ${idParSiret.size.toLocaleString("fr-FR")} fiches actives\n`);

  console.log("3. Écriture...");
  const horodatage = new Date().toISOString();
  let n = 0;
  let sansCorrespondance = 0;
  for (const [forme, sirets] of tri) {
    const ids: number[] = [];
    for (const s of sirets) {
      const id = idParSiret.get(s);
      if (id === undefined) sansCorrespondance++;
      else ids.push(id);
    }
    for (let i = 0; i < ids.length; i += 500) {
      const paquet = ids.slice(i, i + 500);
      // PAS de count:"exact" ici. Sur une table de 2,4 millions de lignes,
      // PostgREST fait alors un comptage complet A CHAQUE requete, et c'est
      // LUI qui expire ("canceling statement due to statement timeout"), pas
      // la mise a jour. Mesure du 20/08 : deux echecs successifs, 0 fiche
      // ecrite, alors que l'ecriture elle-meme portait sur 500 cles primaires.
      // On compte donc localement, et on verifie en base a la fin.
      const { error } = await sb
        .from("pros")
        .update({ forme_juridique: forme, sirene_synced_at: horodatage })
        .in("id", paquet);
      if (error) { console.error("   ERREUR :", error.message); process.exit(1); }
      n += paquet.length;
    }
    if (ids.length > 1000) console.log(`   ${forme} : ${n.toLocaleString("fr-FR")} fiches écrites au total`);
  }
  console.log(`\n   sans correspondance en base (fiches retirées) : ${sansCorrespondance.toLocaleString("fr-FR")}`);
  console.log(`\nTerminé : ${n.toLocaleString("fr-FR")} fiches. Vérifier en base avant de conclure.`);
})();
