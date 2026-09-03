/**
 * Genere lib/data/barometre-artisans.ts : classement densite d'entreprises
 * artisanales par departement + etat Sirene par departement.
 *   - Entreprises = fiches OUVERTES de notre base (etablissements non fermes
 *     d'apres le registre Sirene, regle FILTRE_OUVERTS). Avant le 03/09/2026 le
 *     script comptait toutes les fiches actives, dont 49,5 % de fermees.
 *   - Deux indicateurs par departement, uniques : part d'etablissements fermes
 *     et part d'entreprises disparues (etablissement ferme ET unite legale
 *     cessee), sur les fiches verifiees dans les fichiers Stock Sirene.
 *     Aucun taux sous SEUIL_TAUX (200) fiches verifiees (lecon du 07/06 :
 *     gater tout agregat sur la couverture).
 *   - Population = INSEE population municipale 2021 (/tmp/pop.csv si present,
 *     sinon les valeurs deja publiees dans lib/data/barometre-artisans.ts).
 * Densite = ouverts / population * 10 000. 0 invention. Mayotte exclu (pas de pop INSEE).
 * Donnees : scripts/lib/stats-etats.ts (RPC ou extraction, cf. son en-tete).
 * Usage : npx tsx scripts/build-barometre.ts [--extraire]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import {
  chargerStatsEtats,
  chargerPopulationDepts,
  part,
  CLASSEMENT_SIRENE_DU,
  ETATS_SOURCE,
  SEUIL_TAUX,
} from "./lib/stats-etats";

const VERTICAUX = ["btp", "domicile", "personne"];

type Ligne = {
  code: string; name: string; region: string;
  pros: number; actifs: number; verifies: number; fermes: number; disparus: number;
  partFermes: number | null; partDisparus: number | null;
  population: number; superficie: number; densite: number; rank?: number;
};

async function main() {
  const debut = Date.now();
  const sb = getServiceClient();
  const { parDept: insee, source: popSource } = await chargerPopulationDepts();
  console.log(`Population : ${popSource}`);

  const { data: depts, error } = await sb.from("departments").select("code,name,region").eq("country", "FR");
  if (error || !depts) throw error;

  const etats = await chargerStatsEtats({ forcerExtraction: process.argv.includes("--extraire") });
  const parDept = new Map<string, { t: number; o: number; v: number; f: number; x: number }>();
  for (const l of etats.lignes) {
    if (!VERTICAUX.includes(l.vertical) || l.k !== "FR" || !l.d) continue;
    const m = parDept.get(l.d) || { t: 0, o: 0, v: 0, f: 0, x: 0 };
    m.t += l.t; m.o += l.o; m.v += l.v; m.f += l.f; m.x += l.x;
    parDept.set(l.d, m);
  }

  const rows: Ligne[] = depts
    .map((d): Ligne | null => {
      const ins = insee[d.code];
      if (!ins || ins.pop <= 0) return null; // Mayotte etc. sans pop INSEE -> exclus
      const m = parDept.get(d.code) || { t: 0, o: 0, v: 0, f: 0, x: 0 };
      return {
        code: d.code,
        name: d.name,
        region: d.region,
        pros: m.o,
        actifs: m.t,
        verifies: m.v,
        fermes: m.f,
        disparus: m.x,
        partFermes: part(m.f, m.v),
        partDisparus: part(m.x, m.v),
        population: ins.pop,
        superficie: ins.superf,
        densite: +((m.o / ins.pop) * 10000).toFixed(1),
      };
    })
    .filter((r): r is Ligne => r !== null)
    .sort((a, b) => b.densite - a.densite)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const somme = (k: "pros" | "actifs" | "verifies" | "fermes" | "disparus") => rows.reduce((a, b) => a + b[k], 0);
  const totalPros = somme("pros");
  const nat = { actifs: somme("actifs"), verifies: somme("verifies"), fermes: somme("fermes"), disparus: somme("disparus") };
  const generatedAt = new Date().toISOString().slice(0, 10);

  const file =
    `// Barometre densite d'entreprises artisanales par departement + etat Sirene.\n` +
    `// Genere le ${generatedAt} par scripts/build-barometre.ts (donnees : ${etats.source}` +
    `${etats.source === "rpc" ? `, vue calculee le ${etats.calculeLe}` : ""}). NE PAS editer a la main.\n` +
    `// pros = fiches OUVERTES de notre base (source SIRENE, etablissements non fermes).\n` +
    `// actifs / verifies / fermes / disparus = ${ETATS_SOURCE}.\n` +
    `// partFermes = fermes / verifies, partDisparus = disparus / verifies (en %, null sous ${SEUIL_TAUX} fiches verifiees).\n` +
    `// Population = INSEE population municipale 2021. Densite = ouverts / population * 10 000. 0 invention.\n\n` +
    `export type BarometreDept = {\n  rank: number; code: string; name: string; region: string;\n` +
    `  pros: number; actifs: number; verifies: number; fermes: number; disparus: number;\n` +
    `  partFermes: number | null; partDisparus: number | null;\n` +
    `  population: number; superficie: number; densite: number;\n};\n\n` +
    `export const BAROMETRE_ARTISANS: BarometreDept[] = ${JSON.stringify(rows, null, 2)};\n\n` +
    `export const BAROMETRE_META = {\n` +
    `  totalPros: ${totalPros}, // fiches ouvertes, 100 departements\n` +
    `  totalActifs: ${nat.actifs},\n` +
    `  verifies: ${nat.verifies},\n  fermes: ${nat.fermes},\n  disparus: ${nat.disparus},\n` +
    `  partFermes: ${part(nat.fermes, nat.verifies)},\n  partDisparus: ${part(nat.disparus, nat.verifies)},\n` +
    `  nbDepts: ${rows.length},\n` +
    `  popSource: "INSEE, population municipale 2021",\n` +
    `  prosSource: "Répertoire SIRENE (INSEE), établissements ouverts",\n` +
    `  etatsSource: ${JSON.stringify(ETATS_SOURCE)},\n` +
    `  classementDu: ${JSON.stringify(CLASSEMENT_SIRENE_DU)},\n` +
    `  seuilTaux: ${SEUIL_TAUX},\n` +
    `  generatedAt: ${JSON.stringify(generatedAt)},\n};\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/barometre-artisans.ts"), file);

  const fmt = (r: Ligne) =>
    `#${String(r.rank).padStart(3)} ${r.code.padStart(3)} ${r.name.slice(0, 22).padEnd(22)} ${String(r.pros).padStart(6)} ouv. · ${String(r.population).padStart(9)} hab · ${r.densite}/10k · fermes ${r.partFermes ?? "n/a"} % · disparues ${r.partDisparus ?? "n/a"} %`;
  console.log("\n=== TOP 10 ===");
  rows.slice(0, 10).forEach((r) => console.log(fmt(r)));
  console.log("\n=== BOTTOM 10 ===");
  rows.slice(-10).forEach((r) => console.log(fmt(r)));
  const sansTaux = rows.filter((r) => r.partFermes === null).map((r) => r.code);
  console.log(
    `\nTotal : ${totalPros.toLocaleString("fr-FR")} ouvertes / ${nat.actifs.toLocaleString("fr-FR")} actives · ${rows.length} departements · ` +
      `France fermes ${part(nat.fermes, nat.verifies)} % · disparues ${part(nat.disparus, nat.verifies)} % · sans taux (< ${SEUIL_TAUX}) : ${sansTaux.length ? sansTaux.join(", ") : "aucun"} · ` +
      `${Math.round((Date.now() - debut) / 1000)} s · ecrit lib/data/barometre-artisans.ts`
  );
}
main().catch((e) => { console.error(e); process.exit(1); });
