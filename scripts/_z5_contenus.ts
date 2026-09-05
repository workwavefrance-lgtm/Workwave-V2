import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // price_guides par statut + scope
  const pg: any[] = [];
  let off = 0;
  while (true) {
    const { data, error } = await sb.from("price_guides").select("slug,status,scope,metier_slug").range(off, off + 999);
    if (error) { console.log("price_guides err", error.message); break; }
    const rows = data || []; if (rows.length === 0) break; pg.push(...rows); off += rows.length;
  }
  const parStatut: Record<string, number> = {};
  for (const g of pg) parStatut[g.status] = (parStatut[g.status] || 0) + 1;
  console.log("price_guides total =", pg.length, parStatut);
  const nonPub = pg.filter((g) => g.status !== "published");
  console.log("non publies (5 exemples) :", nonPub.slice(0, 5).map((g) => `${g.slug} [${g.status}/${g.scope}]`));

  // seo_guides
  const { data: sg } = await sb.from("seo_guides").select("slug,category_id");
  console.log("seo_guides =", (sg || []).length);

  // categories par vertical
  const { data: cats } = await sb.from("categories").select("id,slug,vertical");
  const parVert: Record<string, number> = {};
  for (const c of (cats || []) as any[]) parVert[c.vertical] = (parVert[c.vertical] || 0) + 1;
  console.log("categories par vertical :", parVert);
  const btpDomPers = (cats || []).filter((c: any) => ["btp","domicile","personne"].includes(c.vertical));
  console.log("categories btp+domicile+personne =", btpDomPers.length);
  const slugsAvecGuide = new Set((sg || []).map((g: any) => g.slug));
  console.log("categories SANS /[metier]/guide :", btpDomPers.filter((c: any) => !slugsAvecGuide.has(c.slug)).map((c: any) => c.slug).join(" "));

  // blog
  const { data: bp } = await sb.from("blog_posts").select("slug,status,published_at");
  const parStatutBlog: Record<string, number> = {};
  for (const b of (bp || []) as any[]) parStatutBlog[b.status] = (parStatutBlog[b.status] || 0) + 1;
  console.log("blog_posts =", (bp || []).length, parStatutBlog);
  console.log("published sans published_at :", (bp || []).filter((b: any) => b.status === "published" && !b.published_at).map((b:any)=>b.slug));
}
main();
