import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, name, vertical, naf_codes")
    .order("id");
  if (error) throw error;
  const cibles = ["4329B", "43.29B", "4332B", "43.32B", "4322B", "43.22B"];
  const rows = (data || []).filter((c: any) =>
    (c.naf_codes || []).some((n: string) => cibles.includes(n))
  );
  for (const c of rows) {
    console.log(c.id, "|", c.slug, "|", c.vertical, "|", JSON.stringify(c.naf_codes));
  }
  console.log("--- total categories:", (data || []).length);
  // ordre tel que le scraper le recoit (select sans order -> ordre physique, mais on regarde ids)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
