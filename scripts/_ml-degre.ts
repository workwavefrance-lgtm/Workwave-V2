import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
async function main() {
  const sb = getServiceClient();
  const ids: number[] = []; for (let i = 0; i < 1500; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const { data } = await sb.from("pros").select("slug,etat_admin,categories(vertical)").in("id", ids)
    .eq("is_active", true).is("deleted_at", null).limit(200);
  const ech = (data as any[]).filter(p => p.categories?.vertical !== "tech").slice(0, 24);
  let sArt = 0, sTot = 0, n = 0;
  for (let i = 0; i < ech.length; i += 6) {
    const res = await Promise.all(ech.slice(i, i + 6).map(async (p: any) => {
      const r = await fetch(`${BASE}/artisan/${p.slug}`, { redirect: "manual" });
      if (r.status !== 200) return null;
      const h = await r.text();
      const art = new Set([...h.matchAll(/href="(\/artisan\/[^"]+)"/g)].map(m => m[1])).size;
      const tot = new Set([...h.matchAll(/href="(\/[^"]*)"/g)].map(m => m[1]).filter(x => !x.startsWith("/_next") && !/\.(png|ico|css|js|woff2|webmanifest)/.test(x))).size;
      return { art, tot };
    }));
    for (const x of res) if (x) { sArt += x.art; sTot += x.tot; n++; }
  }
  console.log(`fiches mesurees : ${n}`);
  console.log(`liens sortants /artisan/ par fiche (moyenne) : ${(sArt/n).toFixed(1)}`);
  console.log(`liens internes totaux par fiche (moyenne) : ${(sTot/n).toFixed(1)}`);
  console.log(`=> liens fiche->fiche emis sur tout le site : ${Math.round(sArt/n*2439976).toLocaleString("fr-FR")}`);
}
main();
