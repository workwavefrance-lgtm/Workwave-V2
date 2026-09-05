import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { computeProScore } from "../lib/queries/top-pros";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";
const SEL = "id, name, claimed_by_user_id, google_rating, google_reviews_count, workwave_reviews_avg, workwave_reviews_count, founded_year, certifications, rge_certified, has_decennale, has_rc_pro, photos, profile_completion, description";

function trier(pros: any[], limit: number) {
  return pros.map((p) => ({ p, s: computeProScore(p) }))
    .sort((a, b) => {
      const ac = !!a.p.claimed_by_user_id, bc = !!b.p.claimed_by_user_id;
      if (ac !== bc) return ac ? -1 : 1;
      if (b.s !== a.s) return b.s - a.s;
      return (a.p.name ?? "").localeCompare(b.p.name ?? "");
    }).slice(0, limit);
}

async function main(catSlug: string, citySlug: string) {
  const { data: cat } = await sb.from("categories").select("id").eq("slug", catSlug).single();
  const { data: city } = await sb.from("cities").select("id").eq("slug", citySlug).order("population",{ascending:false,nullsFirst:false}).limit(1).single();
  const base = () => sb.from("pros").select(SEL).eq("category_id", (cat as any).id).eq("city_id", (city as any).id).is("deleted_at", null).eq("is_active", true).or(OUVERTS);
  // fenetre du code : 100 lignes, meme ordre
  const { data: fen } = await base().order("claimed_by_user_id", { ascending: false, nullsFirst: false }).order("profile_completion", { ascending: false, nullsFirst: false }).limit(100);
  // population complete
  const tous: any[] = []; let off = 0;
  while (true) { const { data } = await base().range(off, off + 999); const r = data || []; if (!r.length) break; tous.push(...r); off += r.length; }
  const topFenetre = trier((fen as any[]) || [], 10).map((x) => x.p.id);
  const topReel = trier(tous, 10);
  const idsF = new Set(topFenetre);
  const manques = topReel.filter((x) => !idsF.has(x.p.id));
  const pc = tous.filter((p) => (p.profile_completion ?? 0) > 0).length;
  console.log(JSON.stringify({
    combo: `${catSlug}/${citySlug}`, total_ouverts: tous.length, fenetre: (fen||[]).length,
    profile_completion_non_nul: pc,
    top10_reel_absent_de_la_fenetre: manques.length,
    exemples_rates: manques.slice(0,3).map((x) => `${x.p.name} (score ${x.s})`),
    score_min_top10_affiche: trier((fen as any[])||[],10).slice(-1)[0]?.s ?? null,
    score_min_top10_reel: topReel.slice(-1)[0]?.s ?? null,
  }));
}
const [c, v] = process.argv.slice(2);
main(c, v);
