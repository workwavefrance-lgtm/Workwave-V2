import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const all: any[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from("categories").select("id,slug,vertical").range(offset, offset + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    const rows = data || [];
    if (rows.length === 0) break;
    all.push(...rows);
    offset += rows.length;
  }
  const btp = all.filter(c => ["btp","domicile","personne"].includes(c.vertical));
  const tech = all.filter(c => !["btp","domicile","personne"].includes(c.vertical));
  console.log("total", all.length, "btp-like", btp.length, "tech", tech.length);
  console.log("TECHSLUGS=" + tech.map(c => c.slug).join(","));
  console.log("BTPSLUGS=" + btp.map(c => c.slug).join(","));
})();
