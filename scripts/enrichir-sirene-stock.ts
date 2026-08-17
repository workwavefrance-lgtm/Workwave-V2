/**
 * Enrichit les fiches avec l'EFFECTIF et la FORME JURIDIQUE, depuis les
 * fichiers Stock du repertoire Sirene (INSEE).
 *
 * POURQUOI PAS L'API. L'API entreprises est gratuite mais limitee a environ
 * 7 requetes par seconde : 2 561 166 fiches feraient plus de quatre jours de
 * fonctionnement continu. L'INSEE publie la meme base en fichiers complets,
 * mis a jour chaque mois. Un telechargement remplace 2,5 millions d'appels.
 *
 * CE QU'ON PREND, ET OU
 *   effectif        StockEtablissement, colonne trancheEffectifsEtablissement,
 *                   rattachement par SIRET (14 chiffres)
 *   forme juridique StockUniteLegale, colonne categorieJuridiqueUniteLegale,
 *                   rattachement par SIREN (les 9 premiers chiffres du SIRET)
 *
 * MEMOIRE. On ne charge jamais un fichier entier : les CSV sont lus en flux
 * depuis l'archive, ligne par ligne. Seul l'ensemble de NOS SIRET est garde
 * en memoire (environ 200 Mo pour 2,5 millions), et on ne retient que les
 * lignes qui nous concernent.
 *
 * Usage :
 *   npx tsx scripts/enrichir-sirene-stock.ts                 (simulation)
 *   npx tsx scripts/enrichir-sirene-stock.ts --appliquer
 *   npx tsx scripts/enrichir-sirene-stock.ts --appliquer --effectif-seul
 *
 * Prevoir un tas plus large : NODE_OPTIONS="--max-old-space-size=6144"
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import readline from "readline";
import { spawn } from "child_process";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const APPLIQUER = process.argv.includes("--appliquer");
const EFFECTIF_SEUL = process.argv.includes("--effectif-seul");
const DOSSIER = "/tmp/sirene";
const ZIP_ETAB = `${DOSSIER}/etab.zip`;
const ZIP_UNITE = `${DOSSIER}/unite.zip`;
const LOT_ECRITURE = 300; // taille du filtre `in`, au-dela l'URL devient trop longue

/** Lit un CSV contenu dans une archive zip, ligne par ligne, sans le decompresser sur disque. */
async function* lignesDuZip(zip: string): AsyncGenerator<string> {
  // -p ecrit le contenu sur la sortie standard : rien n'est ecrit sur disque.
  const p = spawn("unzip", ["-p", zip], { stdio: ["ignore", "pipe", "ignore"] });
  const rl = readline.createInterface({ input: p.stdout, crlfDelay: Infinity });
  for await (const l of rl) yield l;
  p.kill();
}

/** Decoupe une ligne CSV en respectant les guillemets (les libelles en contiennent). */
function champs(ligne: string): string[] {
  const out: string[] = [];
  let cur = "";
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (dansGuillemets && ligne[i + 1] === '"') {
        cur += '"';
        i++;
      } else dansGuillemets = !dansGuillemets;
    } else if (c === "," && !dansGuillemets) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Tous nos SIRET actifs. ~2,5 millions, environ 200 Mo en memoire. */
async function nosSirets(): Promise<Set<string>> {
  const set = new Set<string>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select("siret")
      .not("siret", "is", null)
      .eq("is_active", true)
      .is("deleted_at", null)
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error("ERREUR de lecture:", error.message);
      process.exit(1);
    }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) if (r.siret) set.add(r.siret);
    offset += rows.length;
    if (offset % 200000 === 0) console.log(`   ${offset.toLocaleString("fr-FR")} SIRET lus...`);
  }
  return set;
}

/**
 * Parcourt un fichier Stock et retient, pour chacune de NOS entreprises, la
 * valeur d'une colonne. `cle` dit quelle colonne sert de rattachement.
 */
async function extraire(
  zip: string,
  colCle: string,
  colValeur: string,
  garder: (cle: string) => string | null,
  valeurValide: (v: string) => boolean
): Promise<Map<string, string>> {
  const trouve = new Map<string, string>();
  let entete: string[] | null = null;
  let iCle = -1;
  let iVal = -1;
  let lues = 0;

  for await (const ligne of lignesDuZip(zip)) {
    if (!entete) {
      entete = champs(ligne);
      iCle = entete.indexOf(colCle);
      iVal = entete.indexOf(colValeur);
      if (iCle < 0 || iVal < 0) {
        console.error(`   colonnes introuvables (${colCle} / ${colValeur})`);
        process.exit(1);
      }
      continue;
    }
    lues++;
    if (lues % 5000000 === 0) {
      console.log(`   ${(lues / 1e6).toFixed(0)} M lignes parcourues, ${trouve.size.toLocaleString("fr-FR")} retenues`);
    }
    // Decoupe rapide : on evite le parseur complet tant qu'on n'a pas un candidat.
    const c = ligne.split(",", iCle + 1)[iCle];
    if (!c) continue;
    const cible = garder(c);
    if (cible === null) continue;
    const v = (champs(ligne)[iVal] || "").trim();
    if (!v || !valeurValide(v)) continue;
    trouve.set(cible, v);
  }
  console.log(`   termine : ${lues.toLocaleString("fr-FR")} lignes lues, ${trouve.size.toLocaleString("fr-FR")} retenues`);
  return trouve;
}

