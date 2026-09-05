import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
type L = Record<string, string>;
const rows: L[] = JSON.parse(fs.readFileSync("/tmp/prep.json", "utf8"));
(async () => {
  const ids = [...new Set(rows.map((r) => Number(r.projet_id)))];
  const { data, error } = await sb.from("projects").select("*").in("id", ids);
  if (error) { console.error("ERREUR:", error.message); process.exit(1); }
  for (const p of (data || []) as any[]) {
    const n = rows.filter((r) => Number(r.projet_id) === p.id);
    console.log(`\n=== projet #${p.id} : ${n.length} pros dans le CSV, ${n.filter((r) => r.email).length} avec email`);
    for (const [k, v] of Object.entries(p)) {
      if (v === null || v === "" ) continue;
      if (["email", "phone", "first_name", "last_name", "deletion_token"].includes(k)) { console.log(`   ${k.padEnd(24)} [masque]`); continue; }
      console.log(`   ${k.padEnd(24)} ${JSON.stringify(v).slice(0, 200)}`);
    }
  }
})();
