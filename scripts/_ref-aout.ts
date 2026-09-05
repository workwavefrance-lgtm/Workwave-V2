import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function c(f: (q: any) => any) {
  let q = sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
  const { count, error } = await f(q);
  if (error) throw new Error(error.message);
  return count as number;
}
(async () => {
  // Lot insere en aout 2026 (apres le fix curseur du 04/08) sur BdR plombier
  const base = (q: any) => q.eq("category_id", 1).like("postal_code", "13%").gte("created_at", "2026-08-01").lt("created_at", "2026-09-01");
  console.log("BdR plombier insere en aout 2026 : total", await c(base));
  console.log("  dont FERMES :", await c((q: any) => base(q).eq("etat_admin", "F")));
  console.log("  dont ouverts:", await c((q: any) => base(q).neq("etat_admin", "F")));

  const b2 = (q: any) => q.eq("category_id", 2).like("postal_code", "13%").gte("created_at", "2026-07-01").lt("created_at", "2026-08-01");
  console.log("\nBdR electricien insere en juillet 2026 : total", await c(b2));
  console.log("  dont FERMES :", await c((q: any) => b2(q).eq("etat_admin", "F")));

  // Part de fermes sur TOUTE la base
  const tot = await c((q: any) => q);
  const ferm = await c((q: any) => q.eq("etat_admin", "F"));
  console.log(`\nBASE ENTIERE : ${tot} actives, dont ${ferm} fermees (${((ferm / tot) * 100).toFixed(1)}%)`);
})();
