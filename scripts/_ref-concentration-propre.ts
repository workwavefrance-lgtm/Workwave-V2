import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
(async () => {
  const sb = getServiceClient();
  const { data: v } = await sb.from("cities").select("id").eq("slug", "poitiers").limit(1);
  const { data: c } = await sb.from("categories").select("id").eq("slug", "plombier").limit(1);
  const { data: pros, count } = await sb.from("pros").select("slug", { count: "exact" })
    .eq("city_id", (v as any)[0].id).eq("category_id", (c as any)[0].id)
    .eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").limit(60);
  const slugs = (pros as any[]).map(p => p.slug);
  const cibles = new Map<string, number>(); let emis = 0, supprimer = 0;
  for (let i = 0; i < slugs.length; i += 6) {
    const res = await Promise.all(slugs.slice(i, i + 6).map(async (s) => {
      const r = await fetch(`${BASE}/artisan/${s}`, { redirect: "manual" });
      if (r.status !== 200) return { vrais: [] as string[], supp: 0 };
      const h = await r.text();
      const bruts = [...new Set([...h.matchAll(/href="\/artisan\/([^"]+)"/g)].map(m => m[1]))];
      const supp = bruts.filter(x => x.endsWith("/supprimer")).length;
      const vrais = bruts.filter(x => !x.includes("/") && x !== s);
      return { vrais, supp };
    }));
    for (const x of res) { supprimer += x.supp; emis += x.vrais.length; for (const t of x.vrais) cibles.set(t, (cibles.get(t) || 0) + 1); }
  }
  console.log(`plombiers OUVERTS a Poitiers : ${count}`);
  console.log(`liens comptes par l'audit comme "similaires" mais qui sont le lien RGPD /supprimer de la page elle-meme : ${supprimer}`);
  console.log(`  -> /artisan/*/supprimer est Disallow dans robots.txt ET noindex,nofollow : il ne distribue rien.`);
  console.log(`VRAIS liens pros similaires emis : ${emis}`);
  console.log(`fiches distinctes reellement visees : ${cibles.size}  (l'audit annonce 33)`);
  const top = [...cibles].sort((a,b)=>b[1]-a[1]).slice(0,5);
  console.log(`les 5 premieres captent ${top.reduce((s,x)=>s+x[1],0)}/${emis} = ${(100*top.reduce((s,x)=>s+x[1],0)/emis).toFixed(1)} %  (l'audit annonce 80,2 %)`);
  console.log(`\nPLAFOND ARITHMETIQUE de l'action proposee (tirage dans le meme couple metier x commune) :`);
  console.log(`  cibles distinctes possibles au maximum = ${count} (la grappe entiere).`);
  console.log(`  le critere de verification de l'audit (« plus de 100 cibles distinctes ») est donc inatteignable.`);
})();
