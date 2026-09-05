/** One-off : tendance réelle des dépôts de projets (28 derniers jours). À supprimer après. */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  const since = new Date(Date.now() - 28 * 864e5).toISOString();
  const { data, error } = await sb
    .from("projects")
    .select("created_at, vertical, status")
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  const rows = (data || []) as { created_at: string; vertical: string | null; status: string | null }[];

  const dayKey = (iso: string) => iso.slice(0, 10);
  const perDay = new Map<string, { total: number; btp: number; tech: number }>();
  for (const r of rows) {
    const k = dayKey(r.created_at);
    const e = perDay.get(k) || { total: 0, btp: 0, tech: 0 };
    e.total++;
    if (r.vertical === "tech") e.tech++;
    else e.btp++;
    perDay.set(k, e);
  }

  console.log("=== Dépôts de projets · 28 derniers jours (par jour) ===");
  const days = [...perDay.keys()].sort();
  for (const d of days) {
    const e = perDay.get(d)!;
    const bar = "█".repeat(e.total);
    console.log(`${d}  total ${String(e.total).padStart(2)} (btp ${e.btp} / tech ${e.tech})  ${bar}`);
  }

  // Totaux glissants 7 jours
  const now = Date.now();
  const win = (from: number, to: number) =>
    rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= now - from * 864e5 && t < now - to * 864e5;
    });
  const btp = (arr: typeof rows) => arr.filter((r) => r.vertical !== "tech").length;
  console.log("\n=== Fenêtres 7 jours glissantes (BTP / total) ===");
  console.log(`  J-0 à J-7   : ${btp(win(7, 0))} btp  / ${win(7, 0).length} total`);
  console.log(`  J-7 à J-14  : ${btp(win(14, 7))} btp  / ${win(14, 7).length} total`);
  console.log(`  J-14 à J-21 : ${btp(win(21, 14))} btp  / ${win(21, 14).length} total`);
  console.log(`  J-21 à J-28 : ${btp(win(28, 21))} btp  / ${win(28, 21).length} total`);
  console.log(`\nTotal 28j : ${rows.length} dépôts (${btp(rows)} btp / ${rows.filter((r) => r.vertical === "tech").length} tech)`);
})();
