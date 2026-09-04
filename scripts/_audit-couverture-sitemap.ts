/**
 * Ce qui EXISTE en base, par famille de pages, contre ce que le sitemap declare.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug, vertical");
  const btp = (cats || []).filter((c) => ["btp", "domicile", "personne"].includes(c.vertical));
  const tech = (cats || []).filter((c) => c.vertical === "tech");
  const { count: nbDepts } = await sb.from("departments").select("id", { count: "exact", head: true });
  const { count: nbVilles } = await sb.from("cities").select("id", { count: "exact", head: true });
  const { count: nbGuides } = await sb.from("price_guides").select("id", { count: "exact", head: true });
  const { count: nbBlog } = await sb.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published");
  const { count: fichesOuvertes } = await sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).or(OUVERT);
  const { count: fichesTotal } = await sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);

  console.log("EXISTE EN BASE");
  console.log(`  categories BTP/domicile/personne : ${btp.length} · tech : ${tech.length}`);
  console.log(`  departements : ${nbDepts} · communes : ${nbVilles}`);
  console.log(`  metier x departement possibles : ${btp.length * (nbDepts || 0)}`);
  console.log(`  guides de prix : ${nbGuides} · articles blog publies : ${nbBlog}`);
  console.log(`  fiches actives : ${fichesTotal} dont ouvertes : ${fichesOuvertes}`);

  // metier x dept ayant au moins 1 pro ouvert : compte par dept via les villes
  const { data: villes } = await sb.from("cities").select("id, department_id").limit(1);
  console.log("\nDECLARE AU SITEMAP (mesure ce jour)");
  console.log("  metier x ville : 8 405 · metier x dept : 6 031 · specialite x ville : 4 535");
  console.log("  guides : 478 · blog : 163 · trouver-des-chantiers : 132 · trouver-des-clients : 32 · /ai : 1 562");
  console.log("  fiches : 48 sous-sitemaps x 45 000 (non-tech) + 14 x 45 000 (tech)");
  void villes;
})();
