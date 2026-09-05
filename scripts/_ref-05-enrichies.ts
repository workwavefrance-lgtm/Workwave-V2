/** REFUTATION 5 : quelle part du parc porte deja les faits distinctifs
 *  (enrichissement annuaire + reperes) sur lesquels la variante s'applique ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
async function c(f:(q:any)=>any, label:string) {
  let q = sb.from("pros").select("id", { count: "exact", head: true });
  q = f(q);
  const { count, error } = await q;
  console.log(`${label.padEnd(58)} ${error ? "ERREUR "+error.message : String(count)}`);
  return count || 0;
}
(async () => {
  const actifs = await c((q:any)=>q.eq("is_active",true).is("deleted_at",null), "fiches actives");
  await c((q:any)=>q.eq("is_active",true).is("deleted_at",null).neq("etat_admin","F"), "  dont etablissement OUVERT");
  const enr = await c((q:any)=>q.eq("is_active",true).is("deleted_at",null).not("sirene_enrichi_at","is",null), "  dont enrichies annuaire (sirene_enrichi_at non nul)");
  await c((q:any)=>q.eq("is_active",true).is("deleted_at",null).not("founding_date","is",null), "  dont date de creation complete (founding_date)");
  await c((q:any)=>q.eq("is_active",true).is("deleted_at",null).not("effectif_range","is",null), "  dont tranche d'effectif connue");
  await c((q:any)=>q.eq("is_active",true).is("deleted_at",null).not("description","is",null), "  dont description redigee");
  await c((q:any)=>q.eq("is_active",true).is("deleted_at",null).not("claimed_by_user_id","is",null), "  dont reclamee par le pro");
  console.log(`\npart enrichie : ${((enr/actifs)*100).toFixed(3)} % du parc actif`);
})();
