/**
 * Les pros a contacter EN PRIORITE : ceux qui ont un vrai chantier qui les
 * attend a cote de chez eux.
 *
 * Pourquoi ce croisement plutot qu'une liste brute : un message qui dit
 * "inscrivez-vous" ne convertit pas. Un message qui dit "un chantier de
 * maconnerie vous attend a 12 km, voici le lien" est une raison d'agir.
 *
 * On ne retient que :
 *   - fiches ACTIVES, NON reclamees, sans opt-out
 *   - avec un telephone OU un email (sinon on ne peut pas les joindre)
 *   - meme metier que le projet
 *   - a moins de RAYON_KM du chantier (Haversine, comme le broadcast)
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { haversineKm } from "../lib/utils/haversine";

const RAYON_KM = 30;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  // 1. Les chantiers encore ouverts
  const { data: projets } = await sb.from("projects")
    .select("id, category_id, city_id, urgency, budget, created_at, categories(name), cities(name, postal_code, latitude, longitude)")
    .eq("status", "new").eq("vertical", "btp")
    .order("created_at", { ascending: false });
  const ouverts = (projets || []).filter((p: any) => p.cities?.latitude && p.cities?.longitude);
  console.log(`${ouverts.length} chantiers ouverts avec coordonnees\n`);

  const parPro = new Map<number, any>();

  for (const p of ouverts as any[]) {
    // bbox ~30 km : lat +-0.28, lng +-0.40 en France metropolitaine
    const { data: pros } = await sb.from("pros")
      .select("id, slug, name, phone, email, category_id, cities!inner(name, postal_code, latitude, longitude)")
      .eq("is_active", true).is("deleted_at", null)
      .is("claimed_by_user_id", null).neq("do_not_contact", true)
      .eq("category_id", p.category_id)
      .or("phone.not.is.null,email.not.is.null")
      .gte("cities.latitude", p.cities.latitude - 0.28)
      .lte("cities.latitude", p.cities.latitude + 0.28)
      .gte("cities.longitude", p.cities.longitude - 0.40)
      .lte("cities.longitude", p.cities.longitude + 0.40)
      .limit(1000);

    for (const pro of (pros || []) as any[]) {
      const d = haversineKm(p.cities.latitude, p.cities.longitude, pro.cities.latitude, pro.cities.longitude);
      if (d > RAYON_KM) continue;
      const prec = parPro.get(pro.id);
      if (!prec || d < prec.distance) {
        parPro.set(pro.id, {
          id: pro.id, slug: pro.slug, nom: pro.name,
          tel: pro.phone, mail: pro.email,
          ville: `${pro.cities.name} (${pro.cities.postal_code})`,
          metier: p.categories?.name, distance: Math.round(d),
          projet: p.id, projet_ville: p.cities.name, urgence: p.urgency, budget: p.budget,
        });
      }
    }
  }

  const liste = [...parPro.values()].sort((a, b) => a.distance - b.distance);
  console.log(`${liste.length} pros joignables avec un chantier a moins de ${RAYON_KM} km\n`);
  console.log("les 25 plus proches :\n");
  liste.slice(0, 25).forEach((x) =>
    console.log(`  ${String(x.distance).padStart(3)} km  ${x.metier?.padEnd(14)} ${x.nom.slice(0, 30).padEnd(32)} ${x.ville.padEnd(28)} ${x.tel ? "tel" : "   "} ${x.mail ? "mail" : ""}`));

  const parMetier: Record<string, number> = {};
  liste.forEach((x) => { parMetier[x.metier || "?"] = (parMetier[x.metier || "?"] || 0) + 1; });
  console.log("\npar metier :");
  Object.entries(parMetier).sort((a, b) => b[1] - a[1]).forEach(([m, n]) => console.log(`  ${String(n).padStart(4)}  ${m}`));
  console.log(`\n  avec telephone : ${liste.filter((x) => x.tel).length}`);
  console.log(`  avec email     : ${liste.filter((x) => x.mail).length}`);

  const fs = await import("fs");
  fs.writeFileSync("prospects-avec-chantier.json", JSON.stringify(liste, null, 2));
  console.log(`\n  liste complete ecrite dans prospects-avec-chantier.json`);
})();
