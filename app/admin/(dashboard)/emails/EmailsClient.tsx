"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { EmailStats, EmailLogRow, ActiveCampaign } from "@/lib/queries/admin-emails";

type BouncedPro = { id: number; name: string; email: string };

const SUBJECT_VARIANTS: { value: string; label: string }[] = [
  { value: "a", label: "A — {nom_pro}, votre fiche Workwave est prete" },
  { value: "b", label: "B — Willy de Workwave - votre fiche {ville}" },
  { value: "c", label: "C — {nom_pro} reference sur Workwave (Vienne 86)" },
  { value: "d", label: "D — Petite question d'un entrepreneur de Craon" },
  { value: "e", label: "E — Vos clients de {ville} vous cherchent..." },
];

function computeWarmUpInfo(campaignCreatedAt: string, dailyLimit: number) {
  const start = new Date(campaignCreatedAt);
  const now = new Date();
  const daysSinceStart = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentLimit: number;
  let phase: string;

  if (daysSinceStart < 7) {
    currentLimit = 20;
    phase = "Semaine 1";
  } else if (daysSinceStart < 14) {
    currentLimit = 50;
    phase = "Semaine 2";
  } else if (daysSinceStart < 21) {
    currentLimit = 100;
    phase = "Semaine 3";
  } else {
    currentLimit = Math.min(dailyLimit, 500);
    phase = "Vitesse de croisiere";
  }

  return { daysSinceStart, currentLimit, phase };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    sent: { bg: "rgba(59,130,246,0.15)", text: "rgb(59,130,246)" },
    delivered: { bg: "rgba(16,185,129,0.15)", text: "rgb(16,185,129)" },
    opened: { bg: "rgba(139,92,246,0.15)", text: "rgb(139,92,246)" },
    clicked: { bg: "rgba(245,158,11,0.15)", text: "rgb(245,158,11)" },
    bounced: { bg: "rgba(239,68,68,0.15)", text: "rgb(239,68,68)" },
    complained: { bg: "rgba(239,68,68,0.15)", text: "rgb(239,68,68)" },
    failed: { bg: "rgba(107,114,128,0.15)", text: "rgb(107,114,128)" },
  };
  const c = colors[status] || colors.failed;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: "rgba(16,185,129,0.15)", text: "rgb(16,185,129)" },
    paused: { bg: "rgba(245,158,11,0.15)", text: "rgb(245,158,11)" },
    draft: { bg: "rgba(107,114,128,0.15)", text: "rgb(107,114,128)" },
    completed: { bg: "rgba(59,130,246,0.15)", text: "rgb(59,130,246)" },
  };
  const c = colors[status] || colors.draft;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

