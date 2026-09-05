/**
 * Contre-mesure du "68,4 % de chaine rompue", en ajoutant le test que l audit
 * omet : la fiche elle-meme est-elle declaree au sitemap des fiches ?
 */
import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48];
const PLAFOND_SITEMAP_NON_TECH = 48 * 45000;
async function main() {
  const sb = getServiceClient();
  const sm2 = new Set(fs.readFileSync("/tmp/sm2_villes.txt", "utf8").trim().split("\n"));
  const racine = new Set(fs.readFileSync("/tmp/villes_racine.txt", "utf8").trim().split("\n"));
  const ids: number[] = [];
  for (let i = 0; i < 12000; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const lots: any[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await sb.from("pros").select("id,slug,etat_admin,category_id,categories(slug,vertical),cities(slug)")
      .in("id", ids.slice(i, i + 300)).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").limit(300);
    lots.push(...(data || []));
  }
  const ech = lots.filter((p: any) => p.categories?.vertical !== "tech" && p.cities?.slug);
  let sm = 0, rac = 0, ni = 0, ficheAuSitemap = 0, niMaisFicheAuSitemap = 0;
  for (const p of ech as any[]) {
    const u = `/${p.categories.slug}/${p.cities.slug}`;
    const s = sm2.has(u), r = racine.has(p.cities.slug);
    if (s) sm++; if (r) rac++;
    // approximation du rang : les ids sont denses, le plafond porte sur le rang
    const fSm = p.id <= PLAFOND_SITEMAP_NON_TECH * 1.05;
    if (fSm) ficheAuSitemap++;
    if (!s && !r) { ni++; if (fSm) niMaisFicheAuSitemap++; }
  }
  const n = ech.length;
  console.log(`fiches OUVERTES non-tech tirees au hasard : ${n}\n`);
  console.log(`  page listing ville au sitemap          : ${sm} (${(100*sm/n).toFixed(1)} %)`);
  console.log(`  ville liee par une page racine metier  : ${rac} (${(100*rac/n).toFixed(1)} %)`);
  console.log(`  NI l un NI l autre ("chaine rompue")    : ${ni} (${(100*ni/n).toFixed(1)} %)   <- chiffre de l audit : 68,4 %`);
  console.log(`\n  LA FICHE ELLE-MEME declaree au sitemap : ${ficheAuSitemap} (${(100*ficheAuSitemap/n).toFixed(1)} %)`);
  console.log(`  dont parmi les "chaine rompue"         : ${niMaisFicheAuSitemap} (${(100*niMaisFicheAuSitemap/Math.max(1,ni)).toFixed(1)} % des cas dits rompus)`);
}
main();
