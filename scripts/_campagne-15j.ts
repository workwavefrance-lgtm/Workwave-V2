import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const hav = (a: any, b: any) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * r, dLon = (b.longitude - a.longitude) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
(async () => {
  const limite = new Date(Date.now() - 15 * 86400e3).toISOString();
  const { data: pj, error } = await sb.from("projects")
    .select("id, category_id, city_id, description, urgency, budget, created_at, categories(name), cities(name, postal_code, latitude, longitude, department_id)")
    .eq("vertical", "btp").not("status", "in", "(closed,deleted)").gte("created_at", limite).order("created_at", { ascending: false });
  if (error) { console.error("ERREUR:", error.message); process.exit(1); }
  console.log(`PROJETS OUVERTS DE MOINS DE 15 JOURS : ${(pj || []).length}\n`);

  const resultats: any[] = [];
  for (const p of (pj || []) as any[]) {
    const cv = p.cities;
    if (!cv?.latitude) { console.log(`#${p.id} ${p.categories?.name} : ville sans coordonnees, ignore`); continue; }
    // bbox ~200 km puis Haversine exact
    const { data: cands } = await sb.from("pros")
      .select("id, name, email, phone, slug, city_id, intervention_radius_km, claimed_by_user_id, cities!inner(latitude, longitude, name)")
      .eq("category_id", p.category_id).eq("is_active", true).is("deleted_at", null)
      .neq("do_not_contact", true).neq("email_bounced", true)
      .not("email", "is", null)
      .gte("cities.latitude", cv.latitude - 1.85).lte("cities.latitude", cv.latitude + 1.85)
      .gte("cities.longitude", cv.longitude - 2.55).lte("cities.longitude", cv.longitude + 2.55)
      .limit(1000);
    const proches = (cands || []).filter((c: any) => hav(cv, c.cities) <= 40);
    const dejaCompte = proches.filter((c: any) => c.claimed_by_user_id).length;
    resultats.push({ id: p.id, metier: p.categories?.name, ville: cv.name, cp: cv.postal_code,
      jours: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400e3),
      urgence: p.urgency, joignables: proches.length, avecCompte: dejaCompte,
      emails: proches.map((c: any) => ({ email: c.email, nom: c.name, slug: c.slug, km: Math.round(hav(cv, c.cities)) })) });
  }
  resultats.sort((a, b) => b.joignables - a.joignables);
  console.log("projet  metier                ville                    age  joignables(<=40km, avec email)");
  for (const r of resultats)
    console.log(`#${String(r.id).padEnd(5)} ${String(r.metier).slice(0,20).padEnd(21)} ${String(r.ville).slice(0,22).padEnd(23)} ${String(r.jours).padStart(2)}j  ${String(r.joignables).padStart(4)}  (dont ${r.avecCompte} avec compte)`);
  const tousEmails = new Set(resultats.flatMap((r) => r.emails.map((e: any) => e.email.toLowerCase())));
  console.log(`\nTOTAL projets exploitables : ${resultats.filter((r) => r.joignables > 0).length} / ${resultats.length}`);
  console.log(`ADRESSES UNIQUES A CONTACTER : ${tousEmails.size}`);
  fs.writeFileSync("/tmp/campagne15j.json", JSON.stringify(resultats, null, 2));
})();
