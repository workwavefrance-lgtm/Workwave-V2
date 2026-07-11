/**
 * Agrège les VRAIES données data.gouv.fr (table commune_data : DVF prix immo,
 * FiLoSoFi revenus, LOVAC vacance) au niveau DÉPARTEMENT, et écrit un fichier
 * statique `lib/data/department-market.ts` (ISR-safe, aucune query au rendu).
 *
 * Sert le bloc "Marché immobilier en [dépt]" des pages listing /[metier]/[dept].
 *
 * Méthodo (honnête, documentée dans le rendu) :
 *  - prix m² moyen : moyenne pondérée par la population communale.
 *  - revenu médian : moyenne pondérée par la population des médianes communales.
 *  - taux de vacance : VRAI taux dept = Σ logements vacants / Σ logements privés.
 *  - logements vacants : somme.
 *  - nb communes : nombre de communes (couvertes par Workwave) avec donnée.
 *
 * Zéro chiffre inventé : tout est calculé à partir de commune_data (sourcé).
 * Usage : npx tsx scripts/build-department-market.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const DRY = process.argv.includes("--dry-run");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pagination robuste PostgREST (cap 1000 par défaut) — pattern canonique CLAUDE.md.
async function loadAll<T>(table: string, cols: string): Promise<T[]> {
  const PAGE = 1000;
  let offset = 0;
  const all: T[] = [];
  while (true) {
    const { data, error } = await sb
      .from(table)
      .select(cols)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data || []) as T[];
    if (rows.length === 0) break;
    all.push(...rows);
    offset += rows.length;
  }
  return all;
}

type City = { insee_code: string | null; department_id: number; population: number | null; country?: string | null };
type Dept = { id: number; code: string };
type Commune = {
  insee_code: string;
  prix_m2_moyen: number | null;
  revenu_median: number | null;
  taux_vacance: number | null;
  logements_vacants: number | null;
  logements_prive_total: number | null;
  dvf_annee: number | null;
  filosofi_annee: number | null;
  lovac_annee: number | null;
};

type Acc = {
  prixNum: number; prixDen: number; prixCount: number;   // Σ(prix·pop) / Σ(pop)
  revNum: number; revDen: number; revCount: number;      // Σ(rev·pop) / Σ(pop)
  vacVac: number; vacTotal: number; vacCount: number;    // Σvacants / Σtotal
  logVacants: number;                       // Σ logements vacants
  nbCommunes: number;
  dvfAnnee: number | null; filoAnnee: number | null; lovacAnnee: number | null;
};

export type DepartmentMarket = {
  prix_m2_moyen: number | null;
  revenu_median: number | null;
  taux_vacance: number | null;
  logements_vacants: number | null;
  nb_communes: number;
  dvf_annee: number | null;
  filosofi_annee: number | null;
  lovac_annee: number | null;
};

async function main() {
  console.log("Chargement departments / cities / commune_data…");
  const [depts, cities, communes] = await Promise.all([
    loadAll<Dept>("departments", "id, code"),
    // country inclus : commune_data est 100 % francaise (DVF/FiLoSoFi) et les
    // codes NIS belges chevauchent les INSEE (21004 = Cote-d'Or ET Bruxelles).
    // Sans le filtre ci-dessous, les stats d'un village francais seraient
    // agregees dans une province belge (et retirees de son vrai departement).
    loadAll<City>("cities", "insee_code, department_id, population, country"),
    loadAll<Commune>(
      "commune_data",
      "insee_code, prix_m2_moyen, revenu_median, taux_vacance, logements_vacants, logements_prive_total, dvf_annee, filosofi_annee, lovac_annee"
    ),
  ]);
  console.log(`  ${depts.length} depts · ${cities.length} cities · ${communes.length} commune_data`);

  const deptCodeById = new Map<number, string>(depts.map((d) => [d.id, d.code]));
  // insee_code -> { deptCode, population }
  const cityByInsee = new Map<string, { deptCode: string; pop: number }>();
  for (const c of cities) {
    if (!c.insee_code) continue;
    if ((c.country || "FR") !== "FR") continue; // BE : jamais joint a commune_data
    const code = deptCodeById.get(c.department_id);
    if (!code) continue;
    cityByInsee.set(c.insee_code, { deptCode: code, pop: c.population && c.population > 0 ? c.population : 1 });
  }

  const acc = new Map<string, Acc>();
  const ensure = (code: string): Acc => {
    let a = acc.get(code);
    if (!a) {
      a = { prixNum: 0, prixDen: 0, prixCount: 0, revNum: 0, revDen: 0, revCount: 0, vacVac: 0, vacTotal: 0, vacCount: 0, logVacants: 0, nbCommunes: 0, dvfAnnee: null, filoAnnee: null, lovacAnnee: null };
      acc.set(code, a);
    }
    return a;
  };

  for (const cd of communes) {
    const city = cityByInsee.get(cd.insee_code);
    if (!city) continue; // commune hors couverture Workwave
    const a = ensure(city.deptCode);
    const w = city.pop;
    let touched = false;
    if (cd.prix_m2_moyen != null) { a.prixNum += cd.prix_m2_moyen * w; a.prixDen += w; a.prixCount += 1; touched = true; if (cd.dvf_annee) a.dvfAnnee = cd.dvf_annee; }
    if (cd.revenu_median != null) { a.revNum += cd.revenu_median * w; a.revDen += w; a.revCount += 1; touched = true; if (cd.filosofi_annee) a.filoAnnee = cd.filosofi_annee; }
    if (cd.logements_vacants != null && cd.logements_prive_total != null && cd.logements_prive_total > 0) {
      a.vacVac += cd.logements_vacants; a.vacTotal += cd.logements_prive_total; a.vacCount += 1; touched = true;
      if (cd.lovac_annee) a.lovacAnnee = cd.lovac_annee;
    }
    if (cd.logements_vacants != null) a.logVacants += cd.logements_vacants;
    if (touched) a.nbCommunes += 1;
  }

  const out: Record<string, DepartmentMarket> = {};
  const dropped: string[] = [];
  for (const [code, a] of [...acc.entries()].sort()) {
    // Gate de représentativité : un stat n'est émis que s'il couvre assez de
    // communes du dépt (≥20 en absolu, OU ≥40% des communes couvertes). Évite
    // d'afficher un chiffre trompeur calculé sur 3-4 communes (ex. Haut-Rhin
    // 500 €/m² calculé sur une poignée de communes rurales → masqué).
    const ok = (count: number) => count >= 20 || count >= 0.4 * a.nbCommunes;
    const prixOk = a.prixDen > 0 && ok(a.prixCount);
    const revOk = a.revDen > 0 && ok(a.revCount);
    const vacOk = a.vacTotal > 0 && ok(a.vacCount);
    if (!prixOk && a.prixDen > 0) dropped.push(`${code} prix(${a.prixCount}/${a.nbCommunes})`);
    out[code] = {
      prix_m2_moyen: prixOk ? Math.round(a.prixNum / a.prixDen) : null,
      revenu_median: revOk ? Math.round(a.revNum / a.revDen) : null,
      taux_vacance: vacOk ? Math.round((a.vacVac / a.vacTotal) * 1000) / 10 : null,
      logements_vacants: vacOk && a.logVacants > 0 ? a.logVacants : null,
      nb_communes: a.nbCommunes,
      dvf_annee: prixOk ? a.dvfAnnee : null,
      filosofi_annee: revOk ? a.filoAnnee : null,
      lovac_annee: vacOk ? a.lovacAnnee : null,
    };
  }

  const nbDepts = Object.keys(out).length;
  console.log(`\n${nbDepts} départements agrégés :`);
  for (const [code, a] of [...acc.entries()].sort()) {
    const m = out[code];
    console.log(`  ${code.padEnd(4)} prix=${m.prix_m2_moyen ?? "—"}€/m²(${a.prixCount}) · revenu=${m.revenu_median ?? "—"}€(${a.revCount}) · vacance=${m.taux_vacance ?? "—"}%(${a.vacCount}) · ${m.nb_communes} communes`);
  }
  if (dropped.length) console.log(`\n⚠️ prix masqué (couverture insuffisante) : ${dropped.join(", ")}`);

  if (DRY) {
    console.log("\nDRY RUN — fichier non écrit.");
    return;
  }
  const file =
    `// Marché immobilier agrégé au niveau DÉPARTEMENT à partir de commune_data\n` +
    `// (data.gouv.fr : DVF prix, FiLoSoFi revenus, LOVAC vacance). Généré le\n` +
    `// ${new Date().toISOString().slice(0, 10)} par scripts/build-department-market.ts.\n` +
    `// NE PAS éditer à la main. Pondérations : prix/revenu par population communale,\n` +
    `// taux de vacance = Σ vacants / Σ logements privés. « zéro chiffre inventé ».\n\n` +
    `export type DepartmentMarket = {\n` +
    `  prix_m2_moyen: number | null;\n  revenu_median: number | null;\n` +
    `  taux_vacance: number | null;\n  logements_vacants: number | null;\n` +
    `  nb_communes: number;\n  dvf_annee: number | null;\n` +
    `  filosofi_annee: number | null;\n  lovac_annee: number | null;\n};\n\n` +
    `export const DEPARTMENT_MARKET: Record<string, DepartmentMarket> = ${JSON.stringify(out, null, 2)};\n`;
  const dest = path.resolve(process.cwd(), "lib/data/department-market.ts");
  fs.writeFileSync(dest, file);
  console.log(`\n📝 Écrit ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
