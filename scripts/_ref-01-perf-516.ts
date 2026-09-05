/** REFUTATION 1 : que produisent REELLEMENT, dans Google, les 516 listings
 *  metier x commune qui ont deja un contenu redactionnel ? Si ces pages, les
 *  "meilleures du site", rapportent peu de clics, l'extrapolation a 8 434
 *  pages supplementaires est plafonnee par ce que ces pages demontrent. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const SITE = "https://workwave.fr/";
(async () => {
  // 1. les 516 couples avec contenu -> chemins
  const cats = new Map<number,string>(); const villes = new Map<number,string>();
  {
    const { data } = await sb.from("categories").select("id,slug");
    for (const c of (data||[]) as any[]) cats.set(c.id, c.slug);
  }
  let off = 0; const couples: {cat:number;city:number}[] = [];
  while (true) {
    const { data } = await sb.from("seo_pages").select("category_id,city_id")
      .eq("type","metier_ville").not("content","is",null).not("city_id","is",null).range(off, off+999);
    const r = (data||[]) as any[]; if (!r.length) break;
    for (const s of r) couples.push({cat:s.category_id, city:s.city_id});
    off += r.length;
  }
  const ids = [...new Set(couples.map(c=>c.city))];
  for (let i=0;i<ids.length;i+=500) {
    const { data } = await sb.from("cities").select("id,slug").in("id", ids.slice(i,i+500));
    for (const c of (data||[]) as any[]) villes.set(c.id, c.slug);
  }
  const chemins = new Set<string>();
  for (const c of couples) { const a=cats.get(c.cat), b=villes.get(c.city); if(a&&b) chemins.add(`/${a}/${b}`); }
  console.log(`couples avec contenu : ${couples.length}  ->  chemins resolus : ${chemins.size}`);

  // 2. GSC 28 jours, par page
  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth:(await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10);
  const debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const perf = new Map<string,{imp:number;clics:number;pos:number}>();
  let start = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl:SITE, requestBody:{
      startDate:debut, endDate:fin, dimensions:["page"], rowLimit:25000, startRow:start }});
    const rows = data.rows || []; if (!rows.length) break;
    for (const r of rows) perf.set(r.keys![0].replace("https://workwave.fr",""),
      { imp:r.impressions||0, clics:r.clicks||0, pos:r.position||0 });
    start += rows.length; if (rows.length < 25000) break;
  }
  console.log(`fenetre ${debut} -> ${fin} · pages avec >=1 impression sur tout le site : ${perf.size}`);
  let totImp=0, totClics=0; for (const p of perf.values()){ totImp+=p.imp; totClics+=p.clics; }
  console.log(`site entier : ${totImp} impressions, ${totClics} clics sur 28 j  (${(totClics/28).toFixed(1)} clics/j)`);

  let vues=0, imp=0, clics=0, posSom=0;
  const top: [string,number,number][] = [];
  for (const c of chemins) { const p = perf.get(c);
    if (p) { vues++; imp+=p.imp; clics+=p.clics; posSom+=p.pos*p.imp; top.push([c,p.imp,p.clics]); } }
  console.log(`\nLES 516 PAGES AVEC CONTENU REDACTIONNEL (les "meilleures du site") :`);
  console.log(`  vues par Google : ${vues}/${chemins.size} (${(vues/chemins.size*100).toFixed(1)} %)`);
  console.log(`  impressions 28 j : ${imp}   clics 28 j : ${clics}   -> ${(clics/28).toFixed(2)} clics/JOUR pour les 516`);
  console.log(`  clics par page et par jour : ${(clics/28/chemins.size).toFixed(5)}`);
  console.log(`  position moyenne ponderee : ${(posSom/Math.max(imp,1)).toFixed(1)}`);
  top.sort((a,b)=>b[2]-a[2]);
  console.log(`  top 10 par clics :`); for (const t of top.slice(0,10)) console.log(`     ${t[0].padEnd(46)} ${String(t[1]).padStart(6)} imp  ${t[2]} clics`);
})();
