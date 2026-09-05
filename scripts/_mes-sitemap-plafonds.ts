import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { SPECIALTIES } from "../lib/specialties";
import { TECH_CITIES } from "../lib/data/tech-cities";
import { TECH_DEPARTMENTS } from "../lib/data/tech-departments";
import { TOURISTIC_CITIES } from "../lib/data/touristic-cities";
import { COMPETITOR_OFFERS } from "../lib/data/competitor-offers";
import { AI_CATEGORY_IDS } from "../lib/ai/helpers";

async function main() {
  const sb = getServiceClient() as any;

  // 1) total de la vue materialisee (metier x ville, >= 3 ouverts)
  const { data: total, error: eT } = await sb.rpc("sitemap_listings_total");
  console.log("A. listing_cat_ville total (>=3 ouverts) :", total, eT?.message || "");

  // 2) charger toute la vue par tranches
  const lignes: { m: string; v: string; n: number }[] = [];
  for (let off = 0; off < 200000; off += 45000) {
    const { data, error } = await sb.rpc("sitemap_listings_page", { p_offset: off, p_limit: 45000 });
    if (error) { console.log("erreur page", off, error.message); break; }
    const arr = (data || []) as { m: string; v: string; n: number }[];
    if (arr.length === 0) break;
    lignes.push(...arr);
    if (arr.length < 45000) break;
  }
  console.log("B. lignes chargees :", lignes.length);
  const communes = new Set(lignes.map((l) => l.v));
  console.log("B2. communes distinctes :", communes.size);

  // 3) SPECIALITES : metiers concernes + villes eligibles
  const metiersSpec = Object.keys(SPECIALTIES);
  console.log("C. metiers avec sous-specialites :", metiersSpec.length, metiersSpec.join(","));
  let totalSpecPages = 0;
  const detail: string[] = [];
  for (const m of metiersSpec) {
    const nbSpec = (SPECIALTIES as any)[m].length;
    const villes = lignes.filter((l) => l.m === m).length;
    totalSpecPages += nbSpec * villes;
    detail.push(`${m}: ${nbSpec} spec x ${villes} villes(>=3) = ${nbSpec * villes}`);
  }
  console.log("D. pages specialite x ville (borne basse, villes >=3 pros) :", totalSpecPages);
  detail.forEach((d) => console.log("   " + d));

  // 4) villes sans population (exclues du tri getTopCities)
  const { count: villesTotal } = await sb.from("cities").select("id", { count: "exact", head: true });
  const { count: villesNullPop } = await sb.from("cities").select("id", { count: "exact", head: true }).is("population", null);
  console.log("E. communes:", villesTotal, "dont population NULL:", villesNullPop);

  // 5) categories AI : ids en base vs AI_CATEGORIES du sitemap
  const { data: catsAi } = await sb.from("categories").select("id, slug, vertical").in("id", AI_CATEGORY_IDS as any);
  console.log("F. AI_CATEGORY_IDS =", (AI_CATEGORY_IDS as any).length, "categories en base :", (catsAi || []).map((c: any) => c.slug).join(","));

  // 6) departements en base vs TECH_DEPARTMENTS
  const { count: nbDept } = await sb.from("departments").select("id", { count: "exact", head: true });
  const { data: deptsFr } = await sb.from("departments").select("code, country");
  const codesBase = new Set((deptsFr || []).map((d: any) => d.code));
  const codesTech = new Set(TECH_DEPARTMENTS.map((d) => d.code));
  const manquants = [...codesBase].filter((c) => !codesTech.has(c as string));
  console.log("G. departments base:", nbDept, "TECH_DEPARTMENTS:", TECH_DEPARTMENTS.length, "codes base absents de TECH_DEPARTMENTS:", manquants.length, manquants.join(","));

  // 7) guides / blog / price_guides
  const { count: nbGuides } = await sb.from("seo_guides").select("id", { count: "exact", head: true });
  const { count: nbBlogTot } = await sb.from("blog_posts").select("id", { count: "exact", head: true });
  const { count: nbBlogPub } = await sb.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published").not("published_at", "is", null);
  const { count: nbPgTot } = await sb.from("price_guides").select("id", { count: "exact", head: true });
  const { count: nbPgPub } = await sb.from("price_guides").select("id", { count: "exact", head: true }).eq("status", "published");
  console.log("H. seo_guides:", nbGuides, "| blog total:", nbBlogTot, "publies:", nbBlogPub, "| price_guides total:", nbPgTot, "publies:", nbPgPub);

  // 8) listes fermees
  console.log("I. TECH_CITIES:", TECH_CITIES.length, "| TOURISTIC_CITIES:", TOURISTIC_CITIES.length);
  const co = Object.values(COMPETITOR_OFFERS) as any[];
  console.log("J. COMPETITOR_OFFERS:", co.length, "avec model+price_text:", co.filter((c) => c.model && c.price_text).length, "exclus:", co.filter((c) => !(c.model && c.price_text)).map((c) => c.slug).join(","));

  // 9) categories par vertical
  const { data: cats } = await sb.from("categories").select("vertical");
  const parVert: Record<string, number> = {};
  for (const c of (cats || []) as any[]) parVert[c.vertical] = (parVert[c.vertical] || 0) + 1;
  console.log("K. categories par vertical :", JSON.stringify(parVert));
}
main().catch((e) => { console.error(e); process.exit(1); });