export default function EmailsClient({
  initialStats,
  initialCampaign,
  initialLogs,
  initialBouncedPros,
}: {
  initialStats: EmailStats;
  initialCampaign: ActiveCampaign | null;
  initialLogs: EmailLogRow[];
  initialBouncedPros: BouncedPro[];
}) {
  const router = useRouter();
  const [stats] = useState(initialStats);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [logs] = useState(initialLogs);
  const [bouncedPros] = useState(initialBouncedPros);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCampaignAction = useCallback(
    async (action: string, value?: string) => {
      if (!campaign) return;
      setActionLoading(true);
      try {
        const res = await fetch("/api/admin/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            campaignId: campaign.id,
            value,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setCampaign((prev) =>
              prev ? { ...prev, status: data.status } : prev
            );
          }
          if (data.subject_variant) {
            setCampaign((prev) =>
              prev
                ? { ...prev, subject_variant: data.subject_variant }
                : prev
            );
          }
          router.refresh();
        }
      } catch {
        // fail silently
      } finally {
        setActionLoading(false);
      }
    },
    [campaign, router]
  );

  const warmUp = campaign
    ? computeWarmUpInfo(campaign.created_at, campaign.daily_limit)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-semibold mb-1"
          style={{ color: "var(--admin-text)" }}
        >
          Emails
        </h1>
        <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
          Cold emailing - suivi des envois et performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Envoyes"
          value={stats.totalSent}
          sub={`${stats.sentToday} aujourd'hui`}
        />
        <KpiCard
          label="Taux d'ouverture"
          value={`${stats.openRate.toFixed(1)}%`}
          sub={`${stats.totalOpened} ouverts`}
          alert={stats.openRate < 15 && stats.totalSent > 50}
        />
        <KpiCard
          label="Taux de clic"
          value={`${stats.clickRate.toFixed(1)}%`}
          sub={`${stats.totalClicked} clics`}
        />
        <KpiCard
          label="Bounce / Plainte"
          value={`${stats.bounceRate.toFixed(1)}%`}
          sub={`${stats.totalBounced} bounce, ${stats.totalComplained} plainte`}
          alert={stats.bounceRate > 3 || stats.complaintRate > 0.3}
          alertColor="rgb(239,68,68)"
        />
      </div>

      {/* Campaign control + Warm-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Campaign control */}
        <div
          className="rounded-xl p-5"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "var(--admin-text)" }}
          >
            Campagne active
          </h2>

          {campaign ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CampaignStatusBadge status={campaign.status} />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--admin-text)" }}
                >
                  {campaign.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {campaign.status === "active" ? (
                  <button
                    onClick={() => handleCampaignAction("pause")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-50"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "rgb(239,68,68)",
                    }}
                  >
                    Pause (Kill Switch)
                  </button>
                ) : campaign.status === "paused" ? (
                  <button
                    onClick={() => handleCampaignAction("resume")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-50"
                    style={{
                      backgroundColor: "rgba(16,185,129,0.1)",
                      color: "rgb(16,185,129)",
                    }}
                  >
                    Reprendre
                  </button>
                ) : null}
              </div>

              {/* Subject variant selector */}
              <div>
                <label
                  className="block text-[11px] font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Variante sujet A/B
                </label>
                <select
                  value={campaign.subject_variant}
                  onChange={(e) =>
                    handleCampaignAction("update_subject", e.target.value)
                  }
                  disabled={actionLoading}
                  className="w-full px-3 py-2 rounded-lg text-xs disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--admin-bg)",
                    color: "var(--admin-text)",
                    border: "1px solid var(--admin-border)",
                  }}
                >
                  {SUBJECT_VARIANTS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="text-[11px] space-y-1"
                style={{ color: "var(--admin-text-tertiary)" }}
              >
                <p>Steps: {campaign.total_steps} | Limite: {campaign.daily_limit}/jour</p>
                <p>
                  Creee le{" "}
                  {new Date(campaign.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          ) : (
            <p
              className="text-xs"
              style={{ color: "var(--admin-text-tertiary)" }}
            >
              Aucune campagne configuree
            </p>
          )}
        </div>

        {/* Warm-up status */}
        <div
          className="rounded-xl p-5"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "var(--admin-text)" }}
          >
            Warm-up domaine
          </h2>

          {warmUp ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: "var(--admin-accent)" }}
                >
                  {warmUp.currentLimit}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  emails/jour
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "var(--admin-text)" }}
                  >
                    {warmUp.phase}
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: "var(--admin-text-tertiary)" }}
                  >
                    Jour {warmUp.daysSinceStart + 1}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--admin-hover)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((warmUp.daysSinceStart + 1) / 28) * 100)}%`,
                      backgroundColor: "var(--admin-accent)",
                    }}
                  />
                </div>

                <div
                  className="flex justify-between mt-2 text-[10px]"
                  style={{ color: "var(--admin-text-tertiary)" }}
                >
                  <span>S1: 20/j</span>
                  <span>S2: 50/j</span>
                  <span>S3: 100/j</span>
                  <span>S4+: max</span>
                </div>
              </div>

              {/* Sequences summary */}
              <div
                className="grid grid-cols-3 gap-2 pt-2"
                style={{
                  borderTop: "1px solid var(--admin-border)",
                }}
              >
                <MiniStat
                  label="Actives"
                  value={stats.sequencesActive}
                  color="rgb(16,185,129)"
                />
                <MiniStat
                  label="En attente"
                  value={stats.sequencesPending}
                  color="rgb(59,130,246)"
                />
                <MiniStat
                  label="Terminees"
                  value={stats.sequencesCompleted}
                  color="var(--admin-text-secondary)"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat
                  label="Desinscrits"
                  value={stats.sequencesUnsubscribed}
                  color="rgb(245,158,11)"
                />
                <MiniStat
                  label="Bounced"
                  value={stats.sequencesBounced}
                  color="rgb(239,68,68)"
                />
                <MiniStat
                  label="Erreurs"
                  value={stats.sequencesError}
                  color="rgb(239,68,68)"
                />
              </div>
            </div>
          ) : (
            <p
              className="text-xs"
              style={{ color: "var(--admin-text-tertiary)" }}
            >
              Aucune campagne configuree
            </p>
          )}
        </div>
      </div>

      {/* Bounce/Complaint alert */}
      {(stats.bounceRate > 3 || stats.complaintRate > 0.3) &&
        stats.totalSent > 50 && (
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="rgb(239,68,68)"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: "rgb(239,68,68)" }}
              >
                Seuils critiques detectes
              </p>
              <p className="text-[11px] mt-1" style={{ color: "rgb(239,68,68)" }}>
                {stats.bounceRate > 3 &&
                  `Bounce rate: ${stats.bounceRate.toFixed(1)}% (seuil: 3%). `}
                {stats.complaintRate > 0.3 &&
                  `Complaint rate: ${stats.complaintRate.toFixed(2)}% (seuil: 0.3%).`}
                {" "}La campagne sera automatiquement mise en pause.
              </p>
            </div>
          </div>
        )}

      {/* Recent logs */}
      <div
        className="rounded-xl"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--admin-text)" }}
          >
            Derniers envois
          </h2>
          <span
            className="text-[11px] tabular-nums"
            style={{ color: "var(--admin-text-tertiary)" }}
          >
            {logs.length} derniers
          </span>
        </div>

        {logs.length === 0 ? (
          <div
            className="px-5 py-12 text-center"
            style={{ color: "var(--admin-text-tertiary)" }}
          >
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <p className="text-xs">Aucun email envoye</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  style={{
                    borderTop: "1px solid var(--admin-border)",
                    borderBottom: "1px solid var(--admin-border)",
                  }}
                >
                  {["Pro", "Email", "Step", "Sujet", "Statut", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left font-medium"
                        style={{ color: "var(--admin-text-tertiary)" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid var(--admin-border)",
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
                      className="px-5 py-2.5 font-medium whitespace-nowrap"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {log.pro_name}
                    </td>
                    <td
                      className="px-5 py-2.5 whitespace-nowrap"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {log.recipient_email}
                    </td>
                    <td
                      className="px-5 py-2.5 tabular-nums"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {log.step}/3
                    </td>
                    <td
                      className="px-5 py-2.5 max-w-[200px] truncate"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {log.subject}
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusBadge status={log.status} />
                    </td>
                    <td
                      className="px-5 py-2.5 whitespace-nowrap tabular-nums"
                      style={{ color: "var(--admin-text-tertiary)" }}
                    >
                      {new Date(log.sent_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bounced pros */}
      {bouncedPros.length > 0 && (
        <div
          className="rounded-xl"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <div className="px-5 py-4 flex items-center justify-between">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--admin-text)" }}
            >
              Pros bounced
            </h2>
            <span
              className="text-[11px] tabular-nums"
              style={{ color: "var(--admin-text-tertiary)" }}
            >
              {bouncedPros.length} pros
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  style={{
                    borderTop: "1px solid var(--admin-border)",
                    borderBottom: "1px solid var(--admin-border)",
                  }}
                >
                  {["Nom", "Email"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left font-medium"
                      style={{ color: "var(--admin-text-tertiary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bouncedPros.map((pro) => (
                  <tr
                    key={pro.id}
                    style={{
                      borderBottom: "1px solid var(--admin-border)",
                    }}
                  >
                    <td
                      className="px-5 py-2.5 font-medium"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {pro.name}
                    </td>
                    <td
                      className="px-5 py-2.5"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {pro.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  alert,
  alertColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
  alertColor?: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--admin-card)",
        border: alert
          ? `1px solid ${alertColor || "rgb(245,158,11)"}`
          : "1px solid var(--admin-border)",
      }}
    >
      <p
        className="text-[11px] font-medium mb-1"
        style={{ color: "var(--admin-text-tertiary)" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: alert ? alertColor || "rgb(245,158,11)" : "var(--admin-text)" }}
      >
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      {sub && (
        <p
          className="text-[10px] mt-1"
          style={{ color: "var(--admin-text-tertiary)" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold tabular-nums" style={{ color }}>
        {value.toLocaleString("fr-FR")}
      </p>
      <p
        className="text-[10px]"
        style={{ color: "var(--admin-text-tertiary)" }}
      >
        {label}
      </p>
    </div>
  );
}
