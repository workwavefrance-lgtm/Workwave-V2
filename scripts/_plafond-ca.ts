import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const TEST = [4393, 99999, 1432477];

async function pagine(build: (q: any) => any) {
  const out: any[] = []; let off = 0;
  for (;;) {
    const { data, error } = await build(sb).range(off, off + 999);
    if (error) { console.error("ERREUR:", error.message); process.exit(1); }
    const r = data || []; if (!r.length) break;
    out.push(...r); off += r.length;
    if (off > 20000) break;
  }
  return out;
}

(async () => {
  const claimed = await pagine((s: any) => s.from("pros")
    .select("id, name, category_id, city_id, intervention_radius_km, email, claimed_at")
    .not("claimed_by_user_id", "is", null).eq("is_active", true).is("deleted_at", null));
  const vrais = claimed.filter((p) => !TEST.includes(p.id));
  console.log(`PROS AVEC COMPTE (fiche reclamee) : ${claimed.length}  dont ${vrais.length} hors comptes de test`);

  const unlocks = await pagine((s: any) => s.from("lead_unlocks").select("id, pro_id, project_id, amount_cents, paid_at"));
  const payants = unlocks.filter((u) => (u.amount_cents ?? 0) > 0 && !TEST.includes(u.pro_id));
  const gratuits = unlocks.filter((u) => (u.amount_cents ?? 0) === 0);
  console.log(`DEBLOCAGES : ${unlocks.length} total · ${payants.length} payants hors test, ${gratuits.length} gratuits`);
  const parPro = new Map<number, number>();
  unlocks.forEach((u) => parPro.set(u.pro_id, (parPro.get(u.pro_id) || 0) + 1));
  const ontEpuise = vrais.filter((p) => (parPro.get(p.id) || 0) >= 2);
  console.log(`PROS AYANT EPUISE LEURS 2 GRATUITS : ${ontEpuise.length}`);
  console.log(`  -> seuls ceux-la peuvent generer 9,90 EUR au prochain lead`);

  const projets = await pagine((s: any) => s.from("projects")
    .select("id, status, category_id, city_id, created_at, vertical")
    .eq("vertical", "btp").not("status", "in", "(closed,deleted)"));
  console.log(`\nPROJETS OUVERTS : ${projets.length}`);
  const parCat = new Map<number, number>();
  projets.forEach((p) => parCat.set(p.category_id, (parCat.get(p.category_id) || 0) + 1));

  // Combien de pros AVEC COMPTE sont eligibles a chaque projet ouvert ?
  const villes = await pagine((s: any) => s.from("cities").select("id, name, latitude, longitude")
    .in("id", [...new Set([...projets.map((p) => p.city_id), ...vrais.map((p) => p.city_id)].filter(Boolean))]));
  const V = new Map(villes.map((c: any) => [c.id, c]));
  const hav = (a: any, b: any) => {
    const R = 6371, r = Math.PI / 180;
    const dLat = (b.latitude - a.latitude) * r, dLon = (b.longitude - a.longitude) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };
  let totalPaires = 0, pairesPayantes = 0;
  for (const pj of projets) {
    const cv = V.get(pj.city_id); if (!cv?.latitude) continue;
    const elig = vrais.filter((p) => {
      if (p.category_id !== pj.category_id) return false;
      const pv = V.get(p.city_id); if (!pv?.latitude) return false;
      return hav(cv, pv) <= (p.intervention_radius_km ?? 20);
    });
    totalPaires += elig.length;
    pairesPayantes += elig.filter((p) => (parPro.get(p.id) || 0) >= 2).length;
    if (elig.length) console.log(`   projet #${pj.id} (cat ${pj.category_id}) : ${elig.length} pros avec compte eligibles`);
  }
  console.log(`\nPAIRES pro-avec-compte x projet-ouvert : ${totalPaires}`);
  console.log(`   dont facturables 9,90 EUR (gratuits epuises) : ${pairesPayantes}`);
  console.log(`\nPLAFOND THEORIQUE a 100 % de conversion : ${(pairesPayantes * 9.9).toFixed(2)} EUR`);
})();
