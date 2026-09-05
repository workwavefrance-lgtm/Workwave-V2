import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{persistSession:false,autoRefreshToken:false}});
const BASE = "https://workwave.fr";
function texte(h: string) { return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&[a-z]+;|&#\d+;/gi," ").replace(/\s+/g," ").trim().toLowerCase(); }
function gram(t: string, n=6){const m=t.split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);if(ga.size<50||gb.size<50)return null;
  let c=0;for(const g of ga)if(gb.has(g))c++;return (c/Math.min(ga.size,gb.size))*100;}
async function get(u:string){try{const r=await fetch(`${BASE}${u}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"},redirect:"manual"});
  if(r.status!==200)return null;return texte(await r.text());}catch{return null;}}
(async () => {
  // 12 fermees et 12 ouvertes tirees dans des communes ET metiers TOUS differents
  const pick = async (etat: string) => {
    const out: any[] = []; const villes = new Set(), cats = new Set();
    for (const dep of [150_000, 500_000, 800_000, 1_100_000, 1_400_000, 1_700_000, 2_000_000, 2_300_000, 2_500_000]) {
      const { data } = await sb.from("pros").select("slug,city_id,category_id")
        .eq("is_active", true).is("deleted_at", null).eq("etat_admin", etat).gt("id", dep).order("id").limit(300);
      for (const p of (data || []) as any[]) {
        if (villes.has(p.city_id) || cats.has(p.category_id)) continue;
        villes.add(p.city_id); cats.add(p.category_id); out.push(p); if (out.length >= 12) return out;
      }
    }
    return out;
  };
  const F = await pick("F"), A = await pick("A");
  const moy = (x:number[]) => x.length ? x.reduce((a,b)=>a+b,0)/x.length : NaN;
  for (const [lab, arr] of [["FERMEES etrangeres", F], ["OUVERTES etrangeres", A]] as const) {
    const s: number[] = [];
    for (let i = 0; i + 1 < arr.length; i += 2) {
      const a = await get(`/artisan/${arr[i].slug}`), b = await get(`/artisan/${arr[i+1].slug}`);
      if (a && b) { const r = rec(a,b); if (r !== null) s.push(r); }
    }
    console.log(`${lab.padEnd(22)} : ${s.length} paires, plancher gabarit ${moy(s).toFixed(1)} %  [${s.map(x=>x.toFixed(0)).join(", ")}]`);
  }
})();
