import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { SPECIALTIES } from "../lib/specialties";

async function main() {
  const sb = getServiceClient() as any;
  const lignes: { m: string; v: string; n: number }[] = [];
  for (let off = 0; off < 200000; off += 45000) {
    const { data } = await sb.rpc("sitemap_listings_page", { p_offset: off, p_limit: 45000 });
    const arr = (data || []) as any[];
    if (!arr.length) break;
    lignes.push(...arr);
    if (arr.length < 45000) break;
  }
  // 300 plus grandes villes (celles que le sitemap regarde)
  const { data: top } = await sb.from("cities").select("id, slug").order("population", { ascending: false, nullsFirst: false }).limit(300);
  const top300 = new Set((top || []).map((c: any) => c.slug));
  const { data: top100raw } = await sb.from("cities").select("id, slug").order("population", { ascending: false, nullsFirst: false }).limit(100);
  const top100 = new Set((top100raw || []).map((c: any) => c.slug));

  // combien de couples metier x ville hors top300 / hors top100
  const horsTop300 = lignes.filter((l) => !top300.has(l.v)).length;
  console.log("listing >=3 :", lignes.length, "| hors top300 :", horsTop300);

  // specialites : villes hors top100
  let perdues = 0, declarables = 0;
  const exemples: string[] = [];
  for (const m of Object.keys(SPECIALTIES)) {
    const specs = (SPECIALTIES as any)[m];
    const villes = lignes.filter((l) => l.m === m);
    for (const v of villes) {
      if (top100.has(v.v)) declarables += specs.length;
      else {
        perdues += specs.length;
        if (exemples.length < 6 && v.n >= 10) exemples.push(`/${m}/${specs[0].slug}/${v.v} (${v.n} pros)`);
      }
    }
  }
  console.log("specialites : declarables (villes du top100) =", declarables, "| hors top100 =", perdues);
  console.log("exemples hors top100 :", exemples.join("  "));
}
main().catch((e) => { console.error(e); process.exit(1); });
