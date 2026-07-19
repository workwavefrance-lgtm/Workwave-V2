/**
 * SIMULATEUR DE BROADCAST (dry-run) — ne touche à RIEN, n'envoie AUCUN email.
 *
 *   npx tsx scripts/_broadcast-dryrun.ts <slug-categorie> <nom-ville>
 *   ex: npx tsx scripts/_broadcast-dryrun.ts carreleur Marseille
 *
 * Rejoue EXACTEMENT la sélection de lib/email/broadcast-btp-project.ts
 * (cluster de métiers + généralistes + bbox + Haversine vs rayon du pro) pour
 * répondre à UNE question : si je dépose ce projet de test, combien de vrais
 * artisans recevraient un faux lead ? On ne dépose que si la réponse est 0.
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { haversineKm } from "../lib/utils/haversine";
import { getGeneralistCategoryIds } from "../lib/matching/generalist";
import { getMatchCategoryIds } from "../lib/email/broadcast-btp-project";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_RADIUS_KM = 200;

async function main() {
  const catSlug = process.argv[2];
  const cityName = process.argv[3];
  if (!catSlug || !cityName) {
    console.log("Usage: npx tsx scripts/_broadcast-dryrun.ts <slug-categorie> <nom-ville>");
    process.exit(1);
  }

  const { data: cat } = await sb
    .from("categories")
    .select("id, name, slug")
    .eq("slug", catSlug)
    .maybeSingle();
  if (!cat) {
    console.log(`Categorie "${catSlug}" introuvable.`);
    process.exit(1);
  }

  const { data: city } = await sb
    .from("cities")
    .select("id, name, latitude, longitude, department_id, postal_code")
    .ilike("name", cityName)
    .order("population", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!city) {
    console.log(`Ville "${cityName}" introuvable.`);
    process.exit(1);
  }

  const c = cat as { id: number; name: string; slug: string };
  const v = city as {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    postal_code: string | null;
  };

  console.log(`Projet simule : ${c.name} a ${v.name} (${v.postal_code ?? "?"})`);
  console.log(`Coordonnees   : ${v.latitude}, ${v.longitude}\n`);

  // MEME logique que le broadcast : cluster metier + generalistes
  const matchIds = await getMatchCategoryIds(sb, c.id);
  const generalistIds = await getGeneralistCategoryIds(sb);
  const targetIds = [...new Set([...matchIds, ...generalistIds])];
  console.log("Categories ciblees (cluster + generalistes) :", targetIds.join(", "));

  const orFilter = targetIds
    .flatMap((id) => [`category_id.eq.${id}`, `secondary_category_ids.cs.{${id}}`])
    .join(",");

  const nowIso = new Date().toISOString();
  const { data: pros, error } = await sb
    .from("pros")
    .select("id, name, email, intervention_radius_km, city:cities!inner(name, latitude, longitude)")
    .or(orFilter)
    .in("source", ["sirene", "pagesjaunes", "manual", "ai_signup", "bce"])
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null)
    .not("email", "is", null)
    .eq("do_not_contact", false)
    .or(`paused_until.is.null,paused_until.lt.${nowIso}`);

  if (error) {
    console.log("Erreur requete :", error.message);
    process.exit(1);
  }

  type Row = {
    id: number;
    name: string;
    email: string;
    intervention_radius_km: number | null;
    city: { name: string; latitude: number | null; longitude: number | null } | null;
  };

  const candidates = (pros || []) as unknown as Row[];
  const targets = candidates.filter((p) => {
    if (v.latitude == null || v.longitude == null) return true; // fallback dept
    if (!p.city || p.city.latitude == null || p.city.longitude == null) return true;
    const d = haversineKm(p.city.latitude, p.city.longitude, v.latitude, v.longitude);
    return d <= (p.intervention_radius_km ?? DEFAULT_RADIUS_KM);
  });

  console.log(`\nCandidats (bonne categorie, inscrits, actifs) : ${candidates.length}`);
  console.log(`=> RECEVRAIENT REELLEMENT L'EMAIL : ${targets.length}\n`);

  for (const t of targets) {
    const d =
      v.latitude != null && v.longitude != null && t.city?.latitude != null && t.city?.longitude != null
        ? Math.round(haversineKm(t.city.latitude, t.city.longitude, v.latitude, v.longitude))
        : null;
    console.log(`  ⚠️  #${t.id} ${t.name} (${t.city?.name ?? "?"}) — ${d ?? "?"} km, rayon ${t.intervention_radius_km ?? DEFAULT_RADIUS_KM} km`);
  }

  if (targets.length === 0) {
    console.log("✅ ZONE SURE : aucun artisan ne recevrait ce projet de test.");
  } else {
    console.log("\n❌ NE PAS TESTER ICI : de vrais artisans recevraient un faux lead.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
