import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { haversineKm } from "../lib/utils/haversine";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";

async function prosDansRayon(catId:number, lat:number, lng:number, rayon:number) {
  const dLat = rayon/111, dLng = rayon/(111*Math.cos(lat*Math.PI/180));
  const { data: villes } = await sb.from("cities").select("id,latitude,longitude")
    .gte("latitude",lat-dLat).lte("latitude",lat+dLat).gte("longitude",lng-dLng).lte("longitude",lng+dLng).limit(1000);
  const ids = (villes??[]).filter(v=>v.latitude!=null && haversineKm(lat,lng,v.latitude!,v.longitude!)<=rayon).map(v=>v.id);
  if (!ids.length) return new Set<number>();
  const out = new Set<number>(); let off=0;
  while(true){ const {data}=await sb.from("pros").select("id").eq("category_id",catId).in("city_id",ids)
      .is("deleted_at",null).eq("is_active",true).or(OUVERT).range(off,off+999);
    const rows=data||[]; if(!rows.length)break; rows.forEach(p=>out.add(p.id)); off+=rows.length; }
  return out;
}
function jac(a:Set<number>,b:Set<number>){ let inter=0; a.forEach(x=>{if(b.has(x))inter++;}); const u=a.size+b.size-inter; return u? inter/u : 0; }

async function main() {
  const { data: cat } = await sb.from("categories").select("id,slug").eq("slug","nettoyage-vitres").single();
  const { data: ref } = await sb.from("cities").select("id,name,slug,latitude,longitude").eq("slug","sartrouville").limit(1).single();
  if (!cat || !ref) return;
  // les 6 communes voisines les plus proches (celles qui ont AUSSI une page listing)
  const dLat=0.15,dLng=0.21;
  const { data: vois } = await sb.from("cities").select("id,name,slug,latitude,longitude,population")
    .gte("latitude",ref.latitude!-dLat).lte("latitude",ref.latitude!+dLat)
    .gte("longitude",ref.longitude!-dLng).lte("longitude",ref.longitude!+dLng).limit(1000);
  const proches = (vois??[]).filter(v=>v.id!==ref.id && v.latitude!=null)
    .map(v=>({...v,d:haversineKm(ref.latitude!,ref.longitude!,v.latitude!,v.longitude!)}))
    .sort((a,b)=>a.d-b.d).slice(0,6);

  for (const rayon of [10,20]) {
    console.log(`\n=== RAYON ${rayon} km, categorie nettoyage-vitres ===`);
    const base = await prosDansRayon(cat.id, ref.latitude!, ref.longitude!, rayon);
    console.log(`  ${ref.name} : ${base.size} pros dans le rayon`);
    for (const v of proches) {
      const s = await prosDansRayon(cat.id, v.latitude!, v.longitude!, rayon);
      console.log(`   vs ${v.name.padEnd(22)} (${v.d.toFixed(1)} km) : ${String(s.size).padStart(5)} pros | recouvrement Jaccard ${(100*jac(base,s)).toFixed(1)}%`);
    }
  }
  // situation ACTUELLE (commune seule) pour comparaison
  console.log(`\n=== ACTUEL (commune seule) ===`);
  const { count: n0 } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",cat.id).eq("city_id",ref.id).is("deleted_at",null).eq("is_active",true).or(OUVERT);
  console.log(`  ${ref.name} : ${n0} pros`);
  for (const v of proches) {
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",cat.id).eq("city_id",v.id).is("deleted_at",null).eq("is_active",true).or(OUVERT);
    console.log(`   ${v.name.padEnd(22)} (${v.d.toFixed(1)} km) : ${count} pros | recouvrement 0% par construction (city_id disjoints)`);
  }
}
main().catch(e=>console.error(e.message));
