"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/shell/AdminProvider";
import { useToast } from "@/components/admin/shell/AdminToast";
import type { AdminKPIs, RecentActivity, AdminTodo } from "@/lib/queries/admin-kpis";

const REFRESH_INTERVAL = 90_000; // 90s + pause onglet masqué (voir useEffect)

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 18) return "Salut";
  return "Bonsoir";
}

function firstName(email?: string): string {
  if (!email) return "";
  const p = email.split("@")[0].split(/[.\-_]/)[0];
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : "";
}

export default function OverviewClient({
  kpis: initialKpis,
  activity: initialActivity,
  todo: initialTodo,
}: {
  kpis: AdminKPIs;
  activity: RecentActivity[];
  todo: AdminTodo;
}) {
  const [kpis, setKpis] = useState(initialKpis);
  const [activity, setActivity] = useState(initialActivity);
  const [todo, setTodo] = useState(initialTodo);
  const lastProjectCount = useRef(initialKpis.projectsThisMonth);
  const { admin } = useAdmin();
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) return;
      const data = await res.json();
      setKpis(data.kpis);
      setActivity(data.activity);
      if (data.todo) setTodo(data.todo);
      if (data.kpis.projectsThisMonth > lastProjectCount.current) {
        const d = data.kpis.projectsThisMonth - lastProjectCount.current;
        toast(`${d} nouveau${d > 1 ? "x" : ""} projet${d > 1 ? "s" : ""} déposé${d > 1 ? "s" : ""}`, "info");
      }
      lastProjectCount.current = data.kpis.projectsThisMonth;
    } catch { /* réseau : silencieux */ }
  }, [toast]);

  // Polling en pause quand l'onglet est masqué (ne martèle plus la DB).
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (!interval) interval = setInterval(refresh, REFRESH_INTERVAL); };
    const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
    const onVis = () => { if (document.hidden) stop(); else { refresh(); start(); } };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [refresh]);

  const todoTotal = todo.suspectProjects + todo.failedNotifs + todo.pendingReviews;
  const projDelta = kpis.projectsThisMonth - kpis.projectsLastMonth;
  const prosDelta = kpis.activePros - kpis.activeProsLastMonth;

  type Action = { key: string; icon: string; tone: string; title: string; sub: string; href: string; chip?: string };
  const actions: Action[] = [];
  if (todo.suspectProjects > 0) actions.push({
    key: "suspect", icon: "⚠️", tone: "var(--admin-danger)",
    title: `${todo.suspectProjects} projet${todo.suspectProjects > 1 ? "s" : ""} suspect${todo.suspectProjects > 1 ? "s" : ""}`,
    sub: "à valider avant broadcast", href: "/admin/projects?status=suspicious", chip: String(todo.suspectProjects),
  });
  if (todo.failedNotifs > 0) actions.push({
    key: "notif", icon: "✉️", tone: "var(--admin-warning)",
    title: `${todo.failedNotifs} notif${todo.failedNotifs > 1 ? "s" : ""} admin échouée${todo.failedNotifs > 1 ? "s" : ""}`,
    sub: "renvoyer depuis la fiche projet", href: "/admin/projects", chip: String(todo.failedNotifs),
  });
  if (todo.pendingReviews > 0) actions.push({
    key: "reviews", icon: "⭐", tone: "var(--admin-accent)",
    title: `${todo.pendingReviews} avis à modérer`, sub: "en attente de validation",
    href: "/admin/reviews", chip: String(todo.pendingReviews),
  });

  const cardBase: React.CSSProperties = {
    background: "var(--admin-card)", border: "1px solid var(--admin-border)", borderRadius: 16,
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--admin-text)" }}>
          {greeting()} {firstName(admin?.email)} <span className="font-normal">👋</span>
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · mise à jour auto
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 relative overflow-hidden" style={{
          background: "linear-gradient(160deg, var(--admin-accent-soft), transparent)",
          border: "1px solid var(--admin-accent)", borderRadius: 16,
        }}>
          <div className="text-[11px] font-medium" style={{ color: "var(--admin-text-secondary)" }}>À traiter</div>
          <div className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-accent)", letterSpacing: "-0.03em" }}>{todoTotal}</div>
          <div className="text-[11px] mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
            {todoTotal === 0 ? "rien en attente" : "action" + (todoTotal > 1 ? "s" : "") + " requise" + (todoTotal > 1 ? "s" : "")}
          </div>
        </div>

        <div className="p-4" style={cardBase}>
          <div className="text-[11px] font-medium" style={{ color: "var(--admin-text-secondary)" }}>Projets · ce mois</div>
          <div className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-text)", letterSpacing: "-0.03em" }}>{kpis.projectsThisMonth}</div>
          <div className="text-[11px] mt-1" style={{ color: projDelta >= 0 ? "var(--admin-success)" : "var(--admin-text-tertiary)" }}>
            {projDelta >= 0 ? "+" : ""}{projDelta} vs mois préc.
          </div>
        </div>

        <div className="p-4" style={cardBase}>
          <div className="text-[11px] font-medium" style={{ color: "var(--admin-text-secondary)" }}>Pros réclamés</div>
          <div className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-text)", letterSpacing: "-0.03em" }}>{kpis.activePros}</div>
          <div className="text-[11px] mt-1" style={{ color: prosDelta > 0 ? "var(--admin-success)" : "var(--admin-text-tertiary)" }}>
            {prosDelta >= 0 ? "+" : ""}{prosDelta} ce mois
          </div>
        </div>

        <div className="p-4" style={cardBase}>
          <div className="text-[11px] font-medium" style={{ color: "var(--admin-text-secondary)" }}>CA pay-per-lead</div>
          <div className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color: "var(--admin-text)", letterSpacing: "-0.03em" }}>
            {todo.revenueEur.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}<span className="text-base" style={{ color: "var(--admin-text-secondary)" }}> €</span>
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
            {todo.paidUnlocks} payé{todo.paidUnlocks > 1 ? "s" : ""} · {todo.freeUnlocks} offert{todo.freeUnlocks > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* À traiter */}
      <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--admin-text-tertiary)" }}>À traiter</div>
      <div className="flex flex-col gap-2 mb-7">
        {actions.length === 0 ? (
          <div className="flex items-center gap-3 p-4" style={cardBase}>
            <div className="w-9 h-9 rounded-xl grid place-items-center text-base shrink-0" style={{ background: "rgba(52,211,153,.14)", color: "var(--admin-success)" }}>✓</div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>Tout est à jour</div>
              <div className="text-[11px]" style={{ color: "var(--admin-text-tertiary)" }}>aucun projet suspect, aucun avis en attente</div>
            </div>
          </div>
        ) : actions.map((a) => (
          <Link key={a.key} href={a.href} className="flex items-center gap-3 p-3.5 transition-colors hover:brightness-125" style={cardBase}>
            <div className="w-9 h-9 rounded-xl grid place-items-center text-base shrink-0" style={{ background: "var(--admin-hover)" }}>{a.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--admin-text)" }}>{a.title}</div>
              <div className="text-[11px] truncate" style={{ color: "var(--admin-text-tertiary)" }}>{a.sub}</div>
            </div>
            {a.chip && <span className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: a.tone, color: "#0A0B0F" }}>{a.chip}</span>}
          </Link>
        ))}
      </div>

      {/* Derniers événements */}
      <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--admin-text-tertiary)" }}>Activité récente</div>
      <div style={cardBase} className="overflow-hidden">
        {activity.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs" style={{ color: "var(--admin-text-tertiary)" }}>Aucune activité récente</div>
        ) : activity.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.type === "project" ? `/admin/projects/${item.id}` : `/admin/pros/${item.id}`}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:brightness-125"
            style={{ borderBottom: "1px solid var(--admin-border)" }}
          >
            <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0 mt-0.5 text-[13px]"
              style={{ background: item.type === "claim" ? "rgba(52,211,153,.14)" : "var(--admin-accent-soft)", color: item.type === "claim" ? "var(--admin-success)" : "var(--admin-accent)" }}>
              {item.type === "claim" ? "✓" : "▸"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--admin-text)" }}>{item.title}</p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--admin-text-tertiary)" }}>{item.description}</p>
            </div>
            <span className="text-[10px] shrink-0 tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>{timeAgo(item.created_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
