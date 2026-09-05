import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main(){
  const sb=getServiceClient();
  const {data}=await sb.from("projects").select("id,status,created_at,review_requested_at,email,broadcast_count");
  const rows=data as any[];
  console.log("projets total =",rows.length);
  const by:Record<string,number>={};
  for(const r of rows) by[r.status??"null"]=(by[r.status??"null"]||0)+1;
  console.log("par status :",JSON.stringify(by,null,1));
  const sept=new Date(); sept.setDate(sept.getDate()-7);
  const elig=rows.filter(r=>r.status==="routed" && !r.review_requested_at && r.email && new Date(r.created_at)<sept);
  console.log("\nELIGIBLES au cron avis (status=routed, >7j, email, pas deja sollicite) =",elig.length);
  const routed=rows.filter(r=>r.status==="routed");
  console.log("status=routed (tous ages) =",routed.length);
  console.log("deja sollicites (review_requested_at non nul) =",rows.filter(r=>r.review_requested_at).length);
  const d30=new Date(); d30.setDate(d30.getDate()-30);
  console.log("projets deposes sur 30 jours =",rows.filter(r=>new Date(r.created_at)>d30).length);
  console.log("dont status=routed =",rows.filter(r=>new Date(r.created_at)>d30&&r.status==="routed").length);
}
main();
