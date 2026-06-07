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
      proName: Array.isArray(r.pros) ? r.pros[0]?.name ?? null : r.pros?.name ?? null,
      projectId: r.project_id,
    })),
  };
});
