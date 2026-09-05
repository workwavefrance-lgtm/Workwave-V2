import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const { data } = await sb.from("pros").select("slug,name,google_rating,google_reviews_count")
    .not("google_rating","is",null).gt("google_reviews_count",50).eq("is_active",true).is("deleted_at",null)
    .limit(5).abortSignal(AbortSignal.timeout(60_000));
  console.log(JSON.stringify(data,null,1));
}
main();
