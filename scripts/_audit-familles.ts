import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const O = "etat_admin.is.null,etat_admin.neq.F";
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug, vertical, name");
  const btp = (cats || []).filter((c) => ["btp", "domicile", "personne"].includes(c.vertical));
  const { data: depts } = await sb.from("departments").select("id, code, name");
  // metier x dept avec au moins 1 pro ouvert
  let comboDept = 0, comboDept3 = 0;
  for (const d of depts || []) {
    const { data: v } = await sb.from("cities").select("id").eq("department_id", d.id);
    const ids = (v || []).map((x) => x.id); if (!ids.length) continue;
    const { data } = await sb.rpc("sitemap_city_cat_counts", { p_city_ids: ids });
    const parCat = new Map<number, number>();
    for (const r of (data || []) as { c: number; n: number }[]) parCat.set(r.c, (parCat.get(r.c) || 0) + Number(r.n));
    for (const [c, n] of parCat) { if (!btp.some((b) => b.id === c)) continue; comboDept++; if (n >= 3) comboDept3++; }
  }
  console.log(`metier x departement : ${comboDept} avec au moins 1 pro ouvert (dont ${comboDept3} avec >= 3) · declares 6 031 · possibles 6 099`);
  // guides
  const { data: g } = await sb.from("price_guides").select("slug, scope, metier_slug").limit(1000);
  console.log(`guides de prix : ${(g || []).length} en base · 478 declares · manquants ${(g || []).length - 478}`);
  // trouver-des-chantiers / clients : combien de metiers eligibles
  const chantiers = btp.filter((c) => c.vertical === "btp");
  const clients = btp.filter((c) => ["domicile", "personne"].includes(c.vertical));
  console.log(`trouver-des-chantiers : ${chantiers.length} metiers BTP en base · 132 declares`);
  console.log(`trouver-des-clients : ${clients.length} metiers domicile+personne · 32 declares`);
  console.log(`racines /[metier] : ${btp.length} BTP-domicile-personne + tech · 76 declares`);
})();
