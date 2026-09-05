import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
async function estLie(page: string, slug: string) {
  try { const r = await fetch(BASE + page, { redirect: "manual" });
    if (r.status !== 200) return { s: r.status, lie: false };
    const h = await r.text(); return { s: 200, lie: h.includes(`/artisan/${slug}"`) };
  } catch { return { s: 0, lie: false }; }
}
const slugDept = (d: any) => {
  const n = (d?.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${n}-${(d?.code || "").toLowerCase()}`;
};
async function tirer(etat: string, n: number) {
  const sb = getServiceClient(); const out: any[] = [];
  for (let t = 0; t < 8 && out.length < n; t++) {
    const ids: number[] = []; for (let i = 0; i < 1200; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
    const { data } = await sb.from("pros")
      .select("id, slug, etat_admin, categories(slug,vertical), cities(slug, departments(code,name))")
      .in("id", ids).eq("is_active", true).is("deleted_at", null).eq("etat_admin", etat).limit(200);
    for (const p of (data || []) as any[]) if (p.categories?.vertical !== "tech" && p.cities?.slug && p.categories?.slug) out.push(p);
  }
  return out.slice(0, n);
}
async function mesurer(etat: string, n: number) {
  const ech = await tirer(etat, n);
  let ville = 0, dept = 0, aucun = 0, red = 0;
  for (let i = 0; i < ech.length; i += 10) {
    await Promise.all(ech.slice(i, i + 10).map(async (p: any) => {
      const rv = await estLie(`/${p.categories.slug}/${p.cities.slug}`, p.slug);
      const rd = await estLie(`/${p.categories.slug}/${slugDept(p.cities.departments)}`, p.slug);
      if (rv.s === 308) red++; if (rv.lie) ville++; if (rd.lie) dept++;
      if (!rv.lie && !rd.lie) aucun++;
    }));
  }
  const N = ech.length;
  console.log(`\n=== etat_admin='${etat}' : ${N} fiches tirees au hasard ===`);
  console.log(`  liee page1 metier x ville : ${ville} (${(100*ville/N).toFixed(1)} %)`);
  console.log(`  page ville en 308         : ${red} (${(100*red/N).toFixed(1)} %)`);
  console.log(`  liee page1 metier x dept  : ${dept} (${(100*dept/N).toFixed(1)} %)`);
  console.log(`  AUCUN lien listing        : ${aucun} (${(100*aucun/N).toFixed(1)} %)`);
}
async function main() { await mesurer("A", 90); await mesurer("F", 90); }
main();
