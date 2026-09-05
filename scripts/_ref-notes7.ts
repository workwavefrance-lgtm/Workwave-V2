import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const { data: u, error: e1 } = await sb.from("lead_unlocks").select("id,pro_id,project_id,amount_cents,created_at").order("created_at");
  if (e1) console.log("lead_unlocks ERR", e1.message);
  else {
    console.log("lead_unlocks total :", u!.length);
    for (const x of u as any[]) console.log("   pro", x.pro_id, "projet", x.project_id, x.amount_cents+"c", String(x.created_at).slice(0,10));
  }
  const { count: nr, error: e2 } = await sb.from("pro_reviews").select("id",{count:"exact",head:true});
  console.log("pro_reviews en base :", e2 ? "ERR "+e2.message : nr);
  const { count: np } = await sb.from("projects").select("id",{count:"exact",head:true}).neq("status","deleted");
  console.log("projets (hors supprimes) :", np);
  const { count: nl } = await sb.from("project_leads").select("id",{count:"exact",head:true});
  console.log("project_leads :", nl);
  const { count: nc } = await sb.from("project_leads").select("id",{count:"exact",head:true}).not("contacted_at","is",null);
  console.log("project_leads marques contacted :", nc);
}
main().catch(e=>console.error(e.message));
