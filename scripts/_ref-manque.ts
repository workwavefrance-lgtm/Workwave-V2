import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEPTS = ["75", "69", "13", "59", "33", "31", "06", "44"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiTotal(naf: string, dept: string): Promise<number> {
  const n = naf.length === 5 ? `${naf.slice(0, 2)}.${naf.slice(2)}` : naf;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?activite_principale=${n}&departement=${dept}&etat_administratif=A&per_page=1`);
    if (r.ok) { const j: any = await r.json(); return j.total_results ?? 0; }
    await sleep(1500);
  }
  return -1;
}
(async () => {
  const { data: cats } = await sb.from("categories").select("id,slug,naf_codes,vertical")
    .in("vertical", ["btp", "domicile", "personne"]);
  const list = (cats || []).filter((c: any) => (c.naf_codes || []).length);
  console.log(`${list.length} categories BTP/domicile/personne avec NAF`);
  let sumApi = 0, sumBase = 0;
  const detail: string[] = [];
  for (const d of DEPTS) {
    let api = 0, base = 0;
    for (const c of list as any[]) {
      for (const naf of c.naf_codes) { const t = await apiTotal(naf, d); if (t > 0) api += t; await sleep(160); }
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", c.id).eq("is_active", true).is("deleted_at", null)
        .eq("etat_admin", "A").like("postal_code", d + "%");
      base += count || 0;
    }
    sumApi += api; sumBase += base;
    detail.push(`dept ${d} : base OUVERTS ${base}  |  API entreprises actives ${api}  |  couverture ${((base / api) * 100).toFixed(1)}%  |  manque ${api - base}`);
    console.log(detail[detail.length - 1]);
  }
  console.log(`\nTOTAL 8 depts denses : base ${sumBase} / API ${sumApi} = ${((sumBase / sumApi) * 100).toFixed(1)}%  -> manque ${sumApi - sumBase} fiches ouvertes`);
})();
