import fs from "fs";
const a = JSON.parse(fs.readFileSync("/tmp/wf-sirene-dates.json", "utf8"));
const b = JSON.parse(fs.readFileSync("/tmp/wf-sirene-dates-ancien.json", "utf8"));
const AN = 2026;
function bilan(nom: string, res: any[]) {
  const an = (d: string) => Number(d.slice(0, 4));
  const ok = res.filter((r) => r.etab && r.unite);
  const sousEstime = ok.filter((r) => an(r.etab) > an(r.unite));
  const surEstime = ok.filter((r) => an(r.etab) < an(r.unite));
  const g5 = sousEstime.filter((r) => an(r.etab) - an(r.unite) >= 5).length;
  const g10 = sousEstime.filter((r) => an(r.etab) - an(r.unite) >= 10).length;
  const g20 = sousEstime.filter((r) => an(r.etab) - an(r.unite) >= 20).length;
  console.log(`\n${nom} (${ok.length} etablissements)`);
  console.log(`  age SOUS-estime (etablissement plus recent que l'entreprise) : ${sousEstime.length} (${(sousEstime.length/ok.length*100).toFixed(1)} %)`);
  console.log(`    dont >= 5 ans : ${g5} | >= 10 ans : ${g10} | >= 20 ans : ${g20}`);
  console.log(`  age SUR-estime : ${surEstime.length} (${(surEstime.length/ok.length*100).toFixed(1)} %)`);
  const perdues = sousEstime.reduce((s, r) => s + an(r.etab) - an(r.unite), 0);
  console.log(`  annees d'anciennete non affichees, en tout : ${perdues} sur ${ok.length} fiches`);
  const zero = ok.filter((r) => AN - an(r.etab) <= 0 && AN - an(r.unite) >= 1).length;
  console.log(`  fiches affichant "moins d'un an" alors que l'entreprise a au moins 1 an : ${zero}`);
}
bilan("Lignes creees par le run du 05/09, 19 departements denses, BTP", a);
bilan("Lignes anterieures au run, tirees dans toute la base", b);
bilan("Les deux echantillons reunis", [...a, ...b]);
