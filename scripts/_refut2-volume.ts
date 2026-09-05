import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const c = async (t: string, f: (q: any) => any) => {
    const r = await f(sb.from(t).select("*", { count: "exact", head: true }));
    return r.error ? `ERR ${r.error.message}` : r.count;
  };
  console.log("pros reclames :", await c("pros", (q:any)=>q.not("claimed_by_user_id","is",null)));
  console.log("projects total :", await c("projects", (q:any)=>q));
  console.log("projects vivants (status <> deleted) :", await c("projects", (q:any)=>q.neq("status","deleted")));
  console.log("lead_unlocks (deblocages payes) :", await c("lead_unlocks", (q:any)=>q));
  const { data: lu } = await sb.from("lead_unlocks").select("pro_id,amount_cents,created_at").order("created_at");
  console.log("detail deblocages :", lu);
  console.log("project_leads total :", await c("project_leads", (q:any)=>q));
  console.log("project_leads contactes :", await c("project_leads", (q:any)=>q.eq("status","contacted")));
})();
