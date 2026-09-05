import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const D="/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/ctr";
(async () => {
  const sb = getServiceClient();
  const f = JSON.parse(fs.readFileSync(`${D}/fiches_join2.json`,"utf8")).filter((r:any)=>r.ea==="A").sort((a:any,b:any)=>b.i-a.i).slice(0,3000);
  const slugs = f.map((r:any)=>r.s);
  const { data, error } = await sb.from("pros").select("slug,founded_year,date_creation,description,description_ai,forme_juridique,naf_code,postal_code,effectif_range,sirene_enrichi_at").in("slug", slugs.slice(0,50));
  console.log("erreur:", error?.message, "rows:", data?.length);
  console.log(JSON.stringify(data?.[0]));
})();
