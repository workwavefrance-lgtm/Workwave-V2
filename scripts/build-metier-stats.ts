/**
 * Genere lib/data/metier-stats.ts : le nombre REEL de fiches OUVERTES par
 * metier (etablissements non fermes d'apres le registre Sirene, regle
 * FILTRE_OUVERTS de lib/queries/pros.ts) + la couverture globale + l'etat
 * Sirene par metier (fiches verifiees, etablissements fermes, entreprises
 * disparues) pour les barometres.
 *
 * Avant le 03/09/2026 ce script comptait TOUTES les fiches actives : 49,5 %
 * d'entre elles sont des etablissements fermes (mesure SQL de Willy, 03/09).
 * Les comptes publies etaient donc faux de moitie.
 *
 * Donnees : scripts/lib/stats-etats.ts (RPC stats_etats_cat_dept_json si la
 * migration 2026-09-03_stats_ouverts_rpcs.sql est appliquee, sinon extraction
 * directe mise en cache 24 h). ISR-safe : fichier statique lu au rendu.
 *
 * Usage : npx tsx scripts/build-metier-stats.ts [--extraire]
 *   --extraire : ignore la RPC et le cache, relit toute la table (~6 min).
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { getServiceClient } from "../lib/supabase/service-client";
import {
  chargerStatsEtats,
  part,
  CLASSEMENT_SIRENE_DU,
  ETATS_SOURCE,
  SEUIL_TAUX,
} from "./lib/stats-etats";

const VERTICAUX = ["btp", "domicile", "personne"];

async function main() {
  const debut = Date.now();
  const sb = getServiceClient();
  const { data: cats, error: catErr } = await sb
    .from("categories")
    .select("id,slug")
    .in("vertical", VERTICAUX)
    .order("slug");
  if (catErr || !cats) throw catErr;

  // Couverture globale (petites tables -> count exact instantane)
  const { count: deptCount } = await sb
    .from("departments")
    .select("id", { count: "exact", head: true });
  const { count: cityCount } = await sb
    .from("cities")
    .select("id", { count: "exact", head: true });

  const etats = await chargerStatsEtats({ forcerExtraction: process.argv.includes("--extraire") });

  // Somme par metier, tous departements (France + Belgique). Les parts
  // n'utilisent que les fiches verifiees (v), donc la France seule.
  const parMetier = new Map<string, { t: number; o: number; v: number; f: number; x: number }>();
  for (const l of etats.lignes) {
    if (!VERTICAUX.includes(l.vertical)) continue;
    const m = parMetier.get(l.c) || { t: 0, o: 0, v: 0, f: 0, x: 0 };
    m.t += l.t; m.o += l.o; m.v += l.v; m.f += l.f; m.x += l.x;
    parMetier.set(l.c, m);
  }

  const stats: Record<string, number> = {};
  const metierEtats: Record<string, { verifies: number; fermes: number; disparus: number }> = {};
  const national = { t: 0, o: 0, v: 0, f: 0, x: 0 };
  for (const c of cats) {
    const m = parMetier.get(c.slug) || { t: 0, o: 0, v: 0, f: 0, x: 0 };
    stats[c.slug] = m.o;
    if (m.v > 0) metierEtats[c.slug] = { verifies: m.v, fermes: m.f, disparus: m.x };
    national.t += m.t; national.o += m.o; national.v += m.v; national.f += m.f; national.x += m.x;
    const pf = part(m.f, m.v);
    console.log(
      `  ${c.slug.padEnd(30)} ouverts ${String(m.o).padStart(7)} · actifs ${String(m.t).padStart(7)} · fermes ${pf === null ? "   n/a" : String(pf).padStart(5) + " %"}`
    );
  }

  const retrievedAt = new Date().toISOString().slice(0, 10);
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const file =
    `// Stats REELLES par metier issues de notre base : nombre de fiches OUVERTES\n` +
    `// (etablissements non fermes d'apres le registre Sirene, regle FILTRE_OUVERTS).\n` +
    `// Genere le ${retrievedAt} par scripts/build-metier-stats.ts (donnees : ${etats.source}` +
    `${etats.source === "rpc" ? `, vue calculee le ${etats.calculeLe}` : ""}).\n` +
    `// A relancer apres chaque scrape ou classement Sirene. Donnee unique : 0 invention.\n\n` +
    `export const METIER_STATS: Record<string, number> = ${JSON.stringify(stats, null, 2)};\n\n` +
    `/**\n` +
    ` * Etat Sirene par metier, France uniquement (${ETATS_SOURCE}) :\n` +
    ` * fiches dont l'etat est verifie, etablissements fermes, entreprises disparues\n` +
    ` * (etablissement ferme ET unite legale cessee). Les fiches belges (BCE) et celles\n` +
    ` * absentes des fichiers Stock n'ont pas d'etat connu : hors denominateur.\n` +
    ` * Aucun taux a publier sous ${SEUIL_TAUX} fiches verifiees (ETATS_META.seuilTaux).\n` +
    ` */\n` +
    `export const METIER_ETATS: Record<string, { verifies: number; fermes: number; disparus: number }> = ${JSON.stringify(metierEtats, null, 2)};\n\n` +
    `export const ETATS_META = {\n` +
    `  source: ${JSON.stringify(ETATS_SOURCE)},\n` +
    `  classementDu: ${JSON.stringify(CLASSEMENT_SIRENE_DU)},\n` +
    `  seuilTaux: ${SEUIL_TAUX},\n` +
    `  // France, 3 verticaux (batiment, services a domicile, aide a la personne)\n` +
    `  verifies: ${national.v},\n` +
    `  fermes: ${national.f},\n` +
    `  disparus: ${national.x},\n` +
    `  partFermes: ${part(national.f, national.v)},\n` +
    `  partDisparus: ${part(national.x, national.v)},\n` +
    `};\n\n` +
    `export const COVERAGE = {\n` +
    `  departments: ${deptCount || 0},\n` +
    `  communes: ${cityCount || 0},\n` +
    `  totalPros: ${total}, // fiches ouvertes, 3 verticaux, France + Belgique\n` +
    `  retrievedAt: ${JSON.stringify(retrievedAt)},\n` +
    `};\n`;
  const dest = path.resolve(process.cwd(), "lib/data/metier-stats.ts");
  fs.writeFileSync(dest, file);
  console.log(
    `\n${dest}\n   ${cats.length} metiers · ${total.toLocaleString("fr-FR")} fiches ouvertes (${national.t.toLocaleString("fr-FR")} actives) · ` +
      `France verifiees ${national.v.toLocaleString("fr-FR")} · fermes ${part(national.f, national.v)} % · disparues ${part(national.x, national.v)} % · ` +
      `${deptCount} depts · ${cityCount} communes · ${Math.round((Date.now() - debut) / 1000)} s`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
