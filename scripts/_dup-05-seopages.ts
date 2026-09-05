/** MESURE 4 : combien de pages listing disposent d'un contenu redactionnel
 *  propre (seo_pages.content) ? La page affiche SOIT ce contenu, SOIT les
 *  sections programmatiques (memes phrases partout). */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  for (const type of ["metier_ville", "metier_dept", null]) {
    const q = sb.from("seo_pages").select("id", { count: "exact", head: true }).not("content", "is", null);
    if (type) q.eq("type", type);
    const { count, error } = await q;
    console.log(`seo_pages avec content, type=${type ?? "TOUS"} : ${count ?? "?"} ${error ? error.message : ""}`);
  }
  const { count: tot } = await sb.from("seo_pages").select("id", { count: "exact", head: true });
  console.log(`seo_pages, total de lignes : ${tot}`);
  // Repartition par departement des pages metier_ville avec contenu
  const { data } = await sb.from("seo_pages")
    .select("slug,type,city:cities(name,department:departments(code))")
    .eq("type", "metier_ville").not("content", "is", null).limit(1000);
  const parDept = new Map<string, number>();
  for (const r of (data || []) as any[]) {
    const c = r.city?.department?.code || "?"; parDept.set(c, (parDept.get(c) || 0) + 1);
  }
  console.log("\nmetier_ville avec contenu, par departement (echantillon 1000) :");
  [...parDept.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
    .forEach(([d, n]) => console.log(`   dept ${d} : ${n}`));
})();
