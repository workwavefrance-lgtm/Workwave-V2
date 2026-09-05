/** REFUTATION : la famille "listing metier x DEPARTEMENT" de _dup-11 est
 *  identifiee par la regex -\d{2,3}$ sur le 2e segment. Or des COMMUNES
 *  homonymes portent un suffixe de departement dans leur slug. Combien ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { generateDepartmentSlug } from "../lib/utils/slugs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data: deps } = await sb.from("departments").select("*");
  const vrais = new Set((deps||[]).map((d:any)=>generateDepartmentSlug(d)));
  console.log(`departements en base : ${deps?.length} · slugs canoniques : ${vrais.size}`);
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  console.log(`categories BTP/domicile/personne : ${cats?.length}`);
  console.log(`=> couples metier x departement possibles : ${(cats?.length||0)*vrais.size}`);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10), debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  let start=0; const D={p:0,imp:0,c:0}, C={p:0,imp:0,c:0};
  const exD:string[]=[], exC:string[]=[];
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl:"https://workwave.fr/", requestBody:{
      startDate:debut, endDate:fin, dimensions:["page"], rowLimit:25000, startRow:start } });
    const rows = data.rows||[]; if(!rows.length)break;
    for (const r of rows) { const p=r.keys![0].replace("https://workwave.fr","").split("?")[0];
      const s=p.split("/").filter(Boolean);
      if (s.length!==2 || !/-\d{2,3}$/.test(s[1]) || p.startsWith("/ai/")) continue;
      const t = vrais.has(s[1]) ? D : C;
      t.p++; t.imp+=r.impressions||0; t.c+=r.clicks||0;
      if (vrais.has(s[1])) { if(exD.length<3) exD.push(p); } else if (exC.length<6) exC.push(p);
    }
    start+=rows.length; if(rows.length<25000)break;
  }
  console.log(`\nparmi les pages classees "listing x DEPARTEMENT" par _dup-11 :`);
  console.log(`  VRAIS departements : ${D.p} pages · ${D.imp} impressions · ${D.c} clics/28j`);
  console.log(`  en fait des COMMUNES : ${C.p} pages · ${C.imp} impressions · ${C.c} clics/28j`);
  console.log(`  part de communes dans la famille : ${(C.p/(C.p+D.p)*100).toFixed(1)} % des pages, ${(C.c/Math.max(C.c+D.c,1)*100).toFixed(1)} % des clics`);
  console.log(`\n  exemples classes departement a tort : ${exC.join(", ")}`);
  console.log(`  vrais departements : ${exD.join(", ")}`);
  console.log(`\nrendement reel des VRAIS listings departement : ${(D.c/Math.max(D.p,1)/28).toFixed(4)} clics/page/jour`);
})();
