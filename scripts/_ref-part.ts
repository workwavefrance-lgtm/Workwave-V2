import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const sm2 = new Set(fs.readFileSync("/tmp/sm2.txt","utf8").trim().split("\n").map(u=>u.replace("https://workwave.fr","")));
  let off = 0, dansN = 0, dansL = 0, horsN = 0, horsL = 0;
  while (true) {
    const { data } = await sb.from("listing_cat_ville").select("metier,ville,n").order("n",{ascending:false}).order("metier").order("ville").range(off, off+999);
    const rows = (data||[]) as any[]; if (!rows.length) break;
    for (const r of rows) { const u = `/${r.metier}/${r.ville}`; if (sm2.has(u)) { dansN += r.n; dansL++; } else { horsN += r.n; horsL++; } }
    off += rows.length;
  }
  console.log(`couples >=3 DANS /sitemap/2.xml : ${dansL} pages, ${dansN} pros ouverts derriere`);
  console.log(`couples >=3 HORS sitemap        : ${horsL} pages, ${horsN} pros ouverts derriere`);
  const nonTechOuverts = 860657;
  console.log(`part des pros ouverts non tech dont le listing est deja au sitemap : ${(100*dansN/nonTechOuverts).toFixed(1)} %`);
  console.log(`part apres le deploiement des commits 7076a7b/8f48e1f (sitemaps 300-302) : ${(100*(dansN+horsN)/nonTechOuverts).toFixed(1)} %`);
}
main();
