import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const TESTS = [4393, 99999, 1432477];

const c = async (t: string, f?: (q: any) => any) => {
  let q = sb.from(t).select("*", { count: "exact", head: true });
  if (f) q = f(q);
  const { count, error } = await q;
  return error ? `ERR ${error.message}` : count;
};

(async () => {
  console.log("PROS reclames        :", await c("pros", (q:any)=>q.not("claimed_by_user_id","is",null).not("id","in",`(${TESTS})`)));
  console.log("PROJETS total        :", await c("projects", (q:any)=>q.neq("status","deleted")));
  console.log("PROJETS 30 derniers j:", await c("projects", (q:any)=>q.neq("status","deleted").gte("created_at", new Date(Date.now()-30*864e5).toISOString())));
  console.log("PROJETS 7 derniers j :", await c("projects", (q:any)=>q.neq("status","deleted").gte("created_at", new Date(Date.now()-7*864e5).toISOString())));
  console.log("DEBLOCAGES payants   :", await c("lead_unlocks", (q:any)=>q.not("pro_id","in",`(${TESTS})`)));

  const { data: p } = await sb.from("projects")
    .select("id,created_at,broadcast_count,status,city:cities(name,department_id)")
    .neq("status","deleted").order("created_at",{ascending:false}).limit(40);
  const rows = p||[];
  const zero = rows.filter((r:any)=>!r.broadcast_count).length;
  console.log(`\n40 DERNIERS PROJETS : ${zero} broadcastes a PERSONNE (${Math.round(zero*100/rows.length)}%)`);
  console.log("detail des 12 derniers :");
  rows.slice(0,12).forEach((r:any)=>console.log(`  #${r.id} ${String(r.created_at).slice(0,10)} ${(r.city?.name||"?").padEnd(22)} -> ${r.broadcast_count??0} pro(s)`));
})();
