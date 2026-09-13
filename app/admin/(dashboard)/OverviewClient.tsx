"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, MessageCircle, BriefcaseBusiness, Star, Mail } from "lucide-react";
import AdminPageHeading from "@/components/admin/layout/AdminPageHeading";
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

  type Action = { key: string; icon: typeof ShieldCheck; tone: string; title: string; sub: string; href: string; chip?: string };
  const actions: Action[] = [];
  if (todo.suspectProjects > 0) actions.push({
    key: "suspect", icon: ShieldCheck, tone: "var(--admin-danger)",
    title: `${todo.suspectProjects} projet${todo.suspectProjects > 1 ? "s" : ""} suspect${todo.suspectProjects > 1 ? "s" : ""}`,
    sub: "à vérifier avant diffusion", href: "/admin/projects?status=suspicious", chip: String(todo.suspectProjects),
  });
  if (todo.failedNotifs > 0) actions.push({
    key: "notif", icon: Mail, tone: "var(--admin-warning)",
    title: `${todo.failedNotifs} notification${todo.failedNotifs > 1 ? "s" : ""} admin manquante${todo.failedNotifs > 1 ? "s" : ""}`,
    sub: "renvoyer depuis la fiche projet", href: "/admin/projects", chip: String(todo.failedNotifs),
  });
  if (todo.pendingReviews > 0) actions.push({
    key: "reviews", icon: Star, tone: "var(--admin-accent)",
    title: `${todo.pendingReviews} avis à modérer`, sub: "en attente de validation",
    href: "/admin/reviews", chip: String(todo.pendingReviews),
  });

  const metrics = [
    { label: "À traiter", value: todoTotal.toLocaleString("fr-FR"), note: "Projets suspects, avis et notifications admin", href: "#priorites" },
    { label: "Projets · ce mois", value: kpis.projectsThisMonth.toLocaleString("fr-FR"), note: `${projDelta >= 0 ? "+" : ""}${projDelta} par rapport au mois précédent complet`, href: "/admin/projects" },
    { label: "Fiches réclamées", value: kpis.activePros.toLocaleString("fr-FR"), note: `${prosDelta >= 0 ? "+" : ""}${prosDelta} depuis le début du mois`, href: "/admin/pros" },
    { label: "Déblocages · montant cumulé", value: todo.revenueEur.toLocaleString("fr-FR", {style:"currency",currency:"EUR"}), note: `${todo.paidUnlocks} payants · ${todo.freeUnlocks} offerts`, href: "/admin/finances" },
  ];
  return (
    <div>
      <AdminPageHeading eyebrow={`Votre espace de pilotage${firstName(admin?.email) ? " · " + firstName(admin?.email) : ""}`} title="Une vue claire." subtitle="Pour avancer sereinement." description="Les projets, les personnes et les prochaines actions au même endroit. Actualisation toutes les 90 secondes lorsque cet onglet est visible." actions={<Link href="/admin/support" className="admin-button admin-button-primary inline-flex items-center gap-2 text-white text-xs">Ouvrir le support <ArrowUpRight size={15}/></Link>} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {metrics.map(m => <Link key={m.label} href={m.href} className="admin-surface admin-kpi block">
          <p className="text-xs" style={{color:"var(--admin-text-secondary)"}}>{m.label}</p>
          <p className="text-3xl font-semibold tracking-tight my-3 tabular-nums">{m.value}</p>
          <p className="text-[11px] leading-relaxed" style={{color:"var(--admin-text-secondary)"}}>{m.note}</p>
        </Link>)}
      </div>
      <div className="admin-overview-grid">
        <section id="priorites" className="admin-surface p-6">
          <p className="admin-eyebrow">La prochaine action</p><h2 className="admin-section-title">Ce qui mérite votre attention.</h2>
          {actions.length === 0 ? <div className="py-10 flex items-start gap-4"><span className="admin-priority-icon"><ShieldCheck size={20}/></span><div><p className="font-medium text-sm">Aucune action remontée ici</p><p className="text-xs mt-2" style={{color:"var(--admin-text-secondary)"}}>Consultez aussi le support et les contrôles de vigilance.</p></div></div> : actions.map(a => <Link key={a.key} href={a.href} className="admin-priority"><span className="admin-priority-icon"><a.icon size={19}/></span><div className="flex-1"><p className="font-medium text-sm">{a.title}</p><p className="text-xs mt-1" style={{color:"var(--admin-text-secondary)"}}>{a.sub}</p></div><ArrowUpRight size={17}/></Link>)}
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <Link href="/admin/support" className="rounded-2xl p-4 text-sm flex items-center gap-3" style={{background:"var(--admin-hover)"}}><MessageCircle size={18}/> Répondre aux personnes</Link>
            <Link href="/admin/alerts" className="rounded-2xl p-4 text-sm flex items-center gap-3" style={{background:"var(--admin-hover)"}}><ShieldCheck size={18}/> Consulter la vigilance</Link>
          </div>
        </section>
        <section className="admin-surface p-6">
          <p className="admin-eyebrow">Workwave au fil du jour</p><h2 className="admin-section-title mb-3">Les derniers mouvements.</h2>
          {activity.length === 0 ? <p className="py-10 text-sm">Aucune activité récente.</p> : activity.map(item => <Link key={`${item.type}-${item.id}`} href={item.type === "project" ? `/admin/projects/${item.id}` : `/admin/pros/${item.id}`} className="admin-priority !gap-3 !py-4">
            <span className="admin-priority-icon">{item.type === "claim" ? <ShieldCheck size={17}/> : <BriefcaseBusiness size={17}/>}</span>
            <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{item.title}</p><p className="text-[11px] mt-1 truncate" style={{color:"var(--admin-text-secondary)"}}>{item.description}</p><p className="text-[10px] mt-1" style={{color:"var(--admin-text-tertiary)"}} suppressHydrationWarning>{timeAgo(item.created_at)}</p></div><ArrowUpRight size={14}/>
          </Link>)}
        </section>
      </div>
    </div>
  );
}
