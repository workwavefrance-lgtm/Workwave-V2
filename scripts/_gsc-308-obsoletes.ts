/**
 * Les 24 pages que Google classe en page 1 et qui REDIRIGENT (308 Phase D :
 * commune sans pro -> page departement). Question : la redirection est-elle
 * encore justifiee, maintenant que la base est passee de 226 k a 2,44 M de
 * fiches ? Si la commune a des pros ouverts, la page devrait s'afficher.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
(async () => {
  const pages: any[] = JSON.parse(fs.readFileSync("/tmp/pages-142.json", "utf8"));
  const red = pages.filter((p) => p.code === 308);
  console.log(`${red.length} redirections, ${red.reduce((s, p) => s + p.imp, 0)} impressions\n`);
  for (const p of red) {
    const [, metier, ville] = p.url.split("/");
    if (!ville) { console.log(`  ? ${p.url} (pas une page metier x ville)`); continue; }
    const { data: cat } = await sb.from("categories").select("id").eq("slug", metier).maybeSingle();
    const { data: c } = await sb.from("cities").select("id, name").eq("slug", ville).maybeSingle();
    if (!cat || !c) { console.log(`  ? ${p.url} (metier ou commune introuvable)`); continue; }
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("category_id", cat.id).eq("city_id", c.id)
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
    console.log(`  ${String(count).padStart(4)} pros ouverts · ${String(p.imp).padStart(4)} imp · pos ${p.pos} · ${p.url}`);
  }
})();
