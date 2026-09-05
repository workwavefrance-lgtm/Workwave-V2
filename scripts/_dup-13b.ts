import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const BASE = "https://workwave.fr";
function texte(h: string) { return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&[a-z]+;|&#\d+;/gi," ").replace(/\s+/g," ").trim().toLowerCase(); }
function gram(t: string, n=6){const m=t.split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);if(ga.size<50||gb.size<50)return null;
  let c=0;for(const g of ga)if(gb.has(g))c++;return (c/Math.min(ga.size,gb.size))*100;}
async function get(u:string){try{const r=await fetch(`${BASE}${u}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"},redirect:"manual"});
  if(r.status!==200){console.log(`   ${u} HTTP ${r.status}`);return null;} return texte(await r.text());}catch{return null;}}
(async () => {
  const g = new Map<string, any[]>();
  for (const dep of [200_000, 900_000, 1_800_000, 2_600_000]) {
    const { data } = await sb.from("pros").select("slug,city_id,category_id,etat_admin")
      .eq("is_active", true).is("deleted_at", null).gt("id", dep).order("id").limit(1000);
    for (const p of (data || []) as any[]) { const k = `${p.city_id}|${p.category_id}`;
      if (!g.has(k)) g.set(k, []); g.get(k)!.push(p); }
  }
  const OO: any[][] = [], FF: any[][] = [], OF: any[][] = [];
  for (const arr of g.values()) {
    const o = arr.filter(p => p.etat_admin !== "F"), f = arr.filter(p => p.etat_admin === "F");
    if (o.length >= 2 && OO.length < 4) OO.push([o[0], o[1]]);
    if (f.length >= 2 && FF.length < 4) FF.push([f[0], f[1]]);
    if (o.length >= 1 && f.length >= 1 && OF.length < 4) OF.push([o[0], f[0]]);
  }
  console.log(`groupes metier x commune trouves : ${g.size} · paires OO=${OO.length} FF=${FF.length} OF=${OF.length}\n`);
  for (const [lab, paires] of [["OUVERTE vs OUVERTE", OO], ["FERMEE vs FERMEE", FF], ["OUVERTE vs FERMEE", OF]] as const) {
    const s: number[] = [];
    for (const [a, b] of paires) {
      const ta = await get(`/artisan/${a.slug}`); if (!ta) continue;
      const tb = await get(`/artisan/${b.slug}`); if (!tb) continue;
      const r = rec(ta, tb); if (r !== null) s.push(r);
    }
    console.log(`${lab.padEnd(22)} : ${s.length} paires, moyenne ${s.length ? (s.reduce((x,y)=>x+y,0)/s.length).toFixed(1) : "-"} %   [${s.map(x=>x.toFixed(0)).join(", ")}]`);
  }
})();
