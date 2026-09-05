import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S="2026-08-05", E="2026-09-01";
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000 } });
  const rows = r.data.rows || [];
  // classement par famille d'URL
  const fam: Record<string, {n:number; imp:number; cl:number}> = {};
  const add = (k:string, imp:number, cl:number) => { (fam[k] ||= {n:0,imp:0,cl:0}); fam[k].n++; fam[k].imp+=imp; fam[k].cl+=cl; };
  for (const x of rows) {
    const u = (x.keys||[])[0] || ""; const p = u.replace("https://workwave.fr",""); 
    const imp = x.impressions||0, cl = x.clicks||0;
    const seg = p.split("/").filter(Boolean);
    if (p === "/" ) add("accueil", imp, cl);
    else if (seg[0]==="artisan") add("/artisan/[slug]", imp, cl);
    else if (seg[0]==="trouver-des-chantiers") add("/trouver-des-chantiers/*  (ACQUISITION PRO)", imp, cl);
    else if (seg[0]==="trouver-des-clients") add("/trouver-des-clients/*  (ACQUISITION PRO)", imp, cl);
    else if (seg[0]==="guide-des-prix") add("/guide-des-prix/*", imp, cl);
    else if (seg[0]==="blog") add("/blog/*", imp, cl);
    else if (seg.length===2 && /-\d{2,3}$|-(2a|2b|bru|wbr|wht|wlg|wlx|wna)$/i.test(seg[1])) add("/[metier]/[DEPT]  (croisement particulier)", imp, cl);
    else if (seg.length===2) add("/[metier]/[VILLE]  (croisement particulier)", imp, cl);
    else if (seg.length===1) add("/[metier] (racine)", imp, cl);
    else add("autres", imp, cl);
  }
  const t = Object.entries(fam).sort((a,b)=>b[1].imp-a[1].imp);
  console.log("=== 28 jours (05/08 -> 01/09), impressions par famille de page ===");
  for (const [k,v] of t)
    console.log(`  ${String(v.imp).padStart(7)} imp | ${String(v.cl).padStart(5)} clics | ${String(v.n).padStart(5)} pages | ${k}`);
}
main();
