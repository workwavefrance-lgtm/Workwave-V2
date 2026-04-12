"use client";

import { useState, useEffect, useCallback } from "react";
import AdminKPICard from "@/components/admin/data-display/AdminKPICard";
import AdminDeltaBadge from "@/components/admin/data-display/AdminDeltaBadge";
import AdminAreaChartComponent from "@/components/admin/charts/AdminAreaChart";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import type { FinanceKPIs, MrrDataPoint, StripeTransaction } from "@/lib/stripe/admin-finances";

// ─── Currency formatter ────────────────────────────────────────────────────────

const fmtEur = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

const fmtEurCompact = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    paid: { label: "Payé", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    open: { label: "En cours", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    uncollectible: { label: "Irrécouvrable", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    void: { label: "Annulé", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
    draft: { label: "Brouillon", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
    unknown: { label: "Inconnu", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  };
  const s = map[status] ?? map.unknown;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

// ─── KPI icons ────────────────────────────────────────────────────────────────

const MrrIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
  </svg>
);

const ArrIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

const SubscribersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const ChurnIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

const LtvIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
  </svg>
);

// ─── Main component ────────────────────────────────────────────────────────────

export default function FinancesClient({
  kpis,
  mrrHistory,
}: {
  kpis: FinanceKPIs;
  mrrHistory: MrrDataPoint[];
}) {
  const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoading, setTxLoading] = useState(true);

  const PAGE_SIZE = 25;

  const fetchTransactions = useCallback(async (page: number) => {
    setTxLoading(true);
    try {
      const res = await fetch(
        `/api/admin/finances/transactions?page=${page}&limit=${PAGE_SIZE}`
      );
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data ?? []);
        setTxHasMore(json.hasMore ?? false);
      }
    } catch {
      // silently fail — Stripe may not be configured
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handlePageChange = (page: number) => {
    setTxPage(page);
    fetchTransactions(page);
  };

  const totalPages = txHasMore ? txPage + 1 : txPage;

  // MRR chart formatter
  const mrrFormatter = (value: number) => fmtEurCompact(value);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold mb-0.5"
            style={{ color: "var(--admin-text)" }}
          >
            Finances
          </h1>
          <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
            Données Stripe en temps réel
          </p>
        </div>

        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
          style={{
            backgroundColor: "var(--admin-hover)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text-secondary)",
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Ouvrir Stripe Dashboard
        </a>
      </div>

      {/* KPI cards — 5 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminKPICard
          title="MRR"
          value={fmtEurCompact(kpis.mrr)}
          delta={kpis.mrrDelta}
          icon={<MrrIcon />}
        />
        <AdminKPICard
          title="ARR"
          value={fmtEurCompact(kpis.arr)}
          delta={kpis.arrDelta}
          icon={<ArrIcon />}
        />
        <AdminKPICard
          title="Abonnés actifs"
          value={kpis.activeSubscribers}
          delta={kpis.activeSubscribersDelta}
          icon={<SubscribersIcon />}
        />
        <AdminKPICard
          title="Churn rate"
          value={`${kpis.churnRate.toFixed(1)}%`}
          delta={kpis.churnRateDelta}
          deltaInvert
          icon={<ChurnIcon />}
        />
        <AdminKPICard
          title="LTV moyen"
          value={fmtEurCompact(kpis.avgLtv)}
          delta={kpis.avgLtvDelta}
          icon={<LtvIcon />}
        />
      </div>

      {/* MRR history chart */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--admin-text)" }}
            >
              Évolution du MRR
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
              12 derniers mois
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#10B981" }}
            />
            <span className="text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>
              MRR (€)
            </span>
          </div>
        </div>

        {mrrHistory.length > 0 ? (
          <AdminAreaChartComponent
            data={mrrHistory}
            dataKey="mrr"
            xKey="date"
            color="#10B981"
            height={260}
            formatter={mrrFormatter}
          />
        ) : (
          <div
            className="h-64 flex flex-col items-center justify-center gap-2 rounded-lg"
            style={{ backgroundColor: "var(--admin-hover)" }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: "var(--admin-text-tertiary)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
              Aucune donnée disponible — Stripe non configuré
            </p>
          </div>
        )}
      </div>

      {/* Transactions table */}
      <div
        className="rounded-xl"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--admin-text)" }}
          >
            Transactions récentes
          </h2>
          {txLoading && (
            <span className="text-[11px]" style={{ color: "var(--admin-text-tertiary)" }}>
              Chargement…
            </span>
          )}
        </div>

        {txLoading ? (
          <TransactionsSkeleton />
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg
              className="w-8 h-8"
              style={{ color: "var(--admin-text-tertiary)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
              Aucune transaction — Stripe non configuré ou aucune facture
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                    {["Date", "Client", "Montant", "Statut", "ID"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-medium uppercase tracking-wider px-4 py-2.5 first:pl-5 last:pr-5"
                        style={{ color: "var(--admin-text-tertiary)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors duration-100"
                      style={{
                        borderBottom:
                          idx < transactions.length - 1
                            ? "1px solid var(--admin-border)"
                            : "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--admin-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td
                        className="px-4 py-3 first:pl-5 text-xs tabular-nums whitespace-nowrap"
                        style={{ color: "var(--admin-text-secondary)" }}
                      >
                        {new Date(tx.created * 1000).toLocaleDateString(
                          "fr-FR",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-xs max-w-[180px] truncate"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {tx.customer_email ?? (
                          <span style={{ color: "var(--admin-text-tertiary)" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-xs font-semibold tabular-nums whitespace-nowrap"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {fmtEur(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td
                        className="px-4 py-3 last:pr-5 text-[11px] font-mono tabular-nums"
                        style={{ color: "var(--admin-text-tertiary)" }}
                      >
                        {tx.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--admin-border)" }}>
              <AdminTablePagination
                page={txPage}
                totalPages={totalPages}
                total={transactions.length + (txHasMore ? 1 : 0)}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom MRR summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="MRR actuel"
          value={fmtEur(kpis.mrr)}
          delta={kpis.mrrDelta}
        />
        <SummaryCard
          label="ARR projeté"
          value={fmtEur(kpis.arr)}
          delta={kpis.arrDelta}
        />
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: number;
}) {
  return (
    <div
      className="rounded-xl p-5 flex items-center justify-between"
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <div>
        <p className="text-xs mb-1" style={{ color: "var(--admin-text-secondary)" }}>
          {label}
        </p>
        <p
          className="text-2xl font-semibold tabular-nums tracking-tight"
          style={{ color: "var(--admin-text)" }}
        >
          {value}
        </p>
      </div>
      <AdminDeltaBadge value={delta} />
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <div
            className="h-3 w-20 rounded animate-pulse"
            style={{ backgroundColor: "var(--admin-hover)" }}
          />
          <div
            className="h-3 w-36 rounded animate-pulse flex-1"
            style={{ backgroundColor: "var(--admin-hover)" }}
          />
          <div
            className="h-3 w-16 rounded animate-pulse"
            style={{ backgroundColor: "var(--admin-hover)" }}
          />
          <div
            className="h-5 w-14 rounded animate-pulse"
            style={{ backgroundColor: "var(--admin-hover)" }}
          />
          <div
            className="h-3 w-28 rounded animate-pulse"
            style={{ backgroundColor: "var(--admin-hover)" }}
          />
        </div>
      ))}
    </div>
  );
}
