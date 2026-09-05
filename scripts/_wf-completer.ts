import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const envScrape = fs.readFileSync(path.resolve(process.cwd(), "scraping/.env"), "utf8");
const KEY = (envScrape.match(/^INSEE_API_KEY=(.+)$/m) || [])[1]!.trim();
const BASE = "https://api.insee.fr/api-sirene/3.11/siret";
const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";
const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
function fmtNaf(c:string){return c.length===5&&!c.includes(".")?c.slice(0,2)+"."+c.slice(2):c;}
async function sireneTotal(naf:string,dept:string,retry=0):Promise<number|null>{
  const q=`periode(activitePrincipaleEtablissement:${fmtNaf(naf)} AND etatAdministratifEtablissement:A) AND codePostalEtablissement:[${dept}000 TO ${dept}999] AND -periode(etatAdministratifEtablissement:F)`;
  const r=await fetch(`${BASE}?q=${encodeURIComponent(q)}&nombre=1&curseur=*`,{headers:{"X-INSEE-Api-Key-Integration":KEY,Accept:"application/json"}});
  if(r.status===404)return 0;
  if((r.status===429||r.status===503)&&retry<4){await sleep(30000);return sireneTotal(naf,dept,retry+1);}
  if(!r.ok)return null;
  const j:any=await r.json(); return j?.header?.total??null;
}
async function cityIds(deptCode:string){
  const {data:d,error}=await sb.from("departments").select("id").eq("code",deptCode).single();
  if(error)throw error;
  const ids:number[]=[];let off=0;
  while(true){const {data,error:e}=await sb.from("cities").select("id").eq("department_id",d.id).range(off,off+999);
    if(e)throw e; if(!data||data.length===0)break; ids.push(...data.map((r:any)=>r.id)); off+=data.length;}
  return ids;
}
async function compte(naf:string,ids:number[],ouvertsOnly:boolean,essai=0):Promise<number|null>{
  let q=sb.from("pros").select("id",{count:"exact",head:true}).eq("naf_code",naf).in("city_id",ids)
    .eq("is_active",true).is("deleted_at",null);
  if(ouvertsOnly)q=q.or(OUVERTS);
  const {count,error}=await q;
  if(error){ if(essai<3){await sleep(4000);return compte(naf,ids,ouvertsOnly,essai+1);} console.error("  ECHEC count",naf,error.message); return null;}
  return count!;
}
const MISS:[string,string][]=[["4942Z","75"],["8122Z","59"],["8559A","33"],["8810A","33"],["8899B","13"],
  ["9522Z","75"],["9522Z","69"],["9601B","75"],["9601B","69"],["9609Z","59"]];
(async()=>{
  const cache:Record<string,number[]>={};
  const out:any[]=[];
  for(const [naf,d] of MISS){
    if(!cache[d])cache[d]=await cityIds(d);
    const tot=await sireneTotal(naf,d); await sleep(1600);
    const c=await compte(naf,cache[d],true);
    console.log(`${naf}\t${d}\t${tot}\t${c}\t${tot&&c!==null?((c/tot)*100).toFixed(1):"?"}`);
    out.push({naf,d,tot,count:c});
  }
  fs.writeFileSync("/tmp/wf-complement.json",JSON.stringify(out,null,1));
})();
