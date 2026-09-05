import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const D = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad";
const JOURS: [string,string][] = [
  ["28/08","sl_access.log.7.gz.txt"],["29/08","sl_access.log.6.gz.txt"],
  ["30/08","sl_access.log.5.gz.txt"],["31/08","sl_access.log.4.gz.txt"],
  ["01/09","sl_access.log.3.gz.txt"],["02/09","sl_access.log.2.gz.txt"],
  ["03/09","sl_access.log.1.txt"],["04/09 (partiel)","sl_access.log.txt"],
];
(async () => {
  const sb = getServiceClient();
  for (const [jour, f] of JOURS) {
    const slugs = fs.readFileSync(path.join(D,f),"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
    let A=0,F=0,abs=0;
    for (let i=0;i<slugs.length;i+=200) {
      const { data } = await sb.from("pros").select("slug, etat_admin").in("slug", slugs.slice(i,i+200));
      const vus = new Set((data||[]).map(r=>r.slug));
      for (const r of data||[]) (r.etat_admin==="F"?F++:A++);
      abs += slugs.slice(i,i+200).filter(s=>!vus.has(s)).length;
    }
    const t=A+F;
    console.log(`${jour.padEnd(16)} fiches distinctes crawlees=${String(slugs.length).padStart(5)}  ouvertes=${String(A).padStart(5)}  fermees=${String(F).padStart(5)}  -> part fermee = ${(100*F/t).toFixed(1)} %   (absentes base ${abs})`);
  }
  console.log(`\nreference base : 49,5 % de fermes parmi les 2 439 976 fiches actives`);
})();
