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
function mots(t:string){return t.split(" ").filter(Boolean).length;}
const cache = new Map<string,string|null>();
async function get(u:string){ if(cache.has(u)) return cache.get(u)!;
  try{const r=await fetch(`${BASE}${u}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"},redirect:"manual"});
  if(r.status!==200){cache.set(u,null);return null;} const t=texte(await r.text()); cache.set(u,t); return t;}catch{cache.set(u,null);return null;}}

(async () => {
  // Groupes metier x commune contenant AU MOINS 2 ouvertes ET 2 fermees -> comparaison APPARIEE
  const g = new Map<string, any[]>();
  for (const dep of [200_000, 600_000, 900_000, 1_300_000, 1_800_000, 2_200_000, 2_600_000]) {
    const { data } = await sb.from("pros").select("id,slug,city_id,category_id,etat_admin")
      .eq("is_active", true).is("deleted_at", null).gt("id", dep).order("id").limit(1000);
    for (const p of (data || []) as any[]) { const k = `${p.city_id}|${p.category_id}`;
      if (!g.has(k)) g.set(k, []); g.get(k)!.push(p); }
  }
  const apparies: any[] = [];
  for (const [k, arr] of g.entries()) {
    const o = arr.filter(p => p.etat_admin !== "F"), f = arr.filter(p => p.etat_admin === "F");
    if (o.length >= 2 && f.length >= 2) apparies.push({ k, o, f });
  }
  console.log(`groupes : ${g.size} · groupes APPARIES (>=2 ouvertes ET >=2 fermees) : ${apparies.length}`);

  const N = Math.min(12, apparies.length);
  const oo: number[] = [], ff: number[] = [];
  const lo: number[] = [], lf: number[] = [];
  for (let i = 0; i < N; i++) {
    const grp = apparies[i];
    const a = await get(`/artisan/${grp.o[0].slug}`), b = await get(`/artisan/${grp.o[1].slug}`);
    const c = await get(`/artisan/${grp.f[0].slug}`), d = await get(`/artisan/${grp.f[1].slug}`);
    if (a && b) { const r = rec(a,b); if (r!==null) oo.push(r); lo.push(mots(a), mots(b)); }
    if (c && d) { const r = rec(c,d); if (r!==null) ff.push(r); lf.push(mots(c), mots(d)); }
  }
  const moy = (x:number[]) => x.length ? (x.reduce((a,b)=>a+b,0)/x.length) : NaN;
  console.log(`\nAPPARIE (memes groupes metier x commune), ${N} groupes :`);
  console.log(`  OUVERTE vs OUVERTE : ${oo.length} paires, moyenne ${moy(oo).toFixed(1)} %  [${oo.map(x=>x.toFixed(0)).join(", ")}]`);
  console.log(`  FERMEE  vs FERMEE  : ${ff.length} paires, moyenne ${moy(ff).toFixed(1)} %  [${ff.map(x=>x.toFixed(0)).join(", ")}]`);
  console.log(`  longueur moyenne page ouverte : ${moy(lo).toFixed(0)} mots · fermee : ${moy(lf).toFixed(0)} mots`);

  // TEMOIN : paires ETRANGERES (metier different ET commune differente) = plancher gabarit
  const tf: number[] = [], to: number[] = [];
  for (let i = 0; i + 1 < N; i++) {
    const A = apparies[i], B = apparies[i+1];
    if (A.o[0].city_id === B.o[0].city_id || A.o[0].category_id === B.o[0].category_id) continue;
    const a = await get(`/artisan/${A.f[0].slug}`), b = await get(`/artisan/${B.f[1].slug}`);
    if (a && b) { const r = rec(a,b); if (r!==null) tf.push(r); }
    const c = await get(`/artisan/${A.o[0].slug}`), d = await get(`/artisan/${B.o[1].slug}`);
    if (c && d) { const r = rec(c,d); if (r!==null) to.push(r); }
  }
  console.log(`\nTEMOIN etranger (metier ET commune differents) = plancher gabarit :`);
  console.log(`  FERMEE  vs FERMEE  etrangeres : ${tf.length} paires, moyenne ${moy(tf).toFixed(1)} %  [${tf.map(x=>x.toFixed(0)).join(", ")}]`);
  console.log(`  OUVERTE vs OUVERTE etrangeres : ${to.length} paires, moyenne ${moy(to).toFixed(1)} %  [${to.map(x=>x.toFixed(0)).join(", ")}]`);
  console.log(`\nPART IMPUTABLE au couple metier x ville (voisines - etrangeres) :`);
  console.log(`  fermees : ${(moy(ff)-moy(tf)).toFixed(1)} points · ouvertes : ${(moy(oo)-moy(to)).toFixed(1)} points`);
})();
