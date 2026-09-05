import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function main() {
  const { data: mm } = await sb.from("pros").select("id").order("id",{ascending:false}).limit(1);
  const maxId = mm![0].id as number;
  const rows: any[] = [];
  for (let k=0;k<25;k++){
    const { data } = await sb.from("pros").select("id,phone,email,website,siret,name,city_id,category_id").is("deleted_at",null).eq("is_active",true).or(OUVERT).gte("id", Math.floor(maxId/25*k)).order("id").limit(1000);
    rows.push(...(data??[]));
  }
  const n = rows.length;
  const aucun = rows.filter(r=>!r.phone && !r.email && !r.website).length;
  console.log(`echantillon ${n} fiches ouvertes`);
  console.log(`  AUCUN moyen de contact (ni tel, ni email, ni site) : ${aucun}/${n} = ${(100*aucun/n).toFixed(2)}%`);
  // doublons SIREN dans une meme (categorie, ville)
  const par: Record<string, string[]> = {};
  for (const r of rows) { const k=r.category_id+"|"+r.city_id; (par[k] ??= []).push(String(r.siret??"").slice(0,9)); }
  let couples=0, avecDoublon=0;
  for (const [k,sirens] of Object.entries(par)) { if (sirens.length<2) continue; couples++; if (new Set(sirens).size < sirens.length) avecDoublon++; }
  console.log(`  couples (metier,ville) a >=2 fiches dans l'echantillon : ${couples} | dont au moins 2 fiches du MEME SIREN : ${avecDoublon} (${(100*avecDoublon/Math.max(couples,1)).toFixed(1)}%)`);
}
main().catch(e=>console.error(e.message));
