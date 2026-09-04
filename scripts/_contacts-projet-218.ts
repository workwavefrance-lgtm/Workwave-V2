import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { haversineKm } from "../lib/utils/haversine";
const sb = getServiceClient();
(async () => {
  const { data: proj } = await sb.from("projects").select("id, category_id, cities(name, latitude, longitude)").eq("id", 218).single();
  const p = proj as any; const lat = p.cities.latitude, lng = p.cities.longitude;
  const { data: villes } = await sb.from("cities").select("id, name, latitude, longitude")
    .gte("latitude", lat - 0.35).lte("latitude", lat + 0.35).gte("longitude", lng - 0.5).lte("longitude", lng + 0.5);
  const carte = new Map<number, { nom: string; d: number }>();
  for (const v of (villes || []) as any[]) {
    if (!v.latitude) continue;
    const d = haversineKm(lat, lng, v.latitude, v.longitude);
    if (d <= 30) carte.set(v.id, { nom: v.name, d });
  }
  const ids = [...carte.keys()];
  const joignables: any[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await sb.from("pros").select("name, slug, email, phone, city_id, founding_date")
      .eq("category_id", p.category_id).eq("is_active", true).is("deleted_at", null)
      .or("etat_admin.is.null,etat_admin.neq.F").is("claimed_by_user_id", null).eq("do_not_contact", false)
      .in("city_id", ids.slice(i, i + 200)).limit(1000);
    for (const x of (data || []) as any[]) if (x.email || x.phone) joignables.push({ ...x, ville: carte.get(x.city_id) });
  }
  joignables.sort((a, b) => a.ville.d - b.ville.d);
  console.log(`${joignables.length} macons joignables a moins de 30 km de Rillieux-la-Pape\n`);
  for (const j of joignables) {
    console.log(`${j.name} · ${j.ville.nom} (${j.ville.d.toFixed(0)} km)`);
    console.log(`   ${j.email || "pas d email"} · ${j.phone || "pas de telephone"}`);
    console.log(`   sa fiche : https://workwave.fr/artisan/${j.slug}`);
  }
})();
