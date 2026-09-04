import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { haversineKm } from "../lib/utils/haversine";
const sb = getServiceClient();
(async () => {
  const { data: proj } = await sb.from("projects").select("id, category_id, city_id, cities(name, latitude, longitude)").eq("id", 218).single();
  const p = proj as any; const lat = p.cities.latitude, lng = p.cities.longitude;
  const { data: villes } = await sb.from("cities").select("id, name, latitude, longitude")
    .gte("latitude", lat - 0.35).lte("latitude", lat + 0.35).gte("longitude", lng - 0.5).lte("longitude", lng + 0.5);
  const proches = (villes || []).filter((v: any) => v.latitude && haversineKm(lat, lng, v.latitude, v.longitude) <= 30);
  console.log(`projet #218 : macon a ${p.cities.name} · ${proches.length} communes a moins de 30 km`);
  const ids = proches.map((v: any) => v.id);
  const res = { total: 0, avecEmail: 0, avecTel: 0, reclames: 0 };
  for (let i = 0; i < ids.length; i += 200) {
    const lot = ids.slice(i, i + 200);
    const { data } = await sb.from("pros").select("id, name, email, phone, claimed_by_user_id, do_not_contact")
      .eq("category_id", p.category_id).eq("is_active", true).is("deleted_at", null)
      .or("etat_admin.is.null,etat_admin.neq.F").in("city_id", lot).limit(1000);
    for (const x of (data || []) as any[]) {
      res.total++;
      if (x.email && !x.do_not_contact) res.avecEmail++;
      if (x.phone && !x.do_not_contact) res.avecTel++;
      if (x.claimed_by_user_id) res.reclames++;
    }
  }
  console.log(`macons OUVERTS a moins de 30 km : ${res.total}`);
  console.log(`  avec un email joignable : ${res.avecEmail}`);
  console.log(`  avec un telephone : ${res.avecTel}`);
  console.log(`  ayant reclame leur fiche (donc qui ont recu le projet) : ${res.reclames}`);
})();
