// Pour des fiches OUVERTES au hasard : la page listing qui les lie est-elle
// elle-meme atteignable (au sitemap OU dans la liste fixe des racines metier
// OU liee par sa page departement) ?
import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const sm2 = new Set(fs.readFileSync("/tmp/sm2_villes.txt", "utf8").trim().split("\n"));
  const v988 = new Set(fs.readFileSync("/tmp/villes988.txt", "utf8").trim().split("\n"));
  const ids: number[] = []; for (let i = 0; i < 9000; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const lots: any[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await sb.from("pros").select("etat_admin,categories(slug,vertical),cities(slug)")
      .in("id", ids.slice(i, i + 300)).eq("is_active", true).is("deleted_at", null).limit(300);
    lots.push(...(data || []));
  }
  for (const etat of ["A", "F"]) {
    const ech = lots.filter((p: any) => p.etat_admin === etat && p.categories?.vertical !== "tech" && p.cities?.slug);
    let sitemap = 0, racine = 0, ni = 0;
    for (const p of ech as any[]) {
      const u = `/${p.categories.slug}/${p.cities.slug}`;
      const s = sm2.has(u), r = v988.has(p.cities.slug);
      if (s) sitemap++; if (r) racine++; if (!s && !r) ni++;
    }
    const n = ech.length;
    console.log(`\n=== fiches etat='${etat}' : ${n} tirees au hasard ===`);
    console.log(`  page listing ville au sitemap        : ${sitemap} (${(100*sitemap/n).toFixed(1)} %)`);
    console.log(`  ville dans la liste fixe des racines : ${racine} (${(100*racine/n).toFixed(1)} %)`);
    console.log(`  NI l un NI l autre (chaine rompue)   : ${ni} (${(100*ni/n).toFixed(1)} %)`);
  }
}
main();
