import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PAGE = 1000;

async function main() {
  // 1. Villes citees par une page departement : top 10 population de chaque dept
  const { data: depts } = await sb.from("departments").select("id");
  const liees = new Set<string>();
  for (const d of (depts || []) as any[]) {
    const { data } = await sb.from("cities").select("slug").eq("department_id", d.id)
      .order("population", { ascending: false, nullsFirst: false }).limit(10);
    for (const c of (data || []) as any[]) liees.add(c.slug);
  }
  console.log("departements =", (depts || []).length, "| villes citees par les pages dept =", liees.size);

  // 2. Villes du top 300 par population (ce que le sitemap cat x ville declare)
  const { data: top300 } = await sb.from("cities").select("slug")
    .order("population", { ascending: false, nullsFirst: false }).limit(300);
  const top300Set = new Set((top300 || []).map((c: any) => c.slug));

  // 3. Parcourir la vue
  let off = 0, total = 0, dansLiees = 0, dansTop300 = 0, orphelines = 0;
  const exemples: string[] = [];
  while (true) {
    const { data, error } = await sb.from("listing_cat_ville").select("metier,ville,n").range(off, off + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data || []) as any[];
    if (rows.length === 0) break;
    for (const r of rows) {
      total++;
      const l = liees.has(r.ville), t = top300Set.has(r.ville);
      if (l) dansLiees++;
      if (t) dansTop300++;
      if (!l && !t) { orphelines++; if (exemples.length < 8 && r.n >= 20) exemples.push(`/${r.metier}/${r.ville} (${r.n})`); }
    }
    off += rows.length;
  }
  console.log("pages metier x ville (>=3 ouverts) =", total);
  console.log("  dont ville citee par une page dept =", dansLiees);
  console.log("  dont ville dans le top 300 (sitemap actuel) =", dansTop300);
  console.log("  NI lien dept NI sitemap =", orphelines);
  console.log("  exemples :", exemples.join(" | "));
}
main();
