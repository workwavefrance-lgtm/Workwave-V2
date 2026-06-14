import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

/**
 * Finances BTP = modèle pay-per-lead. Le CA réel vit dans `lead_unlocks`
 * (1 ligne = 1 déblocage payé à 9,90 €), PAS dans les abonnements Stripe.
 * Lecture via service client (bypass RLS). cf. cartographie 07/06.
 */
export type BtpFinances = {
  totalRevenueEur: number;
  unlockCount: number;
  avgBasketEur: number;
  last30Eur: number;
  byMonth: { date: string; revenue: number }[];
  recent: {
    id: number;
    amountEur: number;
    paidAt: string;
    proName: string | null;
    projectId: number;
  }[];
  // Classement des pros qui achètent le plus de leads (CA + nb déblocages).
  topBuyers: {
    proId: number;
    proName: string | null;
    unlocks: number;
    totalEur: number;
    lastPaidAt: string;
  }[];
};

type Row = {
  id: number;
  amount_cents: number | null;
  paid_at: string;
  pro_id: number | null;
  project_id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pros: any;
};

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export const getBtpFinances = cache(async (): Promise<BtpFinances> => {
  const db = getAdminServiceClient();
  const { data } = (await db
    .from("lead_unlocks")
    .select("id, amount_cents, paid_at, pro_id, project_id, pros(name)")
    .order("paid_at", { ascending: false })) as { data: Row[] | null };
  const rows = data || [];

  const totalCents = rows.reduce((s, r) => s + (r.amount_cents || 0), 0);
  const unlockCount = rows.length;

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const last30Cents = rows
    .filter((r) => new Date(r.paid_at) >= since30)
    .reduce((s, r) => s + (r.amount_cents || 0), 0);

  // CA par mois sur 12 mois (clé "mai 26", même format que le graphe MRR)
  const byMonthMap = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    byMonthMap.set(`${MONTHS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, 0);
  }
  for (const r of rows) {
    const d = new Date(r.paid_at);
    const key = `${MONTHS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    if (byMonthMap.has(key)) byMonthMap.set(key, byMonthMap.get(key)! + (r.amount_cents || 0));
  }

  // Top acheteurs : agrégation par pro (nb déblocages + CA), trié par CA décroissant.
  const proName = (r: Row) =>
    Array.isArray(r.pros) ? r.pros[0]?.name ?? null : r.pros?.name ?? null;
  const buyersMap = new Map<
    number,
    { proId: number; proName: string | null; unlocks: number; totalCents: number; lastPaidAt: string }
  >();
  for (const r of rows) {
    if (r.pro_id == null) continue;
    const prev = buyersMap.get(r.pro_id);
    if (prev) {
      prev.unlocks += 1;
      prev.totalCents += r.amount_cents || 0;
      if (r.paid_at > prev.lastPaidAt) prev.lastPaidAt = r.paid_at;
    } else {
      buyersMap.set(r.pro_id, {
        proId: r.pro_id,
        proName: proName(r),
        unlocks: 1,
        totalCents: r.amount_cents || 0,
        lastPaidAt: r.paid_at,
      });
    }
  }
  const topBuyers = [...buyersMap.values()]
    .sort((a, b) => b.totalCents - a.totalCents || b.unlocks - a.unlocks)
    .slice(0, 20)
    .map((b) => ({
      proId: b.proId,
      proName: b.proName,
      unlocks: b.unlocks,
      totalEur: Math.round(b.totalCents) / 100,
      lastPaidAt: b.lastPaidAt,
    }));

  return {
    totalRevenueEur: Math.round(totalCents) / 100,
    unlockCount,
    avgBasketEur: unlockCount > 0 ? Math.round(totalCents / unlockCount) / 100 : 0,
    last30Eur: Math.round(last30Cents) / 100,
    byMonth: [...byMonthMap.entries()].map(([date, cents]) => ({ date, revenue: cents / 100 })),
    recent: rows.slice(0, 25).map((r) => ({
      id: r.id,
      amountEur: (r.amount_cents || 0) / 100,
      paidAt: r.paid_at,
      proName: proName(r),
      projectId: r.project_id,
    })),
    topBuyers,
  };
});
