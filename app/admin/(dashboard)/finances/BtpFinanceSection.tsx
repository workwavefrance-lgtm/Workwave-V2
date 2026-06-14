import AdminKPICard from "@/components/admin/data-display/AdminKPICard";
import AdminAreaChartComponent from "@/components/admin/charts/AdminAreaChart";
import type { BtpFinances } from "@/lib/queries/admin-finances-btp";

const fmtEur = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(v);

/**
 * Section "BTP — Pay-per-lead" de la page Finances admin.
 * Le CA BTP réel = déblocages de leads à 9,90 € (table lead_unlocks), PAS des
 * abonnements. Données via getBtpFinances() (vraies, en base).
 */
export default function BtpFinanceSection({ data }: { data: BtpFinances }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--admin-text)" }}>
          BTP — Pay-per-lead
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
          Revenu réel des déblocages de leads à 9,90 € (table lead_unlocks)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <AdminKPICard title="CA total" value={fmtEur(data.totalRevenueEur)} />
        <AdminKPICard title="Leads débloqués" value={data.unlockCount.toLocaleString("fr-FR")} />
        <AdminKPICard title="Panier moyen" value={fmtEur(data.avgBasketEur)} />
        <AdminKPICard title="CA 30 derniers jours" value={fmtEur(data.last30Eur)} />
      </div>

      <div
        className="rounded-xl p-5 mb-4"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            CA BTP par mois
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
            12 derniers mois
          </p>
        </div>
        <AdminAreaChartComponent
          data={data.byMonth as unknown as Record<string, unknown>[]}
          dataKey="revenue"
          xKey="date"
          color="var(--admin-accent)"
          height={220}
          formatter={(v) => fmtEur(v)}
        />
      </div>

      {/* Top acheteurs : les pros qui débloquent le plus de leads */}
      <div
        className="rounded-xl overflow-hidden mb-4"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            Top acheteurs
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
            Les professionnels qui achètent le plus de leads (classés par CA généré)
          </p>
        </div>
        {data.topBuyers.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
            Aucun acheteur pour le moment.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <th className="text-left font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>#</th>
                <th className="text-left font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Professionnel</th>
                <th className="text-right font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Leads achetés</th>
                <th className="text-right font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Dernier achat</th>
                <th className="text-right font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>CA généré</th>
              </tr>
            </thead>
            <tbody>
              {data.topBuyers.map((b, i) => (
                <tr key={b.proId} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                  <td className="px-5 py-2.5 tabular-nums font-medium" style={{ color: i < 3 ? "var(--admin-accent)" : "var(--admin-text-tertiary)" }}>
                    {i + 1}
                  </td>
                  <td className="px-5 py-2.5" style={{ color: "var(--admin-text)" }}>{b.proName ?? "—"}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: "var(--admin-text-secondary)" }}>{b.unlocks}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
                    {new Date(b.lastPaidAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-semibold" style={{ color: "var(--admin-text)" }}>
                    {fmtEur(b.totalEur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Derniers déblocages */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            Derniers déblocages
          </h3>
        </div>
        {data.recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
            Aucun déblocage de lead pour le moment.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <th className="text-left font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Date</th>
                <th className="text-left font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Professionnel</th>
                <th className="text-left font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Projet</th>
                <th className="text-right font-medium px-5 py-2.5 text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                  <td className="px-5 py-2.5 tabular-nums" style={{ color: "var(--admin-text-secondary)" }}>
                    {new Date(r.paidAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                  </td>
                  <td className="px-5 py-2.5" style={{ color: "var(--admin-text)" }}>{r.proName ?? "—"}</td>
                  <td className="px-5 py-2.5 tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>#{r.projectId}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-medium" style={{ color: "var(--admin-text)" }}>
                    {fmtEur(r.amountEur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
