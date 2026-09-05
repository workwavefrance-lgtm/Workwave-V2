import { google } from "googleapis";
const SITE="https://workwave.fr/"; const S="2026-06-04", E="2026-09-02";
const SLUGS=["peintre","plombier","electricien","macon","couvreur","carreleur","menuisier"];
(async()=>{ const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
 const sc=google.searchconsole({version:"v1",auth});
 console.log("Impressions 91 j des 7 pages que l'action propose de renommer :");
 for(const s of SLUGS){ const u=`https://workwave.fr/trouver-des-chantiers/${s}`;
  const r=await sc.searchanalytics.query({siteUrl:SITE,requestBody:{startDate:S,endDate:E,dimensions:["page"],rowLimit:5,
   dimensionFilterGroups:[{filters:[{dimension:"page",operator:"equals",expression:u}]}]}});
  const x=(r.data.rows||[])[0];
  console.log(`  ${s.padEnd(12)} ${x?`${x.impressions} imp | ${x.clicks} clics | pos ${(x.position||0).toFixed(1)}`:"0 impression, 0 clic"}`);
 }})().catch(e=>console.error("ERR",e.message));
