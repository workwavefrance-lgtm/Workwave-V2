/** REFUTATION 1 : quelle part de la page la prose de buildProContent
 *  represente-t-elle, et jusqu'ou l'action proposee peut-elle FAIRE BAISSER
 *  le recouvrement normalise ? On simule le MEILLEUR cas : le bloc
 *  "A propos + FAQ + sources" rendu 100 % unique entre deux voisines. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const BASE = "https://workwave.fr";
const UA = { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" };
function texte(h:string){return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&#x27;/g,"'").replace(/&[a-z]+;|&#\d+;/gi," ")
  .replace(/[  ]/g," ").replace(/\s+/g," ").trim().toLowerCase();}
function gram(t:string,n=6){const m=t.split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);let c=0;for(const g of ga)if(gb.has(g))c++;
  return (c/Math.min(ga.size,gb.size))*100;}
function norm(t:string,j:string[]){let s=t;
  for(const x of j){const v=(x||"").trim().toLowerCase();if(v.length>=3)s=s.split(v).join(" xvar ");}
  return s.replace(/\b\d[\d ]*\b/g," xnum ").replace(/\s+/g," ");}
/** Decoupe le texte de page en [avant, bloc SEO, apres]. */
function decoupe(t:string): [string,string,string] | null {
  const i = t.indexOf("à propos de ");
  if (i < 0) return null;
  const k = t.indexOf("informations société issues", i);
  if (k < 0) return null;
  const fin = t.indexOf(".", k);
  const j = fin < 0 ? t.length : fin + 1;
  return [t.slice(0,i), t.slice(i,j), t.slice(j)];
}
async function page(slug:string){const r=await fetch(`${BASE}/artisan/${slug}`,{headers:UA,redirect:"manual"});
  return r.status===200?texte(await r.text()):null;}
(async () => {
  const cas = [["electricien","bordeaux"],["couvreur","nantes"],["peintre","lille"],["plombier","poitiers"]];
  console.log("paire                     mots page  mots bloc  part bloc   normalise ACTUEL   plafond APRES action parfaite");
  let sA=0,sP=0,n=0;
  for (const [m,v] of cas) {
    const r = await fetch(`${BASE}/${m}/${v}`,{headers:UA});
    if (r.status!==200) { console.log(`/${m}/${v} HTTP ${r.status}`); continue; }
    const slugs=[...new Set(((await r.text()).match(/href="\/artisan\/([a-z0-9-]+)"/g)||[]).map(s=>s.split('"')[1].replace("/artisan/","")))].slice(0,2);
    const { data } = await sb.from("pros").select("slug,name,address,siret").in("slug", slugs);
    const P=(data||[]) as any[]; if(P.length<2) continue;
    const A = await page(P[0].slug), B = await page(P[1].slug); if(!A||!B) continue;
    const dA = decoupe(A), dB = decoupe(B);
    if(!dA||!dB){ console.log(`  ${m}/${v} : bloc SEO introuvable dans le HTML`); continue; }
    const nA = norm(A,[P[0].name,P[0].address,P[0].siret]), nB = norm(B,[P[1].name,P[1].address,P[1].siret]);
    const actuel = rec(nA,nB);
    // MEILLEUR CAS : le bloc devient 100 % unique -> jetons disjoints, meme longueur.
    const jetonsA = dA[1].split(" ").map((_,i)=>`ua${i}`).join(" ");
    const jetonsB = dB[1].split(" ").map((_,i)=>`ub${i}`).join(" ");
    const pA = norm(dA[0]+" "+jetonsA+" "+dA[2],[P[0].name,P[0].address,P[0].siret]);
    const pB = norm(dB[0]+" "+jetonsB+" "+dB[2],[P[1].name,P[1].address,P[1].siret]);
    const plafond = rec(pA,pB);
    const mp = A.split(" ").length, mb = dA[1].split(" ").length;
    console.log(`${(m+"/"+v).padEnd(24)} ${String(mp).padStart(9)} ${String(mb).padStart(10)} ${((mb/mp)*100).toFixed(1).padStart(8)} % ${actuel.toFixed(1).padStart(16)} % ${plafond.toFixed(1).padStart(24)} %`);
    sA+=actuel; sP+=plafond; n++;
  }
  if(n) console.log(`\nmoyenne : actuel ${(sA/n).toFixed(1)} %  ->  plancher atteignable par l'action ${(sP/n).toFixed(1)} %  (objectif annonce par l'audit : < 60 %)`);
})();
