import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import * as fs from "fs";
const sb = getServiceClient();
(async () => {
  const top = JSON.parse(fs.readFileSync("/tmp/_fiches-cliquees.json", "utf8"));
  const out: any[] = [];
  for (const t of top.slice(0, 14)) {
    const slug = t.url.replace("https://workwave.fr/artisan/", "");
    const { data: p } = await sb.from("pros").select("id,slug,city_id,category_id,city:cities(name)").eq("slug", slug).limit(1);
    const pro = (p || [])[0] as any; if (!pro) { console.log("absent:", slug); continue; }
    const { data: v } = await sb.from("pros").select("slug,name").eq("city_id", pro.city_id).eq("category_id", pro.category_id)
      .eq("is_active", true).is("deleted_at", null).neq("id", pro.id).limit(2);
    const voisin = (v || [])[0] as any;
    if (!voisin) continue;
    out.push({ clics: t.clics, a: slug, b: voisin.slug, ville: pro.city?.name });
  }
  fs.writeFileSync("/tmp/_paires-indexees.json", JSON.stringify(out, null, 1));
  out.forEach(o => console.log(`${String(o.clics).padStart(4)} clics | ${o.ville} | ${o.a}  VS  ${o.b}`));
})();
