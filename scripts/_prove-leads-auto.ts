import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { haversineKm } from "@/lib/utils/haversine";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  // Reproduit EXACTEMENT le filtre de la page Leads pour un couvreur fictif à Ducos
  const { data: cat } = await sb.from("categories").select("id").eq("slug","couvreur").single();
  const DUCOS = { lat: 14.5785, lng: -60.9685 }; // un couvreur qui s'inscrit à Ducos
  const RADIUS = 200;

  const { data: rows } = await sb.from("projects")
    .select("id, first_name, created_at, status, category_id, cities(name, latitude, longitude)")
    .eq("vertical","btp").eq("category_id", cat!.id).neq("status","deleted")
    .order("created_at",{ascending:false}).limit(500);

  console.log(`Projets COUVREUR (non supprimés) en base : ${(rows||[]).length}`);
  let visibles = 0;
  for (const p of (rows||[]) as any[]) {
    const c = Array.isArray(p.cities)?p.cities[0]:p.cities;
    if (c?.latitude==null) continue;
    const d = haversineKm(DUCOS.lat, DUCOS.lng, c.latitude, c.longitude);
    if (d <= RADIUS) { visibles++; console.log(`  ✅ #${p.id} ${c.name} (${Math.round(d)}km) · ${p.first_name} · verrait ce lead`); }
  }
  console.log(`\n→ Un couvreur qui réclame sa fiche à Ducos verrait ${visibles} projet(s) AUTOMATIQUEMENT dans son dashboard (sans aucune action de ta part).`);
})().catch(e=>{console.error(e.message);process.exit(1);});
