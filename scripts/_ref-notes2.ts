import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // Toutes les fiches notees ET ouvertes : ou sont-elles ?
  const rows: any[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("id,slug,category_id,city_id,google_rating,google_reviews_count,claimed_by_user_id,city:cities(name,department_id)")
      .is("deleted_at", null).eq("is_active", true)
      .not("google_rating", "is", null)
      .or("etat_admin.is.null,etat_admin.neq.F")
      .order("id").range(offset, offset + PAGE - 1);
    if (error) { console.error(error.message); break; }
    const r = data ?? [];
    if (r.length === 0) break;
    rows.push(...r);
    offset += r.length;
  }
  console.log("fiches notees + ouvertes :", rows.length);

  const paires = new Set<string>();
  const villes = new Set<number>();
  const depts = new Set<number>();
  for (const p of rows) {
    if (p.category_id && p.city_id) paires.add(`${p.category_id}|${p.city_id}`);
    if (p.city_id) villes.add(p.city_id);
    const d = (p.city as any)?.department_id;
    if (d) depts.add(d);
  }
  console.log("couples (metier, ville) touches :", paires.size);
  console.log("villes distinctes              :", villes.size);
  console.log("departements distincts         :", depts.size);

  // repartition par departement (top 10)
  const parDept = new Map<number, number>();
  for (const p of rows) {
    const d = (p.city as any)?.department_id; if (!d) continue;
    parDept.set(d, (parDept.get(d) ?? 0) + 1);
  }
  const top = [...parDept.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  const { data: dd } = await sb.from("departments").select("id,code,name").in("id", top.map(t=>t[0]));
  console.log("\nTop departements des fiches notees :");
  for (const [id, n] of top) {
    const d = (dd ?? []).find((x:any)=>x.id===id) as any;
    console.log(`  ${(d?.name ?? id) + " (" + (d?.code ?? "?") + ")"}`.padEnd(34), n, `= ${(100*n/rows.length).toFixed(1)}%`);
  }

  // combien ont >= 1 avis ET une note exploitable
  const avecCompte = rows.filter(p => (p.google_reviews_count ?? 0) > 0).length;
  console.log("\ndont google_reviews_count > 0  :", avecCompte);
}
main().catch((e) => console.error(e.message));
