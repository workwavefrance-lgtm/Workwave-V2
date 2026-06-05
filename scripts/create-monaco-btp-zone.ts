/**
 * Crée la "zone" Monaco pour le BTP (mise en relation transfrontalière).
 *
 * Monaco est un État souverain : hors SIRENE, et le RCI monégasque est interdit
 * au scraping (CGU art. 9.2). On ne crée donc AUCUNE fausse entreprise
 * monégasque. À la place, Monaco est une zone de mise en relation servie par les
 * artisans RÉELS de la Riviera française frontalière (Beausoleil, Cap-d'Ail,
 * Roquebrune-Cap-Martin, La Turbie) qui interviennent quotidiennement à Monaco.
 *
 * Ce script crée une ville "Monaco" (rattachée au dept 06, données publiques
 * réelles) dont la page /[metier]/monaco AGRÈGE les communes frontalières
 * (cf. getAggregatedCityIds dans lib/queries/cities.ts). Aucun pro n'est rattaché
 * à la ville Monaco elle-même.
 *
 * Idempotent. Usage : npx tsx scripts/create-monaco-btp-zone.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Communes françaises qui touchent la frontière de Monaco (slugs en base).
const BORDER_SLUGS = ["beausoleil", "cap-d-ail", "roquebrune-cap-martin", "la-turbie"];

async function main() {
  console.log(`\n=== Zone Monaco BTP ${DRY ? "(DRY-RUN)" : "(RÉEL)"} ===\n`);

  // dept 06 (Alpes-Maritimes) : Monaco y est rattachée (c'est là que sont les
  // artisans qui interviennent à Monaco ; breadcrumb + fallback cohérents).
  const { data: dept } = await sb
    .from("departments")
    .select("id,name")
    .eq("code", "06")
    .single();
  if (!dept) throw new Error("Dept 06 (Alpes-Maritimes) introuvable");
  console.log(`Dept de rattachement : ${dept.name} (id=${dept.id})`);

  // Vérifier que les communes frontalières existent + ont des pros
  const { data: borders } = await sb
    .from("cities")
    .select("id,name,slug")
    .in("slug", BORDER_SLUGS);
  console.log(`\nCommunes frontalières en base : ${borders?.length}/4`);
  for (const b of borders || []) {
    const { count } = await sb
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("city_id", b.id)
      .eq("is_active", true)
      .is("deleted_at", null);
    console.log(`  ${b.name} (${b.slug}) → ${count} artisans`);
  }
  if ((borders?.length ?? 0) !== 4) {
    throw new Error("Communes frontalières manquantes — vérifier les slugs");
  }

  // Ville Monaco — données publiques réelles (zéro inventé)
  const monaco = {
    department_id: dept.id,
    name: "Monaco",
    slug: "monaco",
    postal_code: "98000",
    insee_code: "99138", // code INSEE officiel de Monaco (pays étranger)
    population: 38350, // recensement Principauté ~2023
    latitude: 43.7384,
    longitude: 7.4246,
  };

  const { data: existing } = await sb
    .from("cities")
    .select("id,slug")
    .eq("slug", "monaco")
    .maybeSingle();

  if (existing) {
    console.log(`\n= Ville "Monaco" existe déjà (city_id=${existing.id}) — rien à faire.`);
    return;
  }

  if (DRY) {
    console.log(`\n+ [DRY] créerait la ville "Monaco" :`, JSON.stringify(monaco));
    console.log("\n→ Relance SANS --dry-run pour appliquer.");
    return;
  }

  const { data: ins, error } = await sb.from("cities").insert(monaco).select("id").single();
  if (error) throw new Error(`Insert Monaco : ${error.message}`);
  console.log(`\n+ Ville "Monaco" créée (city_id=${ins.id}, slug=monaco, dept=06).`);
  console.log("  → /[metier]/monaco agrégera : " + BORDER_SLUGS.join(", "));
  console.log("  → AUCUN pro rattaché à Monaco (mise en relation via communes frontalières).");
}

main().catch((e) => {
  console.error("ERREUR :", e.message);
  process.exit(1);
});
