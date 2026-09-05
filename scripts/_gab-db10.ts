import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
function hav(a1:number,o1:number,a2:number,o2:number){const R=6371,t=(x:number)=>x*Math.PI/180;const d1=t(a2-a1),d2=t(o2-o1);const x=Math.sin(d1/2)**2+Math.cos(t(a1))*Math.cos(t(a2))*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
async function main() {
  const cases: [string,string][] = [["nettoyage-vitres","sartrouville"],["climaticien","lyon"],["plaquiste","cluny"],["menuisier","samer"],["debarras","gardanne"],["plombier","poitiers"]];
  for (const [cs,vs] of cases) {
    const { data: c } = await sb.from("categories").select("id,name").eq("slug",cs).single();
    const { data: v } = await sb.from("cities").select("id,name,latitude,longitude,department_id").eq("slug",vs).limit(1).single();
    if(!c||!v||v.latitude==null) { console.log(cs,vs,"pas de coords"); continue; }
    // bbox ~ 25 km
    const dLat=0.30, dLng=0.42;
    const { data: villes } = await sb.from("cities").select("id,name,latitude,longitude")
      .gte("latitude", v.latitude-dLat).lte("latitude", v.latitude+dLat)
      .gte("longitude", v.longitude-dLng).lte("longitude", v.longitude+dLng).limit(1000);
    const proche = (villes??[]).filter(x=>x.latitude!=null && hav(v.latitude!,v.longitude!,x.latitude!,x.longitude!)<=20).map(x=>x.id);
    const { count: n0 } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c.id).eq("city_id",v.id).is("deleted_at",null).eq("is_active",true).or(OUVERT);
    const { count: n20 } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c.id).in("city_id",proche).is("deleted_at",null).eq("is_active",true).or(OUVERT);
    console.log(`${cs} x ${v.name}`.padEnd(34), `commune seule : ${String(n0).padStart(4)}  |  <=20 km (${proche.length} communes) : ${String(n20).padStart(5)}  | facteur x${((n20??0)/Math.max(n0??1,1)).toFixed(1)}`);
  }
}
main().catch(e=>console.error(e.message));
