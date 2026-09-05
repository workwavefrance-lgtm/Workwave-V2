import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main(){
  const sb=getServiceClient();
  const PAGE=1000; let offset=0; const slugs:string[]=[];
  while(true){
    let rows:any[]|null=null;
    for(let a=0;a<8&&!rows;a++){
      const {data,error}=await sb.from("pros").select("slug,is_active,deleted_at,google_reviews_count")
        .not("google_rating","is",null).order("id").range(offset,offset+PAGE-1)
        .abortSignal(AbortSignal.timeout(120_000));
      if(error){console.log(" retry",offset,error.message);await new Promise(r=>setTimeout(r,8000));continue;} rows=data||[];
    }
    if(!rows) throw new Error("fail");
    if(!rows.length) break;
    for(const r of rows) if(r.is_active&&!r.deleted_at&&(r.google_reviews_count??0)>0) slugs.push(r.slug);
    offset+=rows.length;
  }
  fs.writeFileSync("/tmp/rated_slugs.json",JSON.stringify(slugs));
  console.log("fiches actives notees =",slugs.length);
}
main();
