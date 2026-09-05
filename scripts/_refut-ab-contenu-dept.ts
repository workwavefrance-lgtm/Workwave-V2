/** REFUTATION de l'ACTION : "enrichir les listings dept des 445 contenus
 *  metier_dept qui existent deja". Test naturel : les pages qui ONT deja ce
 *  contenu sont-elles plus visibles / mieux classees que celles qui ne l'ont pas ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { generateDepartmentSlug } from "../lib/utils/slugs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data: deps } = await sb.from("departments").select("*");
  const depSlug = new Map((deps||[]).map((d:any)=>[d.id, generateDepartmentSlug(d)]));
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const catSlug = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  // les URL qui ONT un contenu redactionnel
  const avec = new Set<string>();
  const { data: sp } = await sb.from("seo_pages").select("category_id,department_id,content").eq("type","metier_dept");
  for (const r of (sp||[]) as any[]) { const a=catSlug.get(r.category_id), b=depSlug.get(r.department_id);
    if (a&&b&&r.content) avec.add(`/${a}/${b}`); }
  console.log(`pages dept AVEC contenu redactionnel : ${avec.size}`);
  const toutes: string[] = [];
  for (const c of catSlug.values()) for (const d of depSlug.values()) toutes.push(`/${c}/${d}`);
  console.log(`pages dept possibles au total       : ${toutes.length} (sans contenu : ${toutes.length-avec.size})`);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10), debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const perf = new Map<string,{imp:number;clics:number;pos:number}>(); let start=0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl:"https://workwave.fr/", requestBody:{
      startDate:debut, endDate:fin, dimensions:["page"], rowLimit:25000, startRow:start } });
    const rows = data.rows||[]; if(!rows.length)break;
    for (const r of rows) perf.set(r.keys![0].replace("https://workwave.fr","").split("?")[0],
      {imp:r.impressions||0,clics:r.clicks||0,pos:r.position||0});
    start+=rows.length; if(rows.length<25000)break;
  }
  for (const [lab, liste] of [["AVEC contenu", toutes.filter(u=>avec.has(u))],
                              ["SANS contenu", toutes.filter(u=>!avec.has(u))]] as const) {
    let v=0,c=0,i=0,ps=0;
    for (const u of liste) { const p=perf.get(u); if(p){v++;c+=p.clics;i+=p.imp;ps+=p.pos*p.imp;} }
    console.log(`\n${lab} : ${liste.length} pages`);
    console.log(`  visibles ${v} (${(v/liste.length*100).toFixed(1)} %) · ${i} impressions · ${c} clics/28j · position moy ${(ps/Math.max(i,1)).toFixed(1)}`);
    console.log(`  rendement : ${(c/Math.max(liste.length,1)/28).toFixed(4)} clics/page/jour (sur TOUTES les pages du groupe)`);
  }
  // distribution des clics sur les vrais listings dept visibles
  const vis = toutes.map(u=>perf.get(u)).filter(Boolean) as {imp:number;clics:number;pos:number}[];
  const zero = vis.filter(d=>d.clics===0).length;
  console.log(`\nsur les ${vis.length} vrais listings dept visibles : ${zero} a ZERO clic (${(zero/vis.length*100).toFixed(1)} %)`);
  const imps = vis.map(d=>d.imp).sort((a,b)=>a-b);
  console.log(`impressions/page sur 28 j : mediane ${imps[Math.floor(imps.length/2)]}, moyenne ${(imps.reduce((s,x)=>s+x,0)/vis.length).toFixed(1)}`);
})();
