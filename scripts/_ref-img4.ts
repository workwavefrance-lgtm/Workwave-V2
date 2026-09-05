import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function main() {
  // La 1re tranche du script de l'audit : gte(id,0) order(id) limit(1000)
  const { data } = await sb.from("pros").select("id,photos,logo_url")
    .is("deleted_at",null).eq("is_active",true).or(OUVERT).gte("id",0).order("id").limit(1000);
  const rows = data ?? [];
  const avecPhoto = rows.filter(r => Array.isArray(r.photos) && r.photos.length > 0).length;
  console.log(`1re tranche du script de l'audit : ids ${rows[0]?.id} a ${rows[rows.length-1]?.id}`);
  console.log(`  fiches a photo dans cette seule tranche : ${avecPhoto} / 1000`);
  console.log(`  fiches a logo dans cette seule tranche  : ${rows.filter(r=>r.logo_url).length} / 1000`);
  // Combien de fiches a photo dans toute la table sous id 100000
  const c = await sb.from("pros").select("id",{count:"exact",head:true})
    .is("deleted_at",null).eq("is_active",true).neq("photos","[]").not("photos","is",null).lt("id",100000);
  console.log(`fiches a photo avec id < 100 000 (zone Vienne, enrichie Apify) : ${c.count} sur 203`);
  const tot = await sb.from("pros").select("id",{count:"exact",head:true}).is("deleted_at",null).eq("is_active",true).lt("id",100000);
  console.log(`fiches actives avec id < 100 000 : ${tot.count} (soit ${(100*(tot.count??0)/2439976).toFixed(2)}% de la base)`);
}
main().catch(e=>console.error(e.message));
