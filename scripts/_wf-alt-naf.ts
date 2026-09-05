import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const envS=fs.readFileSync(path.resolve(process.cwd(),"scraping/.env"),"utf8");
const KEY=(envS.match(/^INSEE_API_KEY=(.+)$/m)||[])[1]!.trim();
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
function f(c:string){return c.slice(0,2)+"."+c.slice(2);}
async function tot(naf:string,d:string):Promise<number|null>{
  const q=`periode(activitePrincipaleEtablissement:${f(naf)} AND etatAdministratifEtablissement:A) AND codePostalEtablissement:[${d}000 TO ${d}999] AND -periode(etatAdministratifEtablissement:F)`;
  const r=await fetch(`https://api.insee.fr/api-sirene/3.11/siret?q=${encodeURIComponent(q)}&nombre=1&curseur=*`,
    {headers:{"X-INSEE-Api-Key-Integration":KEY,Accept:"application/json"}});
  if(r.status===404)return 0; if(!r.ok)return null;
  const j:any=await r.json(); return j?.header?.total??null;
}
(async()=>{
  const D=["75","13","69","59","33"];
  for(const n of ["8810B","8891B"]){
    const v:number[]=[];
    for(const d of D){const t=await tot(n,d); v.push(t??-1); await sleep(3000);}
    console.log(`${n}\t${D.map((d,i)=>d+":"+v[i]).join(" | ")}\ttotal ${v.reduce((a,b)=>a+b,0)}`);
  }
})();
