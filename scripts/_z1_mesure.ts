import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const sb = getServiceClient();

async function main() {
  // 1. La vue listing_cat_ville est-elle lisible via PostgREST ?
  const { data, error, count } = await sb
    .from("listing_cat_ville")
    .select("metier,ville,n", { count: "exact", head: false })
    .limit(3);
  console.log("vue listing_cat_ville:", { error: error?.message, count, sample: data });

  // 2. total via RPC
  const r = await (sb as any).rpc("sitemap_listings_total");
  console.log("sitemap_listings_total:", r.data, r.error?.message);
}
main();
