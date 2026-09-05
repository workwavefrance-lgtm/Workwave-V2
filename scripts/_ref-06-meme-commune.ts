/** REFUTATION 6 : LE test propre. Les 516 pages ne couvrent que 20 communes.
 *  Dans CES MEMES 20 communes il existe des couples metier x commune SANS
 *  contenu. Meme ville, meme autorite, meme demande de recherche : c'est le
 *  seul A/B ou la seule variable qui change est le contenu redactionnel. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth:{persistSession:false, autoRefreshToken:false} });
(async () => {
  const acc: [string,number][] = JSON.parse(fs.readFileSync("/tmp/catville.json","utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug,vertical");
  const catSlug = new Map<number,string>();
  for (const c of (cats||[]) as any[]) if (["btp","domicile","personne"].includes(c.vertical)) catSlug.set(c.id,c.slug);
  const avec = new Set<string>(); let off=0;
  while (true) { const { data } = await sb.from("seo_pages").select("category_id,city_id")
      .eq("type","metier_ville").not("content","is",null).not("city_id","is",null).range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length) break; for(const s of r) avec.add(`${s.category_id}|${s.city_id}`); off+=r.length; }
  const communes = new Set<number>([...avec].map(k=>Number(k.split("|")[1])));
  const { data: ci } = await sb.from("cities").select("id,slug,name,population").in("id",[...communes]);
  const villeSlug = new Map<number,string>((ci||[]).map((c:any)=>[c.id,c.slug]));

  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth:(await auth.getClient()) as never });
  const fin=new Date(Date.now()-3*864e5).toISOString().slice(0,10);
  const debut=new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const perf=new Map<string,{imp:number;clics:number;pos:number}>(); let start=0;
  while (true) { const { data } = await sc.searchanalytics.query({ siteUrl:"https://workwave.fr/", requestBody:{
      startDate:debut,endDate:fin,dimensions:["page"],rowLimit:25000,startRow:start}});
    const rows=data.rows||[]; if(!rows.length) break;
    for(const r of rows) perf.set(r.keys![0].replace("https://workwave.fr",""),{imp:r.impressions||0,clics:r.clicks||0,pos:r.position||0});
    start+=rows.length; if(rows.length<25000) break; }

  const g: Record<string,{t:number;v:number;imp:number;clics:number;posSom:number}> = {
    AVEC:{t:0,v:0,imp:0,clics:0,posSom:0}, SANS:{t:0,v:0,imp:0,clics:0,posSom:0} };
  for (const [k,n] of acc) { const [c,v]=k.split("|").map(Number);
    if (!communes.has(v) || !catSlug.has(c)) continue;
    const key = avec.has(k)?"AVEC":"SANS";
    g[key].t++;
    const p = perf.get(`/${catSlug.get(c)}/${villeSlug.get(v)}`);
    if (p){ g[key].v++; g[key].imp+=p.imp; g[key].clics+=p.clics; g[key].posSom+=p.pos*p.imp; } }
  console.log("A/B A L'INTERIEUR DES 20 MEMES COMMUNES (meme ville, meme autorite, meme demande)");
  console.log("groupe   pages   vues par Google    part      impressions  clics  position");
  for (const [k,a] of Object.entries(g))
    console.log(`${k.padEnd(8)} ${String(a.t).padStart(5)} ${String(a.v).padStart(14)}   ${(a.v/Math.max(a.t,1)*100).toFixed(1).padStart(5)} % ${String(a.imp).padStart(12)} ${String(a.clics).padStart(6)}   ${(a.posSom/Math.max(a.imp,1)).toFixed(1).padStart(6)}`);

  // meme chose, restreint aux couples 3-9 pros
  console.log("\nrestreint aux couples 3-9 pros ouverts :");
  const h: Record<string,{t:number;v:number}> = { AVEC:{t:0,v:0}, SANS:{t:0,v:0} };
  for (const [k,n] of acc) { const [c,v]=k.split("|").map(Number);
    if (!communes.has(v) || !catSlug.has(c) || n<3 || n>9) continue;
    const key = avec.has(k)?"AVEC":"SANS"; h[key].t++;
    if (perf.get(`/${catSlug.get(c)}/${villeSlug.get(v)}`)) h[key].v++; }
  for (const [k,a] of Object.entries(h))
    console.log(`  ${k} : ${a.v}/${a.t} vues (${(a.v/Math.max(a.t,1)*100).toFixed(1)} %)`);
})();
