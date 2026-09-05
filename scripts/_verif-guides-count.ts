import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const sb = getServiceClient();
  const { count, error } = await sb.from("price_guides").select("*", { count: "exact", head: true });
  console.log("price_guides total (exact) =", count, error ? "ERR:" + error.message : "");
  // echantillon de slugs
  const PAGE = 1000; let offset = 0; const slugs: string[] = [];
  while (true) {
    const { data } = await sb.from("price_guides").select("slug").range(offset, offset + PAGE - 1);
    const rows = data || [];
    if (rows.length === 0) break;
    slugs.push(...rows.map((r: any) => r.slug));
    offset += rows.length;
  }
  console.log("slugs charges =", slugs.length);
  // 20 slugs au hasard
  const pick = [...slugs].sort(() => Math.random() - 0.5).slice(0, 20);
  console.log(pick.join("\n"));
})();
