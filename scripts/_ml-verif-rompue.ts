import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
async function main() {
  const sb = getServiceClient();
  const sm2 = new Set(fs.readFileSync("/tmp/sm2_villes.txt", "utf8").trim().split("\n"));
  const v988 = new Set(fs.readFileSync("/tmp/villes988.txt", "utf8").trim().split("\n"));
  const ids: number[] = []; for (let i = 0; i < 4000; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const lots: any[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await sb.from("pros").select("slug,etat_admin,categories(slug,vertical),cities(slug)")
      .in("id", ids.slice(i, i + 300)).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").limit(300);
    lots.push(...(data || []));
  }
  const rompues = lots.filter((p: any) => p.categories?.vertical !== "tech" && p.cities?.slug
    && !sm2.has(`/${p.categories.slug}/${p.cities.slug}`) && !v988.has(p.cities.slug)).slice(0, 25);
  let s200 = 0, s308 = 0, lieFiche = 0;
  for (let i = 0; i < rompues.length; i += 5) {
    await Promise.all(rompues.slice(i, i + 5).map(async (p: any) => {
      const u = `/${p.categories.slug}/${p.cities.slug}`;
      const r = await fetch(BASE + u, { redirect: "manual" });
      if (r.status === 308) { s308++; return; }
      if (r.status !== 200) return;
      s200++;
      const h = await r.text();
      if (h.includes(`/artisan/${p.slug}"`)) lieFiche++;
    }));
  }
  console.log(`cas "chaine rompue" testes en direct : ${rompues.length}`);
  console.log(`  page ville en 200 : ${s200}`);
  console.log(`  page ville en 308 : ${s308}`);
  console.log(`  page ville en 200 QUI LIE la fiche : ${lieFiche}`);
  console.log(`\nexemples :`, rompues.slice(0, 5).map((p: any) => `/${p.categories.slug}/${p.cities.slug} -> /artisan/${p.slug}`).join("  |  "));
}
main();
