/** MESURE 19 : combien de gabarits distincts le site sert-il reellement ?
 *  On neutralise nom / adresse / SIRET / metier / commune / nombres, puis on
 *  compare des fiches SANS AUCUN RAPPORT (metier different, departement
 *  different). Si le recouvrement reste tres haut, tout le parc est UN gabarit. */
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
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);let c=0;for(const g of ga)if(gb.has(g))c++;
  return (c/Math.min(ga.size,gb.size))*100;}
function norm(t:string,j:string[]){let s=t;
  for(const x of j){const v=(x||"").trim().toLowerCase();if(v.length>=3)s=s.split(v).join(" xvar ");}
  return s.replace(/\b\d[\d ]*\b/g," xnum ").replace(/\s+/g," ");}
async function get(slug:string){const r=await fetch(`${BASE}/artisan/${slug}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"},redirect:"manual"});
  return r.status===200?texte(await r.text()):null;}
(async () => {
  // 6 fiches ouvertes de metiers et departements differents.
  const cibles = [["electricien","bordeaux"],["couvreur","nantes"],["peintre","lille"],
                  ["macon","marseille"],["menage","strasbourg"],["garde-animaux","toulouse"]];
  const fiches: { slug:string; nom:string; adr:string; siret:string; met:string; ville:string; t:string }[] = [];
  for (const [m,v] of cibles) {
    const r = await fetch(`${BASE}/${m}/${v}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"}});
    if (r.status!==200) continue;
    const slugs=[...new Set(((await r.text()).match(/href="\/artisan\/([a-z0-9-]+)"/g)||[]).map(s=>s.split('"')[1].replace("/artisan/","")))];
    if(!slugs.length) continue;
    const { data } = await sb.from("pros").select("slug,name,address,siret,category:categories(name),city:cities(name)").eq("slug",slugs[0]).limit(1);
    const p:any=(data||[])[0]; if(!p) continue;
    const t = await get(p.slug); if(!t) continue;
    fiches.push({ slug:p.slug, nom:p.name, adr:p.address||"", siret:p.siret||"", met:p.category?.name||m, ville:p.city?.name||v, t });
  }
  console.log(`fiches chargees : ${fiches.length}\n`);
  const N = fiches.map(f => norm(f.t, [f.nom, f.adr, f.siret, f.met, f.met.toLowerCase()+"s", f.ville]));
  let som=0, n=0, mini=100, maxi=0;
  console.log("paire de fiches SANS AUCUN RAPPORT (metier different, departement different)");
  for (let i=0;i<fiches.length;i++) for (let j=i+1;j<fiches.length;j++) {
    const brut = rec(fiches[i].t, fiches[j].t), nr = rec(N[i], N[j]);
    som+=nr; n++; mini=Math.min(mini,nr); maxi=Math.max(maxi,nr);
    console.log(`  ${(fiches[i].met+"/"+fiches[i].ville).padEnd(26)} vs ${(fiches[j].met+"/"+fiches[j].ville).padEnd(26)} brut ${brut.toFixed(1).padStart(5)} %   normalise ${nr.toFixed(1).padStart(5)} %`);
  }
  console.log(`\n${n} paires · recouvrement normalise moyen ${(som/n).toFixed(1)} % (min ${mini.toFixed(1)} · max ${maxi.toFixed(1)})`);
})();
