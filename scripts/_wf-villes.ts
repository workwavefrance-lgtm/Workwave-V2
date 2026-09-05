import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
(async () => {
  const { data: depts } = await sb.from("departments").select("id, code, name, region");
  const all: any[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.from("cities").select("slug, department_id, population").range(offset, offset + 999);
    if (error) throw new Error(error.message);
    const rows = data || [];
    if (rows.length === 0) break;
    all.push(...rows);
    offset += rows.length;
  }
  console.log(`${all.length} villes, ${(depts||[]).length} departements`);
  fs.writeFileSync("/tmp/villes.json", JSON.stringify({ depts, cities: all }));
})();
