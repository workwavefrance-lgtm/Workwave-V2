import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";
const SEL = "id, slug, name, claimed_by_user_id, google_rating, google_reviews_count, profile_completion";

async function combo(catSlug: string, citySlug: string) {
  const { data: cat } = await sb.from("categories").select("id,name").eq("slug", catSlug).single();
  const { data: city } = await sb.from("cities").select("id,name").eq("slug", citySlug).order("population",{ascending:false,nullsFirst:false}).limit(1).single();
  const catId = (cat as any).id, cityId = (city as any).id;
  // exactement comme getTopProsByCategoryAndCity
  const est = await sb.from("pros").select(SEL, { count: "estimated" })
    .eq("category_id", catId).eq("city_id", cityId).is("deleted_at", null).eq("is_active", true).or(OUVERTS)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("profile_completion", { ascending: false, nullsFirst: false })
    .limit(100);
  const ex = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", catId).eq("city_id", cityId).is("deleted_at", null).eq("is_active", true).or(OUVERTS);
  // meilleurs pros REELS de la zone par note Google
  const best = await sb.from("pros").select("id,name,google_rating,google_reviews_count")
    .eq("category_id", catId).eq("city_id", cityId).is("deleted_at", null).eq("is_active", true).or(OUVERTS)
    .not("google_rating", "is", null).order("google_reviews_count", { ascending: false }).limit(10);
  const fenetre = new Set(((est.data as any[]) || []).map((p) => p.id));
  const notes = ((best.data as any[]) || []);
  const dansFenetre = notes.filter((p) => fenetre.has(p.id)).length;
  console.log(JSON.stringify({
    combo: `${catSlug}/${citySlug}`,
    exact: ex.count, estime: est.count, ecart_pct: ex.count ? Math.round(((est.count! - ex.count) / ex.count) * 100) : null,
    lignes_chargees: (est.data || []).length,
    pros_notes_google: notes.length, dans_la_fenetre_100: dansFenetre,
    top3_notes: notes.slice(0,3).map((p) => `${p.name} ${p.google_rating}/${p.google_reviews_count}avis${fenetre.has(p.id)?" [DANS]":" [HORS]"}`),
  }));
}
async function main() {
  for (const [c, v] of [["plombier","marseille"],["plombier","toulouse"],["electricien","toulouse"],["plombier","poitiers"],["menage","paris"],["macon","montpellier"],["peintre","nice"],["plombier","loudun"],["electricien","lyon"],["menuisier","bordeaux"]] as [string,string][]) {
    try { await combo(c, v); } catch (e:any) { console.log(c, v, "ERR", e.message); }
  }
}
main();
