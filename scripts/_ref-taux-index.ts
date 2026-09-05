import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const D = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad";
(async () => {
  const sb = getServiceClient();
  // fiches crawlees 01-03/09 mais PAS 28-31/08 (crawl "neuf" dans la fenetre)
  const slugs = fs.readFileSync(path.join(D,"apres.txt"),"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
  const avant = new Set(fs.readFileSync(path.join(D,"avant.txt"),"utf8").split("\n").map(s=>s.trim()));
  const neufs = slugs.filter(s=>!avant.has(s));
  const A: string[] = [], F: string[] = [];
  for (let i=0;i<neufs.length;i+=200) {
    const { data } = await sb.from("pros").select("slug, etat_admin").in("slug", neufs.slice(i,i+200));
    for (const r of data||[]) (r.etat_admin==="F"?F:A).push(r.slug);
  }
  console.log(`crawl "neuf" 01-03/09 : ${neufs.length} fiches, dont ouvertes=${A.length} fermees=${F.length} (${(100*F.length/(A.length+F.length)).toFixed(1)} % fermees)`);
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const SITE = "https://workwave.fr/";
  const pick = (a:string[], n:number)=>{const o=[];for(let i=0;i<n;i++)o.push(a[Math.floor(i*a.length/n)]);return o;};
  for (const [lib, lot] of [["OUVERTES", pick(A,25)], ["FERMEES", pick(F,25)]] as [string,string[]][]) {
    const c: Record<string,number> = {};
    for (const s of lot) {
      try {
        const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: `https://workwave.fr/artisan/${s}`, siteUrl: SITE } });
        const r:any = data.inspectionResult?.indexStatusResult || {};
        const cs = r.coverageState || "?"; c[cs] = (c[cs]||0)+1;
      } catch { c["ECHEC"] = (c["ECHEC"]||0)+1; }
    }
    const idx = c["Submitted and indexed"] || 0;
    console.log(`\n${lib} (n=${lot.length}) : ${JSON.stringify(c)}`);
    console.log(`  => taux indexe = ${(100*idx/lot.length).toFixed(0)} %`);
  }
})();
