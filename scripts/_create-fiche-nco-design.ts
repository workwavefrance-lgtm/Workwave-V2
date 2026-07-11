/**
 * Fiche N.C.O Design — PREMIER ARTISAN BELGE de Workwave.
 *
 * Nelson Celestino (Insta @nco_design_, DM avec Willy depuis le 18/06 : "vous
 * pouvez compter sur moi en tant que premier artisan à intégrer la trame en
 * Belgique"). Données 100 % issues du registre officiel BCE (Public Search,
 * consultation unitaire du 11/07/2026) :
 *   BCE 1016.514.072 — N.C.O Design SRL, créée le 22/11/2024, active,
 *   Boulevard Louis Mettewie 71/22, 1080 Molenbeek-Saint-Jean.
 *   NACE : peinture, menuiserie, isolation, revêtements sols/murs, nettoyage.
 *   Email public (bio Insta pro) : nelsoncelestino@outlook.com.
 *
 * Usage :
 *   npx tsx scripts/_create-fiche-nco-design.ts --dry-run
 *   npx tsx scripts/_create-fiche-nco-design.ts
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { isValidBce } from "../lib/utils/bce";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const DRY = process.argv.includes("--dry-run");

const BCE = "1016514072";

async function main() {
  if (!isValidBce(BCE)) throw new Error("BCE invalide (checksum)");

  // Idempotence : fiche déjà là ?
  const { data: existing } = await sb
    .from("pros")
    .select("id, slug, claimed_by_user_id")
    .eq("siret", BCE)
    .maybeSingle();
  if (existing) {
    console.log(`Fiche déjà en base : /artisan/${existing.slug} (id ${existing.id}, claimed=${!!existing.claimed_by_user_id})`);
    return;
  }

  // Catégories par SLUG (jamais d'ID hardcodé — leçon 26/05).
  const { data: cats } = await sb
    .from("categories")
    .select("id, slug, name")
    .in("slug", ["peintre", "menuisier", "plaquiste", "menage"]);
  const bySlug = new Map((cats || []).map((c) => [c.slug, c]));
  const peintre = bySlug.get("peintre");
  if (!peintre) throw new Error("catégorie peintre introuvable");
  const secondary = ["menuisier", "plaquiste", "menage"]
    .map((s) => bySlug.get(s)?.id)
    .filter((x): x is number => !!x);

  // Commune : Molenbeek-Saint-Jean (BE)
  const { data: city } = await sb
    .from("cities")
    .select("id, name, slug, insee_code, postal_code")
    .eq("country", "BE")
    .eq("slug", "molenbeek-saint-jean")
    .single();
  if (!city) throw new Error("commune molenbeek-saint-jean introuvable");

  const fiche = {
    slug: "nco-design-14072",
    name: "N.C.O Design",
    siret: BCE,
    siren: null,
    category_id: peintre.id,
    secondary_category_ids: secondary,
    address: "Boulevard Louis Mettewie 71, boîte 22",
    city_id: city.id,
    postal_code: "1080",
    email: "nelsoncelestino@outlook.com",
    founding_date: "2024-11-22",
    founded_year: 2024,
    source: "bce" as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("Fiche à créer :", JSON.stringify({ ...fiche, secondary_names: secondary.map((id) => [...bySlug.values()].find((c) => c.id === id)?.name) }, null, 1));
  if (DRY) { console.log("\n[DRY-RUN] rien écrit."); return; }

  const { error } = await sb.from("pros").insert(fiche);
  if (error) { console.error("🔴 insert:", error.message); process.exit(1); }

  const { data: check } = await sb.from("pros").select("id, slug, city_id, cities(name, country)").eq("siret", BCE).single();
  console.log("\n✓ Fiche créée :", JSON.stringify(check));
  console.log(`\nURL fiche   : https://workwave.fr/artisan/nco-design-14072`);
  console.log(`URL claim   : https://workwave.fr/pro/reclamer/nco-design-14072`);
}

main().catch((e) => { console.error("Erreur:", e.message || e); process.exit(1); });
