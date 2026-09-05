/**
 * Suivi de l'offre "2 premiers leads offerts" · état par pro réclamé.
 *
 * Pour chaque pro réclamé : date d'inscription, déblocages offerts utilisés,
 * déblocages payés, crédits restants. Les pros qui ont consommé leurs 2 offerts
 * sont les MEILLEURS candidats à la relance (ils ont goûté au produit).
 *
 * Usage : npx tsx scripts/_suivi-leads-offerts.ts
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
/* eslint-disable @typescript-eslint/no-explicit-any */

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const FREE = 2;

(async () => {
  const { data: pros } = await sb
    .from("pros")
    .select("id, name, slug, phone, email, claimed_at, categories(name), cities(name)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null)
    .order("claimed_at", { ascending: false });

  const { data: unlocks } = await sb
    .from("lead_unlocks")
    .select("pro_id, project_id, amount_cents, paid_at");

  const byPro = new Map<number, { free: number; paid: number; lastAt: string }>();
  (unlocks || []).forEach((u: any) => {
    const cur = byPro.get(u.pro_id) || { free: 0, paid: 0, lastAt: "" };
    if (u.amount_cents === 0) cur.free++;
    else cur.paid++;
    if (u.paid_at > cur.lastAt) cur.lastAt = u.paid_at;
    byPro.set(u.pro_id, cur);
  });

  console.log(`\n════ SUIVI OFFRE "2 LEADS OFFERTS" · ${(pros || []).length} pros réclamés ════\n`);
  let hot = 0;
  for (const p of (pros || []) as any[]) {
    const u = byPro.get(p.id) || { free: 0, paid: 0, lastAt: "" };
    const remaining = Math.max(0, FREE - u.free - u.paid);
    const claimed = p.claimed_at ? p.claimed_at.slice(0, 10) : "?";
    const flag =
      u.paid > 0 ? "💶 PAYANT" : remaining === 0 ? "🔥 OFFRE CONSOMMÉE → relancer" : u.free > 0 ? "🎁 en cours" : "  ";
    if (remaining === 0 && u.paid === 0) hot++;
    console.log(
      `  ${flag.padEnd(28)} ${String(p.name).slice(0, 32).padEnd(34)} ${((p.categories as any)?.name || "?").padEnd(22)} inscrit:${claimed}  offerts:${u.free}/${FREE}  payés:${u.paid}`
    );
  }
  console.log(`\n  🔥 À relancer (offre consommée, pas encore payé) : ${hot}`);
  console.log(`  Note : chaque déblocage offert déclenche aussi un mail admin en temps réel.\n`);
})().catch((e) => console.error("ERR", e.message));
