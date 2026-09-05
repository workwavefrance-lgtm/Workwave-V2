import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const R = 6371;
const hav = (a:number,b:number,c:number,d:number)=>{const t=(x:number)=>x*Math.PI/180;const dLat=t(c-a),dLon=t(d-b);const x=Math.sin(dLat/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x));};
(async () => {
  const { data: pros } = await sb.from("pros")
    .select("id,name,intervention_radius_km,city:cities(name,latitude,longitude)")
    .not("claimed_by_user_id","is",null).eq("is_active",true).is("deleted_at",null);
  const claimed = (pros||[]).filter((p:any)=>p.city?.latitude);
  console.log("pros reclames geolocalises :", claimed.length);

  // communes candidates : loin de tout pro reclame
  const { data: villes } = await sb.from("cities")
    .select("id,name,slug,latitude,longitude,population")
    .not("latitude","is",null).gte("population", 800).lte("population", 5000).limit(1000);

  let best: any = null;
  for (const v of (villes||[])) {
    let min = Infinity;
    for (const p of claimed) {
      const d = hav(v.latitude, v.longitude, (p as any).city.latitude, (p as any).city.longitude);
      const marge = d - ((p as any).intervention_radius_km ?? 20);
      if (marge < min) min = marge;
    }
    if (!best || min > best.min) best = { ...v, min };
  }
  console.log(`\nCOMMUNE LA PLUS ISOLEE : ${best.name} (id ${best.id}, ${best.population} hab.)`);
  console.log(`   pro reclame le plus proche : ${Math.round(best.min)} km AU-DELA de son rayon d'intervention`);
  console.log(`   => broadcast attendu : 0 pro`);
})();
