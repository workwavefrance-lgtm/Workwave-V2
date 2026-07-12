import Link from "next/link";
import type { BtpFinances } from "@/lib/queries/admin-finances-btp";

function eur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

/**
 * Espace Finance — centré sur le vrai business : pay-per-lead 9,90 € (lead_unlocks).
 * Les abonnements IA Stripe (0 abonné, vertical en pause) sont relégués à une note.
 */
export default function FinanceView({ data }: { data: BtpFinances }) {
  const maxMonth = Math.max(1, ...data.byMonth.map((m) => m.revenue));

  const card: React.CSSProperties = { background: "var(--admin-card)", border: "1px solid var(--admin-border)", borderRadius: 16 };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-1">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--admin-text)" }}>Finance</h1>
        <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>Pay-per-lead · 9,90 € le déblocage</p>
      </div>

      {/* Hero CA */}
      <div className="p-5 mt-4 mb-4" style={{ background: "linear-gradient(160deg, var(--admin-accent-soft), transparent)", border: "1px solid var(--admin-accent)", borderRadius: 18 }}>
        <div className="text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Chiffre d&apos;affaires · total</div>
        <div className="text-4xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-text)", letterSpacing: "-0.03em" }}>
          {eur(data.totalRevenueEur)}<span className="text-xl" style={{ color: "var(--admin-text-secondary)" }}> €</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px]" style={{ color: "var(--admin-text-tertiary)" }}>
          <span><b style={{ color: "var(--admin-text)" }}>{data.paidCount}</b> payé{data.paidCount > 1 ? "s" : ""}</span>
          <span><b style={{ color: "var(--admin-text)" }}>{data.freeCount}</b> offert{data.freeCount > 1 ? "s" : ""}</span>
          <span>panier <b style={{ color: "var(--admin-text)" }}>{eur(data.avgBasketEur)} €</b></span>
          <span>30 j : <b style={{ color: "var(--admin-text)" }}>{eur(data.last30Eur)} €</b></span>
        </div>
        {/* Bars 12 mois */}
        <div className="flex items-end gap-1.5 mt-4" style={{ height: 56 }}>
          {data.byMonth.map((m, i) => (
            <div key={i} className="flex-1 rounded-t" title={`${m.date} : ${eur(m.revenue)} €`}
              style={{ height: `${Math.max(4, (m.revenue / maxMonth) * 100)}%`, background: m.revenue > 0 ? "linear-gradient(180deg, var(--admin-accent), rgba(255,90,54,.25))" : "var(--admin-hover)", minHeight: 4 }} />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px]" style={{ color: "var(--admin-text-tertiary)" }}>
          <span>{data.byMonth[0]?.date}</span><span>{data.byMonth[data.byMonth.length - 1]?.date}</span>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4" style={card}>
          <div className="text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Déblocages payés</div>
          <div className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-text)" }}>{data.paidCount}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--admin-success)" }}>{eur(data.totalRevenueEur)} € encaissé</div>
        </div>
        <div className="p-4" style={card}>
          <div className="text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Leads offerts</div>
          <div className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-text)" }}>{data.freeCount}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--admin-text-tertiary)" }}>acquisition (0 €)</div>
        </div>
        <div className="p-4" style={card}>
          <div className="text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>Total déblocages</div>
          <div className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-text)" }}>{data.unlockCount}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--admin-text-tertiary)" }}>payés + offerts</div>
        </div>
      </div>

      {/* Derniers déblocages */}
      <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--admin-text-tertiary)" }}>Derniers déblocages</div>
      <div style={card} className="overflow-hidden mb-6">
        {data.recent.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs" style={{ color: "var(--admin-text-tertiary)" }}>Aucun déblocage pour l&apos;instant</div>
        ) : data.recent.map((r) => (
          <Link key={r.id} href={`/admin/projects/${r.projectId}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:brightness-125" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div className="w-8 h-8 rounded-lg grid place-items-center text-[11px] font-bold shrink-0" style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}>
              {(r.proName || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: "var(--admin-text)" }}>{r.proName || "Pro inconnu"}</div>
              <div className="text-[11px]" style={{ color: "var(--admin-text-tertiary)" }}>projet #{r.projectId} · {new Date(r.paidAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</div>
            </div>
            <span className="text-[12.5px] font-bold tabular-nums shrink-0" style={{ color: r.amountEur > 0 ? "var(--admin-success)" : "#5EC8F0" }}>
              {r.amountEur > 0 ? `${eur(r.amountEur)} €` : "offert"}
            </span>
          </Link>
        ))}
      </div>

      {/* Top acheteurs */}
      {data.topBuyers.length > 0 && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--admin-text-tertiary)" }}>Meilleurs acheteurs</div>
          <div style={card} className="overflow-hidden mb-6">
            {data.topBuyers.map((b) => (
              <Link key={b.proId} href={`/admin/pros/${b.proId}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:brightness-125" style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <div className="flex-1 min-w-0 text-[13px] font-semibold truncate" style={{ color: "var(--admin-text)" }}>{b.proName || "Pro inconnu"}</div>
                <span className="text-[11px]" style={{ color: "var(--admin-text-tertiary)" }}>{b.unlocks} déblocage{b.unlocks > 1 ? "s" : ""}</span>
                <span className="text-[12.5px] font-bold tabular-nums" style={{ color: "var(--admin-text)" }}>{eur(b.totalEur)} €</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Abonnements IA (relégué) */}
      <div className="flex items-center gap-3 p-3.5" style={card}>
        <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--admin-hover)", color: "var(--admin-text-tertiary)" }}>💤</div>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>Abonnements IA</div>
          <div className="text-[11px]" style={{ color: "var(--admin-text-tertiary)" }}>vertical freelance en pay-per-lead lui aussi — pas d&apos;abonnement actif</div>
        </div>
      </div>
    </div>
  );
}
