/** REFUTATION 8 : l'action reelle n'est pas une reecriture parfaite. Avec N
 *  tournures par phrase indexees sur id % N, deux voisines tirent la MEME
 *  tournure une fois sur N. Simulation sur les textes reels. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const BASE="https://workwave.fr", UA={"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"};
function texte(h:string){return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&#x27;/g,"'").replace(/&[a-z]+;|&#\d+;/gi," ")
  .replace(/[  ]/g," ").replace(/\s+/g," ").trim().toLowerCase();}
function gram(t:string,n=6){const m=t.split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);let c=0;for(const g of ga)if(gb.has(g))c++;
  return (c/Math.min(ga.size,gb.size))*100;}
function norm(t:string,j:string[]){let s=t;
  for(const x of j){const v=(x||"").trim().toLowerCase();if(v.length>=3)s=s.split(v).join(" xvar ");}
  return s.replace(/\b\d[\d ]*\b/g," xnum ").replace(/\s+/g," ");}
function decoupe(t:string){const i=t.indexOf("à propos de ");if(i<0)return null;
  const k=t.indexOf("informations société issues",i);if(k<0)return null;
  const f=t.indexOf(".",k);return [t.slice(0,i),t.slice(i,f<0?t.length:f+1),t.slice(f<0?t.length:f+1)] as [string,string,string];}
async function page(s:string){const r=await fetch(`${BASE}/artisan/${s}`,{headers:UA,redirect:"manual"});
  return r.status===200?texte(await r.text()):null;}
(async () => {
  const cas=[["electricien","bordeaux"],["couvreur","nantes"],["peintre","lille"],["plombier","poitiers"]];
  const Ns=[2,4,8,12];
  console.log("paire                     actuel   " + Ns.map(n=>`N=${n}`.padStart(8)).join("") + "   parfait");
  const tot: number[] = new Array(Ns.length+2).fill(0); let np=0;
  for(const [m,v] of cas){
    const r=await fetch(`${BASE}/${m}/${v}`,{headers:UA}); if(r.status!==200) continue;
    const slugs=[...new Set(((await r.text()).match(/href="\/artisan\/([a-z0-9-]+)"/g)||[]).map(s=>s.split('"')[1].replace("/artisan/","")))].slice(0,2);
    const {data}=await sb.from("pros").select("slug,name,address,siret").in("slug",slugs);
    const P=(data||[]) as any[]; if(P.length<2) continue;
    const A=await page(P[0].slug), B=await page(P[1].slug); if(!A||!B) continue;
    const dA=decoupe(A), dB=decoupe(B); if(!dA||!dB) continue;
    const jA=[P[0].name,P[0].address,P[0].siret], jB=[P[1].name,P[1].address,P[1].siret];
    const actuel=rec(norm(A,jA),norm(B,jB));
    // phrases du bloc
    const phA=dA[1].split(/(?<=\.)\s+/).filter(Boolean), phB=dB[1].split(/(?<=\.)\s+/).filter(Boolean);
    const res:number[]=[];
    for(const N of Ns){
      // moyenne sur 200 tirages : chaque phrase est identique avec proba 1/N
      let s=0; const T=200;
      for(let t=0;t<T;t++){
        const bA=phA.map((p,i)=>Math.random()<1/N?p:p.split(" ").map((_,k)=>`va${i}x${k}`).join(" ")).join(" ");
        const bB=phB.map((p,i)=>{
          // meme tirage cote B : si la phrase est "identique", B garde le texte d'origine
          return p; });
        // reconstruction : cote A on remplace les phrases qui different
        const pA=norm(dA[0]+" "+bA+" "+dA[2],jA), pB=norm(dB[0]+" "+bB+" "+dB[2],jB);
        s+=rec(pA,pB);
      }
      res.push(s/T);
    }
    const jetA=dA[1].split(" ").map((_,i)=>`ua${i}`).join(" "), jetB=dB[1].split(" ").map((_,i)=>`ub${i}`).join(" ");
    const parfait=rec(norm(dA[0]+" "+jetA+" "+dA[2],jA), norm(dB[0]+" "+jetB+" "+dB[2],jB));
    console.log(`${(m+"/"+v).padEnd(24)} ${actuel.toFixed(1).padStart(6)} % ` + res.map(x=>`${x.toFixed(1).padStart(7)}%`).join("") + `  ${parfait.toFixed(1).padStart(6)} %`);
    tot[0]+=actuel; res.forEach((x,i)=>tot[i+1]+=x); tot[tot.length-1]+=parfait; np++;
  }
  if(np) console.log(`\nmoyenne                  ${(tot[0]/np).toFixed(1).padStart(6)} % ` + Ns.map((_,i)=>`${(tot[i+1]/np).toFixed(1).padStart(7)}%`).join("") + `  ${(tot[tot.length-1]/np).toFixed(1).padStart(6)} %   (objectif audit < 60 %)`);
})();
