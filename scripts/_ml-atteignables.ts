// Pour un echantillon de fiches OUVERTES tirees au hasard, verifie si la fiche
// est reellement liee depuis sa page listing metier x ville et metier x dept.
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const BASE = "https://workwave.fr";

async function estLie(page: string, slugFiche: string) {
  try {
    const r = await fetch(BASE + page, { redirect: "manual" });
    if (r.status !== 200) return { statut: r.status, lie: false };
    const h = await r.text();
    return { statut: 200, lie: h.includes(`/artisan/${slugFiche}"`) };
  } catch { return { statut: 0, lie: false }; }
}

async function main() {
  const sb = getServiceClient();
  const ids: number[] = [];
  for (let i = 0; i < 900; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const { data } = await sb
    .from("pros")
    .select("id, slug, etat_admin, categories(slug,vertical), cities(slug, departments(code,name))")
    .in("id", ids)
    .eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A")
    .limit(120);
  const ech = (data || []).filter((p: any) => p.categories?.vertical !== "tech" && p.cities?.slug && p.categories?.slug).slice(0, 80);
  console.log("fiches OUVERTES non-tech testees :", ech.length);

  let lieVille = 0, lieDept = 0, lieAucun = 0, villeRedirige = 0;
  const slugDept = (d: any) => {
    const n = (d?.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${n}-${(d?.code || "").toLowerCase()}`;
  };
  for (let i = 0; i < ech.length; i += 8) {
    const lot = ech.slice(i, i + 8);
    await Promise.all(lot.map(async (p: any) => {
      const m = p.categories.slug, v = p.cities.slug, d = slugDept(p.cities.departments);
      const rv = await estLie(`/${m}/${v}`, p.slug);
      const rd = await estLie(`/${m}/${d}`, p.slug);
      if (rv.statut === 308) villeRedirige++;
      if (rv.lie) lieVille++;
      if (rd.lie) lieDept++;
      if (!rv.lie && !rd.lie) lieAucun++;
    }));
  }
  const n = ech.length;
  console.log(`liee depuis /[metier]/[ville] page 1 : ${lieVille}/${n} (${(100*lieVille/n).toFixed(1)} %)`);
  console.log(`page ville en 308 (redirigee vers le dept) : ${villeRedirige}/${n} (${(100*villeRedirige/n).toFixed(1)} %)`);
  console.log(`liee depuis /[metier]/[dept] page 1 : ${lieDept}/${n} (${(100*lieDept/n).toFixed(1)} %)`);
  console.log(`AUCUN lien depuis les deux listings : ${lieAucun}/${n} (${(100*lieAucun/n).toFixed(1)} %)`);
}
main();
