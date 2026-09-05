import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();
(async () => {
  // Villes des 19 departements denses (par code postal du departement)
  const codes = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];
  const { data: depts } = await sb.from("departments").select("id, code, name").in("code", codes);
  const ids = (depts || []).map((d: any) => d.id);
  const villes: { id: number; slug: string }[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id, slug, population").in("department_id", ids)
      .order("population", { ascending: false }).range(off, off + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    villes.push(...rows.map((r: any) => ({ id: r.id, slug: r.slug })));
    off += rows.length;
    if (villes.length >= 300) break;
  }
  const { data: cats } = await sb.from("categories").select("id, slug, vertical").in("vertical", ["btp","domicile","personne"]);
  const catById = new Map((cats || []).map((c: any) => [c.id, c.slug]));
  const lot = villes.slice(0, 300).map((v) => v.id);
  const slugById = new Map(villes.map((v) => [v.id, v.slug]));
  const { data, error } = await sb.rpc("sitemap_city_cat_counts", { p_city_ids: lot });
  if (error) { console.log("RPC KO", error.message); return; }
  const arr = (data || []).filter((x: any) => catById.has(x.c));
  console.log("couples >=3 sur les 300 plus grandes villes des 19 depts denses :", arr.length);
  // echantillon de 25 couples au hasard
  const ech = arr.sort(() => Math.random() - 0.5).slice(0, 25);
  for (const x of ech) console.log(`/${catById.get(x.c)}/${slugById.get(x.v)}  n=${x.n}`);
})();
