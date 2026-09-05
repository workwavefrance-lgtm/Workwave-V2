/** MESURE 15 : sur quel AXE se joue la ressemblance entre fiches ?
 *  meme commune+meme metier / meme commune+autre metier / autre commune+meme
 *  metier (meme dept) / autre departement+meme metier / rien a voir. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const BASE = "https://workwave.fr";
function texte(h:string){return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&[a-z]+;|&#\d+;/gi," ").replace(/\s+/g," ").trim().toLowerCase();}
function gram(t:string,n=6){const m=t.split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);if(ga.size<50||gb.size<50)return null;
  let c=0;for(const g of ga)if(gb.has(g))c++;return (c/Math.min(ga.size,gb.size))*100;}
const cache=new Map<string,string|null>();
async function get(u:string){if(cache.has(u))return cache.get(u)!;
  try{const r=await fetch(`${BASE}/artisan/${u}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"},redirect:"manual"});
  const v=r.status===200?texte(await r.text()):null;cache.set(u,v);return v;}catch{cache.set(u,null);return null;}}

async function pros(filtre:(q:any)=>any, n=4){
  const q = filtre(sb.from("pros").select("slug,city_id,category_id,name")
    .eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F"));
  const { data } = await q.limit(n); return (data||[]) as any[];
}
(async () => {
  // Ancre : un groupe dense, metier BTP, grande commune
  const { data: cat } = await sb.from("categories").select("id").eq("slug","electricien").limit(1);
  const { data: cat2 } = await sb.from("categories").select("id").eq("slug","plombier").limit(1);
  const { data: v1 } = await sb.from("cities").select("id,department_id").eq("slug","bordeaux").limit(1);
  const { data: v2 } = await sb.from("cities").select("id").eq("slug","merignac").limit(1);
  const { data: v3 } = await sb.from("cities").select("id").eq("slug","lille").limit(1);
  const C = cat![0].id, C2 = cat2![0].id, V1 = v1![0].id, V2 = v2![0].id, V3 = v3![0].id;

  const A  = await pros(q => q.eq("category_id",C).eq("city_id",V1), 6);   // ancre
  const B  = await pros(q => q.eq("category_id",C2).eq("city_id",V1), 4);  // meme commune, autre metier
  const D  = await pros(q => q.eq("category_id",C).eq("city_id",V2), 4);   // autre commune, meme dept, meme metier
  const E  = await pros(q => q.eq("category_id",C).eq("city_id",V3), 4);   // autre dept, meme metier

  const ta = await get(A[0]?.slug); if (!ta) { console.log("ancre indisponible"); return; }
  const mesure = async (lab: string, arr: any[], sautAncre = false) => {
    const s: number[] = [];
    for (const p of arr) { if (p.slug === A[0].slug) continue;
      const t = await get(p.slug); if (!t) continue; const r = rec(ta, t); if (r !== null) s.push(r); if (s.length >= 3) break; }
    console.log(`${lab.padEnd(46)} ${s.length ? (s.reduce((x,y)=>x+y,0)/s.length).toFixed(1).padStart(5) : "   - "} %   [${s.map(x=>x.toFixed(0)).join(", ")}]`);
  };
  console.log(`ancre : /artisan/${A[0].slug}  (electricien, Bordeaux)\n`);
  await mesure("meme commune + meme metier", A.slice(1));
  await mesure("meme commune + AUTRE metier (plombier)", B);
  await mesure("AUTRE commune, meme dept + meme metier", D);
  await mesure("AUTRE departement + meme metier (Lille)", E);
})();
