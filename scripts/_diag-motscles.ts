import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await sb.from("categories").select("id,slug,name,seo_keywords,vertical")
    .in("vertical", ["btp", "domicile", "personne"]).order("id");
  const rows = data || [];
  const avec = rows.filter((c: any) => c.seo_keywords && String(c.seo_keywords).length > 2);
  console.log(`categories BTP/domicile/personne : ${rows.length}`);
  console.log(`avec mots-cles renseignes        : ${avec.length}`);
  console.log("\nexemples :");
  avec.slice(0, 6).forEach((c: any) => console.log(`  ${c.name.padEnd(22)} -> ${JSON.stringify(c.seo_keywords).slice(0, 120)}`));
  // metiers les plus demandes reellement
  const { data: pr } = await sb.from("projects").select("category_id").neq("status", "deleted").limit(500);
  const n: Record<string, number> = {};
  (pr || []).forEach((p: any) => { n[p.category_id] = (n[p.category_id] || 0) + 1; });
  const nom = Object.fromEntries(rows.map((c: any) => [c.id, c.name]));
  console.log("\nMETIERS LES PLUS DEMANDES (vrais projets) :");
  Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .forEach(([id, v]) => console.log(`  ${String(v).padStart(3)}  ${nom[id] || "cat " + id}`));
})();
