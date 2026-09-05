/** RE-MESURE INDEPENDANTE : distribution pros ouverts par (categorie, ville). */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const MAXID = 5_000_000, W = 8;
async function worker(lo: number, hi: number, acc: Map<string, number>) {
  let cur = lo;
  while (cur < hi) {
    const { data, error } = await sb.from("pros").select("id,city_id,category_id")
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F")
      .gt("id", cur).lte("id", hi).order("id").limit(1000);
    if (error) { await new Promise(r => setTimeout(r, 2000)); continue; }
    const rows = (data || []) as any[];
    if (rows.length === 0) break;
    for (const r of rows) { const k = `${r.category_id}|${r.city_id}`; acc.set(k, (acc.get(k) || 0) + 1); }
    cur = rows[rows.length - 1].id;
  }
}
(async () => {
  const acc = new Map<string, number>();
  const pas = Math.ceil(MAXID / W);
  await Promise.all(Array.from({ length: W }, (_, i) => worker(i * pas, Math.min((i + 1) * pas, MAXID), acc)));
  let total = 0, un = 0, deux = 0, trois = 0;
  for (const v of acc.values()) { total += v; if (v === 1) un++; else if (v === 2) deux++; else if (v >= 3) trois++; }
  console.log(`couples (cat, ville) >=1 pro ouvert : ${acc.size}`);
  console.log(`pros ouverts comptes                : ${total}`);
  console.log(`exactement 1 pro : ${un}`);
  console.log(`exactement 2 pros: ${deux}`);
  console.log(`<= 2 pros        : ${un + deux}  (${(((un+deux)/acc.size)*100).toFixed(1)} %)`);
  console.log(`>= 3 pros        : ${trois}`);
  fs.writeFileSync("/tmp/ref-catville.json", JSON.stringify([...acc.entries()]));
})();
