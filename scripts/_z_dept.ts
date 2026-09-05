import path from "path"; import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";
async function main() {
  const sb = getServiceClient();
  // 1) communes par departement : le plafond PostgREST (1000) tronque-t-il getCityIdsByDepartment ?
  const { data: depts } = await sb.from("departments").select("id,code,name").limit(200);
  const tailles: { code: string; n: number }[] = [];
  for (const d of (depts as any[]) || []) {
    const { count } = await sb.from("cities").select("id", { count: "exact", head: true }).eq("department_id", d.id);
    tailles.push({ code: d.code, n: count || 0 });
  }
  tailles.sort((a, b) => b.n - a.n);
  console.log("communes par dept, top 5 :", JSON.stringify(tailles.slice(0, 5)), "| depts > 1000 communes :", tailles.filter((t) => t.n > 1000).length);
  // lecture reelle par la fonction du site (client anon, sans limit) sur le plus gros dept
  const gros = (depts as any[]).find((d) => d.code === tailles[0].code);
  const { data: ids } = await sb.from("cities").select("id").eq("department_id", gros.id);
  console.log(`getCityIdsByDepartment(${gros.code}) rend ${ (ids||[]).length } ids pour ${tailles[0].n} communes en base`);

  // 2) metier x dept : combien d artisans ouverts, vs 10 affiches
  const paires: [string, string][] = [["plombier","75"],["electricien","13"],["macon","59"],["menuisier","69"],["peintre","33"],["plaquiste","BRU"],["menage","75"],["macon","06"]];
  for (const [cs, dc] of paires) {
    const { data: cat } = await sb.from("categories").select("id").eq("slug", cs).single();
    const { data: dep } = await sb.from("departments").select("id,name").eq("code", dc).limit(1).maybeSingle();
    if (!cat || !dep) { console.log(cs, dc, "introuvable"); continue; }
    const { data: cityIds } = await sb.from("cities").select("id").eq("department_id", (dep as any).id);
    const all = (cityIds || []).map((c: any) => c.id);
    let total = 0;
    for (let i = 0; i < all.length; i += 400) {
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", (cat as any).id).in("city_id", all.slice(i, i + 400))
        .is("deleted_at", null).eq("is_active", true).or(OUVERTS);
      total += count || 0;
    }
    console.log(JSON.stringify({ page: `/${cs}/${dc}`, dept: (dep as any).name, communes: all.length, ouverts: total, affiches_page1: Math.min(10, total), fenetre_scoring: Math.min(100, total), pct_fenetre: total ? Math.round((Math.min(100,total)/total)*1000)/10 : null, pages_pagination_necessaires: Math.ceil(total/20), au_dela_de_la_page_500: Math.max(0, total - 500*20) }));
  }
}
main().catch((e)=>{console.error(e);process.exit(1);});
