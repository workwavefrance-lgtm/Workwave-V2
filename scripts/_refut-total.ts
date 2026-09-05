import { google } from "googleapis";
(async()=>{
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  const r=await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{startDate:"2026-08-07",endDate:"2026-09-03"}});
  const row=r.data.rows?.[0];
  console.log("SITE ENTIER 28j:",row?.clicks,"clics,",row?.impressions,"impressions, CTR",((row?.ctr||0)*100).toFixed(2)+"%, pos",(row?.position||0).toFixed(1));
  console.log("clics/jour site:",((row?.clicks||0)/28).toFixed(1));
  console.log("part cat x ville: 1901 clics =",((1901/(row?.clicks||1))*100).toFixed(1)+"% du trafic total");
})();
