import fs from "fs";
const res = JSON.parse(fs.readFileSync("/tmp/wf-sirene-dates.json", "utf8"));
const an = (d: string) => Number(d.slice(0, 4));
const etab1900 = res.filter((r: any) => r.etab === "1900-01-01").length;
const unite1900 = res.filter((r: any) => r.unite === "1900-01-01").length;
const etabVieux = res.filter((r: any) => an(r.etab) < 1901).length;
const uniteVieux = res.filter((r: any) => an(r.unite) < 1901).length;
console.log(`sur ${res.length} etablissements de l'echantillon :`);
console.log(`  dateCreationEtablissement = 1900-01-01 : ${etab1900}`);
console.log(`  dateCreationUniteLegale   = 1900-01-01 : ${unite1900}`);
console.log(`  etablissement anterieur a 1901 : ${etabVieux} | unite legale anterieure a 1901 : ${uniteVieux}`);
const neg = res.filter((r: any) => r.etab && r.unite && an(r.etab) - an(r.unite) < 0);
console.log(`\n  cas ou l'ETABLISSEMENT est plus ancien que l'UNITE LEGALE : ${neg.length}`);
for (const n of neg.slice(0, 8)) console.log(`    ${n.siret} ${String(n.nom).slice(0,35).padEnd(37)} etab ${n.etab}  unite ${n.unite}`);
// Jour precis : combien de jours distincts dans chaque champ (pouvoir de distinction)
const jours = (k: string) => new Set(res.map((r: any) => r[k])).size;
console.log(`\n  valeurs distinctes sur ${res.length} fiches : etablissement ${jours("etab")}, unite legale ${jours("unite")}`);
const auPremierJanvier = (k: string) => res.filter((r: any) => r[k] && r[k].slice(5) === "01-01").length;
console.log(`  dates tombant au 1er janvier (marqueur de date approximative) : etablissement ${auPremierJanvier("etab")}, unite legale ${auPremierJanvier("unite")}`);
