import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function c(f: (q: any) => any) {
  const { count, error } = await f(sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null));
  if (error) throw new Error(error.message);
  return count as number;
}
(async () => {
  for (const [lbl, cat, mois] of [["BdR plombier aout", 1, "2026-08"], ["BdR electricien juillet", 2, "2026-07"], ["Paris plombier juillet", 1, "2026-07"]] as const) {
    const cp = lbl.startsWith("Paris") ? "75" : "13";
    const next = mois === "2026-08" ? "2026-09-01" : "2026-08-01";
    const b = (q: any) => q.eq("category_id", cat).like("postal_code", cp + "%").gte("created_at", mois + "-01").lt("created_at", next);
    console.log(`${lbl}: total=${await c(b)} F=${await c((q:any)=>b(q).eq("etat_admin","F"))} A=${await c((q:any)=>b(q).eq("etat_admin","A"))} NULL=${await c((q:any)=>b(q).is("etat_admin",null))}`);
  }
  const tot = await c((q:any)=>q);
  console.log(`\nBase: total=${tot} F=${await c((q:any)=>q.eq("etat_admin","F"))} A=${await c((q:any)=>q.eq("etat_admin","A"))} NULL=${await c((q:any)=>q.is("etat_admin",null))}`);
})();
