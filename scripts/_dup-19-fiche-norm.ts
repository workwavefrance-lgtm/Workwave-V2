/** MESURE 17 : la prose des fiches est-elle du texte propre, ou le MEME
 *  gabarit avec le nom, l'adresse, le SIRET et la date substitues ?
 *  On neutralise ces variables et on remesure le recouvrement en 6-grammes. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const BASE = "https://workwave.fr";
function texte(h:string){return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&#x27;/g,"'").replace(/&[a-z]+;|&#\d+;/gi," ")
  .replace(/[  ]/g," ").replace(/\s+/g," ").trim().toLowerCase();}
function gram(t:string,n=6){const m=t.split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);if(ga.size<50||gb.size<50)return null;
  let c=0;for(const g of ga)if(gb.has(g))c++;return (c/Math.min(ga.size,gb.size))*100;}
function norm(t:string, jetons:string[]) {
  let s = t;
  for (const j of jetons) { const v = (j||"").trim().toLowerCase(); if (v.length >= 3) s = s.split(v).join(" xvar "); }
  return s.replace(/\b\d[\d ]*\b/g," xnum ").replace(/\s+/g," ");
}
async function get(u:string){const r=await fetch(`${BASE}/artisan/${u}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"},redirect:"manual"});
  return r.status===200?texte(await r.text()):null;}
(async () => {
  const cas = [["electricien","bordeaux"],["couvreur","nantes"],["peintre","lille"],["plombier","poitiers"]];
  console.log("groupe de voisins                 brut     normalise (nom, adresse, SIRET et nombres neutralises)");
  for (const [m,v] of cas) {
    const r = await fetch(`${BASE}/${m}/${v}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" } });
    if (r.status !== 200) { console.log(`/${m}/${v} HTTP ${r.status}`); continue; }
    const slugs = [...new Set(((await r.text()).match(/href="\/artisan\/([a-z0-9-]+)"/g)||[]).map(s=>s.split('"')[1].replace("/artisan/","")))];
    if (slugs.length < 2) { console.log(`  ${m}/${v} : ${slugs.length} slug(s)`); continue; }
    const { data } = await sb.from("pros").select("slug,name,address,siret").in("slug", slugs.slice(0,2));
    const P = (data||[]) as any[]; if (P.length < 2) { console.log(`  ${m}/${v} : slugs=${slugs.slice(0,2).join(",")} trouves en base=${P.length}`); continue; }
    const A = await get(P[0].slug), B = await get(P[1].slug);
    if (!A || !B) { console.log(`  ${m}/${v} : fiche non servie`); continue; }
    const brut = rec(A,B);
    const nrm = rec(norm(A,[P[0].name,P[0].address,P[0].siret]), norm(B,[P[1].name,P[1].address,P[1].siret]));
    console.log(`${(m+" / "+v).padEnd(32)} ${brut!.toFixed(1).padStart(6)} % ${nrm!.toFixed(1).padStart(12)} %`);
  }
})();
