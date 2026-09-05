import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data, error } = await sb.from("categories").select("slug, vertical");
  if (error) { console.error(error); process.exit(1); }
  const btp = (data||[]).filter(c => ["btp","domicile","personne"].includes(c.vertical as string));
  console.log("TOTAL", data?.length, "BTP", btp.length);
  console.log(btp.map(c=>c.slug).join("\n"));
})();
