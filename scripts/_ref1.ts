import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
function hav(a1:number,o1:number,a2:number,o2:number){const R=6371,t=(x:number)=>x*Math.PI/180;const d1=t(a2-a1),d2=t(o2-o1);const x=Math.sin(d1/2)**2+Math.cos(t(a1))*Math.cos(t(a2))*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.sqrt(x));}

async function main(){
  // 1. Verif brute Sartrouville
  const { data: c } = await sb.from("categories").select("id,name,slug").eq("slug","nettoyage-vitres").single();
  const { data: v } = await sb.from("cities").select("id,name,latitude,longitude,population").eq("slug","sartrouville").limit(1).single();
  console.log("cat", c?.id, c?.name, "| ville", v?.id, v?.name, "pop", v?.population);
  const { count: n0 } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c!.id).eq("city_id",v!.id).is("deleted_at",null).eq("is_active",true).or(OUVERT);
  console.log("Sartrouville nettoyage-vitres ouverts en base :", n0);

  // 2. Pool 20 km autour de Sartrouville
  const dLat=0.30,dLng=0.42;
  const { data: villes } = await sb.from("cities").select("id,name,slug,latitude,longitude")
    .gte("latitude", v!.latitude!-dLat).lte("latitude", v!.latitude!+dLat)
    .gte("longitude", v!.longitude!-dLng).lte("longitude", v!.longitude!+dLng).limit(1000);
  const proches = (villes??[]).filter(x=>x.latitude!=null && hav(v!.latitude!,v!.longitude!,x.latitude!,x.longitude!)<=20);
  console.log("communes <=20km :", proches.length, "(sur", (villes??[]).length, "dans la bbox)");
  const { count: n20 } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c!.id).in("city_id",proches.map(x=>x.id)).is("deleted_at",null).eq("is_active",true).or(OUVERT);
  console.log("pros <=20km :", n20);

  // 3. ATTENTION bbox : 0.42 deg de longitude a lat 48.94 = combien de km ?
  const kmLng = hav(v!.latitude!, v!.longitude!, v!.latitude!, v!.longitude!+dLng);
  const kmLat = hav(v!.latitude!, v!.longitude!, v!.latitude!+dLat, v!.longitude!);
  console.log(`bbox reelle : +-${kmLat.toFixed(1)} km lat, +-${kmLng.toFixed(1)} km lng (donc pas de troncature si >=20)`);
  console.log("limit(1000) atteinte ?", (villes??[]).length===1000 ? "OUI -> pool sous-estime" : "non");
}
main().catch(e=>console.error(e));
