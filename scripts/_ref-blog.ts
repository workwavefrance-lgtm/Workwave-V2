import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
(async()=>{
  const sb=getServiceClient();
  const { count } = await sb.from("blog_posts").select("*",{count:"exact",head:true});
  const { count: pub } = await sb.from("blog_posts").select("*",{count:"exact",head:true}).eq("status","published");
  console.log(`blog_posts total=${count} published=${pub}`);
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  for(const [S,E,l] of [["2026-08-01","2026-08-31","aout"],["2026-07-01","2026-07-31","juillet"]] as any){
    const r=(await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{startDate:S,endDate:E,dimensions:["page"],rowLimit:25000,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:"/blog/"}]}]}})).data.rows||[];
    console.log(`  ${l} /blog/ : ${r.length} pages | ${r.reduce((a,b)=>a+(b.impressions||0),0)} imp | ${r.reduce((a,b)=>a+(b.clicks||0),0)} clics`);
    for(const x of r) console.log(`      ${x.impressions} imp | ${x.clicks} cl | ${x.keys![0].replace("https://workwave.fr","")}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
