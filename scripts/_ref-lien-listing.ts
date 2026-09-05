import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  // 6 fiches FERMEES crawlees le 03/09, avec ville et categorie
  const fs2 = await import("fs");
  const slugs = fs2.readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean).slice(0, 400);
  const { data } = await sb.from("pros")
    .select("slug, etat_admin, city_id, category_id, cities(slug), categories(slug)")
    .in("slug", slugs).eq("etat_admin", "F").limit(6);
  for (const p of (data || []) as any[]) {
    const url = `https://workwave.fr/${p.categories?.slug}/${p.cities?.slug}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = r.status === 200 ? await r.text() : "";
    const lie = html.includes(`/artisan/${p.slug}`);
    console.log(`${p.slug} | listing ${url} -> HTTP ${r.status} | lien present : ${lie ? "OUI" : "non"}`);
  }
}
main();
