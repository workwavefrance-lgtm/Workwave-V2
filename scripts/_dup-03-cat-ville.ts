/** MESURE 2 : distribution du nombre de pros OUVERTS par couple (metier, commune)
 *  et par couple (metier, departement). Donne le nombre de pages listing
 *  quasi vides (1 ou 2 pros) reellement servies (la page ne redirige qu'a 0). */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

const MAXID = 4_700_000, W = 8;

async function worker(lo: number, hi: number, acc: Map<string, number>) {
  let cur = lo;
  while (cur < hi) {
    const { data, error } = await sb.from("pros").select("id,city_id,category_id")
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F")
      .gt("id", cur).lte("id", hi).order("id").limit(1000);
    if (error) { console.error("err", error.message); await new Promise(r => setTimeout(r, 2000)); continue; }
    const rows = (data || []) as any[];
    if (rows.length === 0) break;
    for (const r of rows) { const k = `${r.category_id}|${r.city_id}`; acc.set(k, (acc.get(k) || 0) + 1); }
    cur = rows[rows.length - 1].id;
  }
}

(async () => {
  const acc = new Map<string, number>();
  const pas = Math.ceil(MAXID / W);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: W }, (_, i) => worker(i * pas, Math.min((i + 1) * pas, MAXID), acc)));
  let total = 0; for (const v of acc.values()) total += v;
  console.log(`couples (metier, commune) avec >=1 pro ouvert : ${acc.size}`);
  console.log(`pros ouverts comptes : ${total}   (${((Date.now() - t0) / 1000).toFixed(0)} s)`);

  const seuils = [1, 2, 3, 5, 10];
  const dist: Record<string, number> = {};
  for (const v of acc.values()) {
    for (const s of seuils) { const k = `<=${s}`; if (v <= s) dist[k] = (dist[k] || 0) + 1; }
  }
  console.log("\nrepartition cumulee des couples (metier, commune) :");
  for (const s of seuils) console.log(`  ${String(dist[`<=${s}`] || 0).padStart(7)} couples avec <= ${s} pro(s) ouvert(s)   (${(((dist[`<=${s}`] || 0) / acc.size) * 100).toFixed(1)} % des pages servies)`);
  const exact: Record<number, number> = {};
  for (const v of acc.values()) { const b = v >= 10 ? 10 : v; exact[b] = (exact[b] || 0) + 1; }
  console.log("\nexact :");
  for (let i = 1; i <= 10; i++) console.log(`  ${i}${i === 10 ? "+" : " "} pro(s) : ${String(exact[i] || 0).padStart(7)}`);

  fs.writeFileSync("/tmp/catville.json", JSON.stringify([...acc.entries()]));
  console.log("\necrit /tmp/catville.json");
})();
