import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const SITE = "https://workwave.fr/";

async function main() {
  const sb = getServiceClient();
  // 1. couples (category_id, city_id) ayant >=1 pro OUVERT note
  const PAGE = 1000; let offset = 0; const rated: any[] = [];
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("category_id,city_id,is_active,deleted_at,etat_admin,google_reviews_count")
      .not("google_rating","is",null).order("id").range(offset, offset+PAGE-1)
      .abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERR", error.message); break; }
    const rows = data || []; if (!rows.length) break;
    for (const r of rows) if (r.is_active && !r.deleted_at && r.etat_admin!=="F" && (r.google_reviews_count??0)>0) rated.push(r);
    offset += rows.length;
  }
  const catIds=[...new Set(rated.map(r=>r.category_id))], cityIds=[...new Set(rated.map(r=>r.city_id))];
  const { data: cats } = await sb.from("categories").select("id,slug").in("id",catIds);
  const cmap = new Map(cats!.map((c:any)=>[c.id,c.slug]));
  const citymap = new Map<number,string>();
  for (let i=0;i<cityIds.length;i+=500) {
    const { data: cs } = await sb.from("cities").select("id,slug").in("id", cityIds.slice(i,i+500));
    for (const c of cs as any[]) citymap.set(c.id, c.slug);
  }
  const treated = new Set<string>();
  const treatedCities = new Set<string>();
  for (const r of rated) {
    const cs = cmap.get(r.category_id), vs = citymap.get(r.city_id);
    if (cs && vs) { treated.add(`/${cs}/${vs}`); treatedCities.add(vs); }
  }
  console.log("couples metier/ville avec >=1 pro note (page emet des etoiles) :", treated.size);

  // 2. GSC pages
  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth });
  let all: any[] = [];
  for (let start=0; start<150000; start+=25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody:{ startDate:"2026-08-05", endDate:"2026-09-01", dimensions:["page"], rowLimit:25000, startRow:start }});
    const rows = r.data.rows||[]; all.push(...rows); if (rows.length<25000) break;
  }
  const bucket = (n:string)=>({n, i:0,c:0,pages:0,posw:0});
  const T = bucket("AVEC etoiles"), U = bucket("SANS etoiles");
  const TV = bucket("SANS etoiles, mais ville traitee");
  for (const r of all) {
    const p = String(r.keys![0]).replace("https://workwave.fr","");
    const seg = p.split("/").filter(Boolean);
    if (seg.length!==2) continue;
    if (/-\d{2,3}$/.test(seg[1])) continue;            // page departement
    const PREF = ["artisan","guide-des-prix","blog","trouver-des-chantiers","trouver-des-clients","ai","en","pro","barometre"];
    if (PREF.includes(seg[0]) || seg[0].startsWith("barometre")) continue;
    const b = treated.has(p) ? T : (treatedCities.has(seg[1]) ? TV : U);
    b.i += r.impressions||0; b.c += r.clicks||0; b.pages++; b.posw += (r.position||0)*(r.impressions||0);
  }
  // comparaison a position comparable : bandes de position
  const bands = [[0,15],[15,25],[25,35],[35,60],[60,999]];
  const tb = bands.map(()=>({i:0,c:0,n:0})), ub = bands.map(()=>({i:0,c:0,n:0}));
  for (const r of all) {
    const p2 = String(r.keys![0]).replace("https://workwave.fr","");
    const sg = p2.split("/").filter(Boolean);
    if (sg.length!==2 || /-\d{2,3}$/.test(sg[1])) continue;
    const PRF = ["artisan","guide-des-prix","blog","trouver-des-chantiers","trouver-des-clients","ai","en","pro"];
    if (PRF.includes(sg[0]) || sg[0].startsWith("barometre")) continue;
    const pos = r.position||0;
    const bi = bands.findIndex(([a,b2])=>pos>=a && pos<b2); if (bi<0) continue;
    const dst = treated.has(p2) ? tb[bi] : ub[bi];
    dst.i += r.impressions||0; dst.c += r.clicks||0; dst.n++;
  }
  console.log("\nCTR a position comparable (bande de position moyenne) :");
  console.log("  bande        AVEC etoiles                  SANS etoiles");
  bands.forEach(([a,b2],k)=>{
    const t=tb[k],u=ub[k];
    const f=(x:any)=> x.i? `${((100*x.c)/x.i).toFixed(2)}% (${x.c}c/${x.i}i, ${x.n}p)` : "aucune donnee";
    console.log(`  ${String(a)+"-"+String(b2)}`.padEnd(14) + f(t).padEnd(30) + f(u));
  });

  console.log("\n/[metier]/[ville] 05/08 -> 01/09");
  for (const b of [T,TV,U])
    console.log(`  ${b.n.padEnd(32)} pages=${String(b.pages).padStart(6)} impr=${String(b.i).padStart(7)} clics=${String(b.c).padStart(5)} CTR=${((100*b.c)/Math.max(b.i,1)).toFixed(2)}%  pos=${(b.posw/Math.max(b.i,1)).toFixed(1)}`);
}
main().catch(e=>console.error(e.message));
