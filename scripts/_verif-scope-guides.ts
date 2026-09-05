import * as path from "path"; import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data } = await sb.from("price_guides").select("slug,scope,metier_slug").eq("scope","metier").limit(60);
  console.log("guides scope=metier :", (data||[]).length);
  console.log((data||[]).slice(0,8).map((r:any)=>`${r.slug} (metier_slug=${r.metier_slug})`).join("\n"));
})();
