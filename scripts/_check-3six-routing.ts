import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function haversine(lat1:number,lng1:number,lat2:number,lng2:number){
  const R=6371,d=(x:number)=>x*Math.PI/180;
  const a=Math.sin(d(lat2-lat1)/2)**2+Math.cos(d(lat1))*Math.cos(d(lat2))*Math.sin(d(lng2-lng1)/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}
async function main() {
  const { data: pro } = await sb.from("pros")
    .select("id, name, category_id, intervention_radius_km, postal_code, categories(name), cities(name, latitude, longitude, departments(code))")
    .ilike("name", "%3SIX%").maybeSingle();
  const pc = pro?.cities as any; const cat = (pro?.categories as any)?.name;
  console.log(`PRO routé : ${pro?.name}`);
  console.log(`  Catégorie : ${cat} (#${pro?.category_id}) | Rayon : ${pro?.intervention_radius_km ?? "?"} km`);
  console.log(`  Ville : ${pc?.name} (${pc?.departments?.code}) | lat/lng: ${pc?.latitude},${pc?.longitude}`);

  // La Teste-de-Buch
  const { data: lt } = await sb.from("cities").select("name, latitude, longitude").ilike("name", "La Teste-de-Buch").maybeSingle();
  console.log(`\nLead : La Teste-de-Buch | lat/lng: ${lt?.latitude},${lt?.longitude}`);
  if (pc?.latitude && lt?.latitude) {
    const dist = haversine(pc.latitude, pc.longitude, lt.latitude, lt.longitude);
    console.log(`\n→ DISTANCE pro ↔ lead : ${dist} km  ${dist <= (pro?.intervention_radius_km||0) ? "✓ dans le rayon" : "⚠️ HORS rayon (routage trop large ?)"}`);
  }
}
main().catch(e=>{console.error(e.message);process.exit(1);});
