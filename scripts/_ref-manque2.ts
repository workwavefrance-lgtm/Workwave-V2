import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEPTS = ["75", "69", "13", "59", "33", "31", "06", "44"];
const CATS = [
  { id: 1, slug: "plombier", naf: ["4322A"] },
  { id: 2, slug: "electricien", naf: ["4321A", "4321B"] },
  { id: 3, slug: "macon", naf: ["4399C"] },
  { id: 4, slug: "peintre", naf: ["4334Z"] },
  { id: 5, slug: "menuisier", naf: ["4332A", "4332B"] },
];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function apiTotal(naf: string, dept: string) {
  const n = `${naf.slice(0, 2)}.${naf.slice(2)}`;
  const r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?activite_principale=${n}&departement=${dept}&etat_administratif=A&per_page=1`);
  if (!r.ok) return -1;
  const j: any = await r.json();
  return j.total_results ?? 0;
}
(async () => {
  let A = 0, B = 0;
  for (const d of DEPTS) {
    let api = 0, base = 0;
    for (const c of CATS) {
      for (const naf of c.naf) { const t = await apiTotal(naf, d); if (t > 0) api += t; await sleep(150); }
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", c.id).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").like("postal_code", d + "%");
      base += count || 0;
    }
    A += api; B += base;
    console.log(`dept ${d} : base ouverts ${base} | API entreprises actives ${api} | couverture ${((base / api) * 100).toFixed(1)}% | manque ${api - base}`);
  }
  console.log(`\n5 METIERS x 8 DEPTS DENSES : base ${B} / API ${A} = ${((B / A) * 100).toFixed(1)}% -> manque ${A - B} fiches ouvertes`);
  // controle rural non tronque
  let ra = 0, rb = 0;
  for (const d of ["23", "48", "15"]) {
    for (const c of CATS) {
      for (const naf of c.naf) { const t = await apiTotal(naf, d); if (t > 0) ra += t; await sleep(150); }
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", c.id).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").like("postal_code", d + "%");
      rb += count || 0;
    }
  }
  console.log(`CONTROLE RURAL (23,48,15) : base ${rb} / API ${ra} = ${((rb / ra) * 100).toFixed(1)}%`);
})();
