import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: claimed } = await sb.from("pros")
    .select("id, name, email, category_id, city_id, intervention_radius_km, categories(name), cities(name)")
    .not("claimed_by_user_id", "is", null)
    .eq("is_active", true).is("deleted_at", null).eq("do_not_contact", false)
    .not("email", "is", null);
  const rows = (claimed || []) as any[];
  console.log("PROS INSCRITS (recevraient un broadcast) :", rows.length);
  for (const p of rows) {
    console.log(`  #${p.id} ${p.name} | ${p.categories?.name ?? "?"} | ${p.cities?.name ?? "?"} | rayon ${p.intervention_radius_km ?? 200}km`);
  }
  const usedCats = new Set(rows.map(r => r.category_id));
  console.log("\nCategories AVEC un pro inscrit :", [...usedCats].join(", ") || "aucune");
  const { data: cats } = await sb.from("categories").select("id, slug, name, vertical")
    .in("vertical", ["btp","domicile","personne"]).order("name");
  const safe = (cats || []).filter((c: any) => !usedCats.has(c.id));
  console.log(`\nCategories SANS aucun pro inscrit (broadcast = 0 email) : ${safe.length}`);
  console.log("  Exemples :", safe.slice(0, 8).map((c: any) => `${c.name} (${c.slug})`).join(" | "));
})();
