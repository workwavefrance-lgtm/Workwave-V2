import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  let all: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  const art = all.filter(r => r.keys![0].includes("/artisan/"));
  const totI = art.reduce((s,r)=>s+(r.impressions||0),0);
  const totC = art.reduce((s,r)=>s+(r.clicks||0),0);
  const posw = art.reduce((s,r)=>s+(r.position||0)*(r.impressions||0),0)/Math.max(totI,1);
  console.log(`GSC /artisan/ ${S}..${E} : pages=${art.length} impr=${totI} clics=${totC} pos=${posw.toFixed(2)}`);
  const avecClic = art.filter(r=>(r.clicks||0)>0);
  console.log(`  pages avec >=1 clic : ${avecClic.length}`);

  const slugs = art.map(r => decodeURIComponent(r.keys![0].split("/artisan/")[1] || "").replace(/\/$/,"").split("?")[0]).filter(Boolean);
  const bySlug = new Map<string, any>();
  const PAGE = 300;
  for (let i=0;i<slugs.length;i+=PAGE) {
    const chunk = slugs.slice(i,i+PAGE);
    const { data, error } = await sb.from("pros").select("slug,phone,email,website,etat_admin,rge_certified,description,photos,google_rating,founded_year").in("slug", chunk);
    if (error) { console.log("ERR", error.message); break; }
    for (const r of (data??[])) bySlug.set(r.slug, r);
  }
  console.log(`  slugs resolus en base : ${bySlug.size}/${slugs.length}`);

  let nI=0,nC=0, sansI=0, sansC=0, pagesSans=0, pagesRes=0;
  let fermeI=0, fermeC=0;
  let rgeC=0, descC=0, photoC=0, gratC=0;
  for (const r of art) {
    const slug = decodeURIComponent(r.keys![0].split("/artisan/")[1] || "").replace(/\/$/,"").split("?")[0];
    const p = bySlug.get(slug); if (!p) continue;
    pagesRes++;
    const i = r.impressions||0, c = r.clicks||0;
    nI+=i; nC+=c;
    const sans = !p.phone && !p.email && !p.website;
    if (sans) { sansI+=i; sansC+=c; pagesSans++; }
    if (p.etat_admin === "F") { fermeI+=i; fermeC+=c; }
    if (p.rge_certified) rgeC+=c;
    if (p.description) descC+=c;
    if (Array.isArray(p.photos) && p.photos.length>0) photoC+=c;
    if (p.google_rating!=null) gratC+=c;
  }
  const pc=(a:number,b:number)=>`${a}/${b} = ${(100*a/Math.max(b,1)).toFixed(2)}%`;
  console.log(`\n--- SUR LES PAGES QUI RANKENT REELLEMENT (resolues: ${pagesRes}) ---`);
  console.log(`pages sans aucun contact        : ${pc(pagesSans,pagesRes)}`);
  console.log(`IMPRESSIONS sur pages sans contact : ${pc(sansI,nI)}`);
  console.log(`CLICS sur pages sans contact       : ${pc(sansC,nC)}`);
  console.log(`CLICS sur fiches FERMEES (etat_admin=F) : ${pc(fermeC,nC)}`);
  console.log(`IMPRESSIONS sur fiches FERMEES          : ${pc(fermeI,nI)}`);
  console.log(`\nclics vers fiches deja enrichies : rge=${pc(rgeC,nC)} description=${pc(descC,nC)} photos=${pc(photoC,nC)} note_google=${pc(gratC,nC)}`);
}
main().catch(e=>console.error(e));
