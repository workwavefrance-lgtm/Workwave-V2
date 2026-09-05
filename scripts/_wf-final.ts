import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const a = JSON.parse(fs.readFileSync("/tmp/wf-sirene-dp.json","utf8"));
const b = JSON.parse(fs.readFileSync("/tmp/wf-complement.json","utf8"));
const all = [...a, ...b.map((x:any)=>({naf:x.naf,d:x.d,tot:x.tot,count:x.count,slugs:[]}))];
const nafs = [...new Set(all.map((x:any)=>x.naf))].sort();
const CATS: Record<string,string> = {
 "3811Z":"debarras","3832Z":"debarras","4339Z":"petit-bricolage","4942Z":"demenagement",
 "5320Z":"livraison-de-courses","8121Z":"menage + nettoyage-pro","8122Z":"nettoyage-vitres",
 "8129A":"nettoyage-pro + traitement-nuisibles","8559A":"soutien-scolaire",
 "8559B":"soutien-scolaire + cours-particuliers","8810A":"aide-seniors","8891A":"garde-enfants",
 "8899A":"accompagnement-handicap","8899B":"aide-administrative","9522Z":"depannage-electromenager",
 "9601A":"repassage","9601B":"repassage","9609Z":"garde-animaux"};
let TS=0, TN=0;
console.log("NAF\tCATEGORIE(S)\tDEPTS\tSIRENE_OUVERTS\tNOUS_OUVERTS\tCOUVERTURE_%");
for(const n of nafs){
  const l = all.filter((x:any)=>x.naf===n && x.tot!==null && x.count!==null);
  const s = l.reduce((z:number,x:any)=>z+x.tot,0), c = l.reduce((z:number,x:any)=>z+x.count,0);
  TS+=s; TN+=c;
  console.log(`${n}\t${CATS[n]}\t${l.length}/5\t${s}\t${c}\t${((c/s)*100).toFixed(1)}`);
}
console.log(`\nTOTAL\t\t\t${TS}\t${TN}\t${((TN/TS)*100).toFixed(1)}`);
console.log(`Manquants sur ces 5 departements : ${TS-TN}`);
