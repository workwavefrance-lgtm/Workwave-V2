/**
 * Simulation : pour les vrais projets BTP des 30 derniers jours,
 * combien de pros AURAIENT recu le mail AVANT vs APRES le fix.
 *
 * Ne touche pas la BDD, n'envoie aucun mail. Lecture seule.
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { haversineKm } from "@/lib/utils/haversine";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const sinceIso = new Date(Date.now() - 60 * 86400e3).toISOString();
  const { data: projects } = await sb
    .from("projects")
    .select("id, category_id, city_id, vertical, status, created_at, category:categories(name), city:cities!inner(name, latitude, longitude, department_id)")
    .eq("vertical", "btp")
    .neq("status", "deleted")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(10);
  if (!projects?.length) { console.log("Aucun projet BTP recent."); return; }

  for (const p of projects) {
    const cat = Array.isArray(p.category) ? p.category[0] : p.category;
    const city = Array.isArray(p.city) ? p.city[0] : p.city;
    if (!cat || !city) continue;

    console.log(`\n══════════════════════════════════════════════════════════════`);
    console.log(`Projet #${p.id} · ${cat.name} à ${city.name} (dept ${city.department_id})`);
    console.log(`Créé : ${new Date(p.created_at).toLocaleDateString("fr-FR")}`);

    // ANCIEN : filtre département
    const { data: deptCities } = await sb.from("cities").select("id").eq("department_id", city.department_id);
    const deptCityIds = (deptCities || []).map((c) => c.id);
    const { data: oldPros } = await sb
      .from("pros")
      .select("id, name, city:cities!inner(name, latitude, longitude, department_id), intervention_radius_km")
      .or(`category_id.eq.${p.category_id},secondary_category_ids.cs.{${p.category_id}}`)
      .in("city_id", deptCityIds)
      .in("source", ["sirene", "pagesjaunes", "manual", "ai_signup"])
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("claimed_by_user_id", "is", null)
      .not("email", "is", null)
      .eq("do_not_contact", false);

    // NOUVEAU (corrigé) : pas de bbox SQL (cap 1000 PostgREST), fetch tous
    // les pros claimed de la catégorie et filtre Haversine côté JS.
    const { data: candidatePros } = await sb
      .from("pros")
      .select("id, name, city:cities!inner(name, latitude, longitude, department_id), intervention_radius_km")
      .or(`category_id.eq.${p.category_id},secondary_category_ids.cs.{${p.category_id}}`)
      .in("source", ["sirene", "pagesjaunes", "manual", "ai_signup"])
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("claimed_by_user_id", "is", null)
      .not("email", "is", null)
      .eq("do_not_contact", false);

    const newPros = (candidatePros || []).filter((pro) => {
      const c = Array.isArray(pro.city) ? pro.city[0] : pro.city;
      if (!c || c.latitude == null || c.longitude == null) return true;
      const d = haversineKm(c.latitude, c.longitude, city.latitude!, city.longitude!);
      return d <= (pro.intervention_radius_km ?? 20);
    });

    console.log(`\nAVANT (filtre dept ${city.department_id}) : ${oldPros?.length ?? 0} pro(s) éligible(s)`);
    for (const pro of oldPros || []) {
      const c = Array.isArray(pro.city) ? pro.city[0] : pro.city;
      const d = c?.latitude != null ? haversineKm(c.latitude, c.longitude!, city.latitude!, city.longitude!) : null;
      console.log(`  · ${pro.name} à ${c?.name}, ${d?.toFixed(0)} km, rayon ${pro.intervention_radius_km ?? 20} km${d != null && d > (pro.intervention_radius_km ?? 20) ? " ← SPAM (hors rayon)" : ""}`);
    }

    console.log(`\nAPRÈS (distance ≤ rayon pro) : ${newPros.length} pro(s) éligible(s)`);
    for (const pro of newPros) {
      const c = Array.isArray(pro.city) ? pro.city[0] : pro.city;
      const d = haversineKm(c!.latitude!, c!.longitude!, city.latitude!, city.longitude!);
      const crossDept = c!.department_id !== city.department_id ? " ← GAIN (cross-dept)" : "";
      console.log(`  · ${pro.name} à ${c!.name} (dept ${c!.department_id}), ${d.toFixed(0)} km, rayon ${pro.intervention_radius_km ?? 20} km${crossDept}`);
    }

    const oldIds = new Set((oldPros || []).map((p) => p.id));
    const newIds = new Set(newPros.map((p) => p.id));
    const lost = (oldPros || []).filter((p) => !newIds.has(p.id));
    const gained = newPros.filter((p) => !oldIds.has(p.id));
    if (lost.length || gained.length) {
      console.log(`\n→ Delta : -${lost.length} (spam évité) | +${gained.length} (gains cross-dept)`);
    }
  }
})();
