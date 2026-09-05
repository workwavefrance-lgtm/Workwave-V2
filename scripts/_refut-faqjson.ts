import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { count: tot } = await sb.from("seo_pages").select("id", { count: "exact", head: true });
  const { count: avecFaq } = await sb.from("seo_pages").select("id", { count: "exact", head: true }).not("faq_json", "is", null);
  console.log("seo_pages total :", tot, "· avec faq_json (donc SANS la FAQ listing-faq.ts) :", avecFaq);
})();
