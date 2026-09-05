import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), "scraping/.env"), override: true });

const CLE = process.env.INSEE_API_KEY!;
const URL = "https://api.insee.fr/api-sirene/3.11/siret";
const dodo = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function lot(sirets: string[]): Promise<any[]> {
  const q = sirets.map((s) => `siret:${s}`).join(" OR ");
  const u = `${URL}?q=${encodeURIComponent(q)}&nombre=${sirets.length}&curseur=*`;
  for (let essai = 1; essai <= 4; essai++) {
    const r = await fetch(u, { headers: { "X-INSEE-Api-Key-Integration": CLE, Accept: "application/json" } });
    if (r.status === 429) { await dodo(5000 * essai); continue; }
    if (!r.ok) { console.log(`  HTTP ${r.status} : ${(await r.text()).slice(0, 200)}`); await dodo(3000); continue; }
    const j: any = await r.json();
    return j.etablissements || [];
  }
  return [];
}

(async () => {
  const ech = JSON.parse(fs.readFileSync("/tmp/wf-echantillon-ancien.json", "utf8"));
  const sirets: string[] = ech.map((e: any) => e.siret).filter(Boolean);
  const parSiret = new Map<string, any>(ech.map((e: any) => [e.siret, e]));
  console.log(`echantillon : ${sirets.length} SIRET des lignes creees par le run du 05/09`);

  const res: any[] = [];
  for (let i = 0; i < sirets.length; i += 30) {
    const b = sirets.slice(i, i + 30);
    const etabs = await lot(b);
    for (const e of etabs) {
      res.push({
        siret: e.siret,
        etab: e.dateCreationEtablissement || null,
        unite: e.uniteLegale?.dateCreationUniteLegale || null,
        base: parSiret.get(e.siret)?.founding_date || null,
        nom: parSiret.get(e.siret)?.name,
      });
    }
    process.stdout.write(`\r  ${res.length} etablissements recus (lot ${i / 30 + 1}/${Math.ceil(sirets.length / 30)})   `);
    await dodo(1600);
  }
  console.log("");

  const an = (d: string | null) => (d ? Number(d.slice(0, 4)) : null);
  let differents = 0, ecarts: number[] = [], sansUnite = 0, sansEtab = 0;
  let baseEgaleEtab = 0, baseEgaleUnite = 0;
  const pires: any[] = [];
  for (const r of res) {
    if (!r.etab) sansEtab++;
    if (!r.unite) { sansUnite++; continue; }
    if (r.base === r.etab) baseEgaleEtab++;
    if (r.base === r.unite) baseEgaleUnite++;
    if (r.etab && r.unite && r.etab !== r.unite) {
      differents++;
      const e = (an(r.etab)! - an(r.unite)!);
      ecarts.push(e);
      pires.push({ ...r, ecartAnnees: e });
    }
  }
  const n = res.length;
  console.log(`\nreponses Sirene : ${n}`);
  console.log(`  sans dateCreationEtablissement : ${sansEtab}`);
  console.log(`  sans dateCreationUniteLegale   : ${sansUnite}`);
  console.log(`  ce qu'on a ecrit en base = date ETABLISSEMENT : ${baseEgaleEtab} (${((baseEgaleEtab / n) * 100).toFixed(1)} %)`);
  console.log(`  ce qu'on a ecrit en base = date UNITE LEGALE  : ${baseEgaleUnite} (${((baseEgaleUnite / n) * 100).toFixed(1)} %)`);
  console.log(`\n  dates DIFFERENTES (etablissement != unite legale) : ${differents} sur ${n} (${((differents / n) * 100).toFixed(1)} %)`);
  if (ecarts.length) {
    const moy = ecarts.reduce((a, b) => a + b, 0) / ecarts.length;
    const tri = [...ecarts].sort((a, b) => a - b);
    console.log(`  ecart en annees sur ces ${differents} : moyenne ${moy.toFixed(2)}, mediane ${tri[Math.floor(tri.length / 2)]}, max ${tri[tri.length - 1]}, min ${tri[0]}`);
    const paliers = [0, 1, 2, 5, 10, 20];
    for (let i = 0; i < paliers.length; i++) {
      const bas = paliers[i], haut = paliers[i + 1] ?? 999;
      const c = ecarts.filter((x) => x >= bas && x < haut).length;
      console.log(`    ecart >= ${bas} et < ${haut === 999 ? "inf" : haut} an(s) : ${c}`);
    }
    // Ecart en annees sur TOUT l'echantillon (0 quand les dates coincident)
    const tous = res.filter((r) => r.etab && r.unite).map((r) => an(r.etab)! - an(r.unite)!);
    const moyTous = tous.reduce((a, b) => a + b, 0) / tous.length;
    console.log(`  ecart moyen sur l'ensemble des ${tous.length} etablissements : ${moyTous.toFixed(2)} an(s)`);
    const diffAnnee = tous.filter((x) => x !== 0).length;
    console.log(`  ANNEE differente (pas seulement le jour) : ${diffAnnee} (${((diffAnnee / tous.length) * 100).toFixed(1)} %)`);
  }
  pires.sort((a, b) => b.ecartAnnees - a.ecartAnnees);
  console.log("\n  les 10 plus gros ecarts :");
  for (const p of pires.slice(0, 10)) console.log(`    ${p.siret} ${String(p.nom).slice(0, 40).padEnd(42)} etab ${p.etab}  unite ${p.unite}  (${p.ecartAnnees} ans)`);
  fs.writeFileSync("/tmp/wf-sirene-dates-ancien.json", JSON.stringify(res, null, 1));
})();
