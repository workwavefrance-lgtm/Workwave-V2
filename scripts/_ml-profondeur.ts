// Trace le chemin le plus court home -> fiche pour des fiches tirees au hasard,
// en verifiant a chaque etape que le lien existe VRAIMENT dans le HTML servi.
import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
const cache = new Map<string, string>();
async function html(u: string) {
  if (cache.has(u)) return cache.get(u)!;
  const r = await fetch(BASE + u, { redirect: "manual" });
  const t = r.status === 200 ? await r.text() : "";
  cache.set(u, t); return t;
}
const lie = (h: string, cible: string) => h.includes(`href="${cible}"`);
const slugDept = (d: any) => {
  const n = (d?.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${n}-${(d?.code || "").toLowerCase()}`;
};
async function main() {
  const sb = getServiceClient();
  const ids: number[] = []; for (let i = 0; i < 1500; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const { data } = await sb.from("pros").select("slug,etat_admin,categories(slug,vertical),cities(slug,departments(code,name))")
    .in("id", ids).eq("is_active", true).is("deleted_at", null).limit(200);
  const ech = (data as any[]).filter(p => p.categories?.vertical !== "tech" && p.cities?.slug).slice(0, 10);
  const home = await html("/");
  for (const p of ech) {
    const m = p.categories.slug, v = `/${m}/${p.cities.slug}`, d = `/${m}/${slugDept(p.cities.departments)}`, f = `/artisan/${p.slug}`;
    let chemin = "NON ATTEINTE en 4 clics";
    if (lie(home, f)) chemin = "1 clic : home -> fiche";
    else {
      const hv = await html(v), hd = await html(d), hm = await html(`/${m}`);
      const surVille = hv && lie(hv, f), surDept = hd && lie(hd, f);
      if (surDept && lie(home, d)) chemin = `2 clics : home -> ${d} -> fiche`;
      else if (surVille && lie(home, v)) chemin = `2 clics : home -> ${v} -> fiche`;
      else if (surVille && lie(hd, v) && lie(home, d)) chemin = `3 clics : home -> ${d} -> ${v} -> fiche`;
      else if (surVille && lie(hm, v)) {
        // /[metier] est-il lie depuis une page de profondeur 1 ?
        const depuisDept = lie(hd, `/${m}`) && lie(home, d);
        chemin = depuisDept ? `4 clics : home -> ${d} -> /${m} -> ${v} -> fiche` : `>=4 clics via /${m}`;
      } else if (surDept) chemin = `>=3 clics via ${d}`;
      else chemin = `AUCUN listing ne lie la fiche (etat=${p.etat_admin})`;
    }
    console.log(`${p.slug} [${p.etat_admin}] ${m} ${p.cities.slug} => ${chemin}`);
  }
}
main();
