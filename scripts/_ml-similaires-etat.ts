import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
async function main() {
  const sb = getServiceClient();
  const ids: number[] = []; for (let i = 0; i < 1500; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const { data } = await sb.from("pros").select("id,slug,etat_admin,categories(vertical)").in("id", ids)
    .eq("is_active", true).is("deleted_at", null).limit(200);
  const ouvertes = (data as any[]).filter(p => p.etat_admin === "A" && p.categories?.vertical !== "tech").slice(0, 15);
  const fermees = (data as any[]).filter(p => p.etat_admin === "F" && p.categories?.vertical !== "tech").slice(0, 15);
  for (const [nom, lot] of [["OUVERTES", ouvertes], ["FERMEES", fermees]] as const) {
    const cibles = new Set<string>();
    let pagesOk = 0;
    for (const p of lot as any[]) {
      const r = await fetch(`${BASE}/artisan/${p.slug}`, { redirect: "manual" });
      if (r.status !== 200) continue;
      pagesOk++;
      const h = await r.text();
      for (const m of h.matchAll(/href="\/artisan\/([^"\/]+)"/g)) if (m[1] !== p.slug) cibles.add(m[1]);
    }
    const liste = [...cibles];
    const { data: c } = await sb.from("pros").select("slug,etat_admin").in("slug", liste.slice(0, 200));
    const par = (c || []).reduce((a: any, x: any) => (a[x.etat_admin] = (a[x.etat_admin] || 0) + 1, a), {});
    console.log(`fiches ${nom} : ${pagesOk} pages en 200, ${liste.length} fiches liees en "similaires", etat des cibles :`, par);
  }
}
main();