/** Ecrit une valeur identique sur un paquet de fiches, retrouvees par SIRET. */
async function ecrire(colonne: string, valeur: string, sirets: string[], horodatage: string): Promise<number> {
  let n = 0;
  for (let i = 0; i < sirets.length; i += LOT_ECRITURE) {
    const lot = sirets.slice(i, i + LOT_ECRITURE);
    const { error, count } = await sb
      .from("pros")
      .update({ [colonne]: valeur, sirene_synced_at: horodatage }, { count: "exact" })
      .in("siret", lot);
    if (error) {
      console.error(`   ERREUR d'ecriture (${colonne}=${valeur}) :`, error.message);
      process.exit(1);
    }
    n += count || 0;
  }
  return n;
}

(async () => {
  console.log("=== Enrichissement depuis les fichiers Stock du repertoire Sirene ===\n");
  for (const z of [ZIP_ETAB, ZIP_UNITE]) {
    if (!fs.existsSync(z)) {
      console.error(`Fichier manquant : ${z}`);
      console.error("Telecharger d'abord les fichiers Stock depuis data.gouv.fr.");
      process.exit(1);
    }
    console.log(`  ${path.basename(z)} : ${(fs.statSync(z).size / 1e9).toFixed(2)} Go`);
  }

  console.log("\n1. Lecture de nos SIRET...");
  const nos = await nosSirets();
  console.log(`   ${nos.size.toLocaleString("fr-FR")} fiches actives avec SIRET\n`);

  console.log("2. Effectif salarie (fichier Etablissement, rattachement par SIRET)...");
  // "NN" = non renseigne : sans interet, c'est justement ce qu'on a retire de
  // l'affichage le 17/08 parce que c'etait du texte identique partout.
  const effectifs = await extraire(
    ZIP_ETAB,
    "siret",
    "trancheEffectifsEtablissement",
    (siret) => (nos.has(siret) ? siret : null),
    (v) => v !== "NN"
  );

  let formes = new Map<string, string>();
  if (!EFFECTIF_SEUL) {
    console.log("\n3. Forme juridique (fichier Unite legale, rattachement par SIREN)...");
    // On indexe nos SIRET par leur SIREN pour retrouver l'entreprise mere.
    const parSiren = new Map<string, string[]>();
    for (const s of nos) {
      const siren = s.slice(0, 9);
      const l = parSiren.get(siren);
      if (l) l.push(s);
      else parSiren.set(siren, [s]);
    }
    const brut = await extraire(
      ZIP_UNITE,
      "siren",
      "categorieJuridiqueUniteLegale",
      (siren) => (parSiren.has(siren) ? siren : null),
      (v) => v !== "0000" && v !== ""
    );
    // On repercute la forme de l'entreprise sur chacun de ses etablissements.
    for (const [siren, cj] of brut) {
      for (const siret of parSiren.get(siren) || []) formes.set(siret, cj);
    }
    console.log(`   ${formes.size.toLocaleString("fr-FR")} fiches rattachees a une forme juridique`);
  }

  // Regroupement par valeur : il n'y a qu'une quinzaine de tranches d'effectif
  // et quelques dizaines de formes juridiques, donc on ecrit par paquets de
  // fiches partageant la meme valeur au lieu d'une requete par fiche.
  const grouper = (m: Map<string, string>) => {
    const g = new Map<string, string[]>();
    for (const [siret, v] of m) {
      const l = g.get(v);
      if (l) l.push(siret);
      else g.set(v, [siret]);
    }
    return [...g.entries()].sort((a, b) => b[1].length - a[1].length);
  };

  const gEff = grouper(effectifs);
  const gFor = grouper(formes);

  console.log("\n4. Repartition mesuree");
  console.log("   effectif :");
  for (const [v, l] of gEff.slice(0, 8)) console.log(`      ${v.padEnd(4)} ${l.length.toLocaleString("fr-FR").padStart(10)} fiches`);
  if (gFor.length) {
    console.log("   forme juridique :");
    for (const [v, l] of gFor.slice(0, 8)) console.log(`      ${v.padEnd(5)} ${l.length.toLocaleString("fr-FR").padStart(10)} fiches`);
  }

  if (!APPLIQUER) {
    console.log(`\nSIMULATION. ${effectifs.size.toLocaleString("fr-FR")} effectifs et ${formes.size.toLocaleString("fr-FR")} formes juridiques seraient ecrits.`);
    console.log("Relancer avec --appliquer.");
    return;
  }

  const horodatage = new Date().toISOString();
  console.log("\n5. Ecriture...");
  let n = 0;
  for (const [v, sirets] of gEff) {
    n += await ecrire("effectif_range", v, sirets, horodatage);
    console.log(`   effectif ${v} : ${n.toLocaleString("fr-FR")} fiches ecrites au total`);
  }
  let m = 0;
  for (const [v, sirets] of gFor) {
    m += await ecrire("forme_juridique", v, sirets, horodatage);
    console.log(`   forme ${v} : ${m.toLocaleString("fr-FR")} fiches ecrites au total`);
  }

  console.log(`\nTermine : ${n.toLocaleString("fr-FR")} effectifs, ${m.toLocaleString("fr-FR")} formes juridiques.`);
  console.log("Verifier en base avant de conclure quoi que ce soit.");
})();
