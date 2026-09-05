import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const t = await sb.from("cities").select("id",{count:"exact",head:true});
  const g = await sb.from("cities").select("id",{count:"exact",head:true}).not("latitude","is",null).not("longitude","is",null);
  console.log(`communes : ${t.count} | avec latitude+longitude : ${g.count} (${(100*(g.count??0)/(t.count??1)).toFixed(2)}%)`);
  // adresse au niveau du pro (une carte "de l'adresse" demande l'adresse du pro, pas de la commune)
  const p = await sb.from("pros").select("id",{count:"exact",head:true}).is("deleted_at",null).eq("is_active",true).not("address","is",null);
  console.log(`pros actifs avec une adresse renseignee : ${p.count} / 2439976`);
  const pl = await sb.from("pros").select("id",{count:"exact",head:true}).is("deleted_at",null).eq("is_active",true).not("latitude","is",null);
  console.log(`pros actifs avec latitude propre : ${pl.count ?? "colonne absente"}`);
}
main().catch(e=>console.error("erreur:", e.message));
