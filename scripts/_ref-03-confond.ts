/** REFUTATION 3 : le "controle du biais de taille" du _dup-12 ne controle QUE le
 *  nombre de pros. Or Sprint 3 (09/04) a choisi ses 516 pages. Sur quel critere ?
 *  Si c'est la population/la demande de la commune, l'A/B compare des communes
 *  cherchees a des communes non cherchees, pas du contenu a de l'absence de contenu. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const acc: [string, number][] = JSON.parse(fs.readFileSync("/tmp/catville.json","utf8"));
  const { data: d86 } = await sb.from("departments").select("id").eq("code","86").limit(1);
  const dept86 = d86![0].id;
  const pop = new Map<number, number>(); const nom = new Map<number,string>();
  let off = 0;
  while (true) { const { data } = await sb.from("cities").select("id,name,population").eq("department_id",dept86).range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length) break; for(const c of r){pop.set(c.id,c.population||0); nom.set(c.id,c.name);} off+=r.length; }
  const avec = new Set<string>(); off=0;
  while (true) { const { data } = await sb.from("seo_pages").select("category_id,city_id")
      .eq("type","metier_ville").not("content","is",null).not("city_id","is",null).range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length) break; for(const s of r) avec.add(`${s.category_id}|${s.city_id}`); off+=r.length; }

  for (const [lab,min,max] of [["1-2 pros",1,2],["3-9 pros",3,9],["10+ pros",10,1e9]] as const) {
    const g: Record<string, number[]> = { AVEC: [], SANS: [] };
    for (const [k,n] of acc) { const [c,v]=k.split("|").map(Number);
      if (!pop.has(v) || n<min || n>max) continue;
      g[avec.has(k)?"AVEC":"SANS"].push(pop.get(v)!); }
    const med=(a:number[])=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0;};
    const moy=(a:number[])=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;
    console.log(`${lab.padEnd(9)} AVEC contenu : n=${String(g.AVEC.length).padStart(4)}  population de la commune : mediane ${String(med(g.AVEC)).padStart(6)}  moyenne ${String(moy(g.AVEC)).padStart(6)}`);
    console.log(`${" ".repeat(9)} SANS contenu : n=${String(g.SANS.length).padStart(4)}  population de la commune : mediane ${String(med(g.SANS)).padStart(6)}  moyenne ${String(moy(g.SANS)).padStart(6)}`);
  }
  // top communes du groupe AVEC
  const villesAvec = new Map<number,number>();
  for (const k of avec) { const v=Number(k.split("|")[1]); villesAvec.set(v,(villesAvec.get(v)||0)+1); }
  const t=[...villesAvec.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  console.log(`\ncommunes couvertes par les 516 pages : ${villesAvec.size}`);
  console.log("  " + t.map(([v,n])=>`${nom.get(v)} (${n} pages, pop ${pop.get(v)})`).join("\n  "));
})();
