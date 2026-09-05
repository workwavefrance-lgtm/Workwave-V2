import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main(){
  const sb=getServiceClient();
  // Methode 2 : parcours en ordre DESC (independant du precedent)
  let total=0; const ids:number[]=[]; let last=Number.MAX_SAFE_INTEGER;
  while(true){
    let rows:any[]|null=null;
    for(let a=0;a<8&&!rows;a++){
      const {data,error}=await sb.from("pros").select("id")
        .not("google_rating","is",null).lt("id",last).order("id",{ascending:false}).limit(1000)
        .abortSignal(AbortSignal.timeout(120_000));
      if(error){await new Promise(r=>setTimeout(r,6000));continue;} rows=data||[];
    }
    if(!rows||!rows.length) break;
    total+=rows.length; for(const r of rows) ids.push(r.id);
    last=rows[rows.length-1].id;
  }
  console.log("METHODE 2 (ordre DESC) : pros avec google_rating =",total);
  ids.sort((a,b)=>a-b);
  // clustering : combien de blocs contigus de 1000 ids contiennent des notes
  const maxId=4440939;
  const buckets=new Map<number,number>();
  for(const id of ids){ const b=Math.floor(id/50000); buckets.set(b,(buckets.get(b)||0)+1); }
  console.log("\nRepartition par tranche de 50 000 ids (sur", Math.ceil(maxId/50000),"tranches possibles) :");
  const nz=[...buckets.entries()].sort((a,b)=>a[0]-b[0]);
  console.log("  tranches NON VIDES :",nz.length);
  for(const [b,n] of nz) console.log(`    ids ${b*50000}-${(b+1)*50000-1} : ${n} pros notes`);
}
main();
