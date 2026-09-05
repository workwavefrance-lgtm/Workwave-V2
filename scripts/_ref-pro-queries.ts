import { google } from "googleapis";
const SITE="https://workwave.fr/";
(async()=>{const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
const sc=google.searchconsole({version:"v1",auth});
const pf={filters:[{dimension:"page",operator:"equals",expression:"https://workwave.fr/pro"}]};
const r=await sc.searchanalytics.query({siteUrl:SITE,requestBody:{startDate:"2026-08-03",endDate:"2026-09-02",dimensions:["query"],rowLimit:30,dimensionFilterGroups:[pf]}});
console.log("=== /pro requetes 03/08 -> 02/09 ===");
for(const x of (r.data.rows||[])) console.log(`  pos ${(x.position||0).toFixed(1).padStart(6)} | ${String(x.impressions).padStart(4)} imp | ${String(x.clicks).padStart(3)} clics | ${(x.keys||[])[0]}`);
})().catch(e=>{console.error("ERR",e.message);process.exit(1);});
