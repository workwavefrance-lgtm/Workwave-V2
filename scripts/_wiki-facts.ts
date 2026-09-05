/**
 * One-off : dump des faits réels pour la carte-du-site du wiki.
 * Sort la liste des catégories (slug/name/vertical) + les comptes des tables clés.
 * Usage : npx tsx scripts/_wiki-facts.ts   (à supprimer après)
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
if (!url || !key) {
  console.error("Env manquant:", { url: !!url, key: !!key });
  process.exit(1);
}
const sb = createClient(url, key);

async function exact(table: string, build?: (q: any) => any): Promise<number> {
  let q: any = sb.from(table).select("*", { count: "exact", head: true });
  if (build) q = build(q);
  const { count, error } = await q;
  if (error) return -1;
  return count ?? -1;
}
async function estimated(table: string, build?: (q: any) => any): Promise<number> {
  let q: any = sb.from(table).select("*", { count: "estimated", head: true });
  if (build) q = build(q);
  const { count, error } = await q;
  if (error) return -1;
  return count ?? -1;
}

(async () => {
  const { data: cats, error: catErr } = await sb
    .from("categories")
    .select("id, slug, name, vertical")
    .order("vertical", { ascending: true })
    .order("id", { ascending: true });
  if (catErr) console.error("cats err", catErr.message);

  const byVertical: Record<string, { id: number; slug: string; name: string }[]> = {};
  for (const c of (cats || []) as any[]) {
    (byVertical[c.vertical] ||= []).push({ id: c.id, slug: c.slug, name: c.name });
  }

  const [
    prosActive,
    prosTotal,
    cities,
    departments,
    deptFR,
    deptBE,
    seoPages,
    priceGuides,
    seoGuides,
    blogPosts,
    prosClaimed,
  ] = await Promise.all([
    estimated("pros", (q) => q.eq("is_active", true).is("deleted_at", null)),
    estimated("pros"),
    exact("cities"),
    exact("departments"),
    exact("departments", (q) => q.eq("country", "FR")),
    exact("departments", (q) => q.eq("country", "BE")),
    exact("seo_pages"),
    exact("price_guides"),
    exact("seo_guides"),
    exact("blog_posts"),
    exact("pros", (q) => q.not("claimed_by_user_id", "is", null)),
  ]);

  const counts = {
    prosActive,
    prosTotal,
    prosClaimed,
    cities,
    departments,
    deptFR,
    deptBE,
    seoPages,
    priceGuides,
    seoGuides,
    blogPosts,
    categoriesByVertical: Object.fromEntries(
      Object.entries(byVertical).map(([v, arr]) => [v, arr.length])
    ),
  };

  console.log("=== COUNTS ===");
  console.log(JSON.stringify(counts, null, 2));
  console.log("=== CATEGORIES ===");
  console.log(JSON.stringify(byVertical, null, 2));
})();
