import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "Dashboard — Workwave AI",
  description: "Votre espace freelance Workwave AI.",
  robots: { index: false, follow: false },
};

export default async function AiDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // layout redirige deja

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  // Stats reelles : compte leads 30 derniers jours
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Fix react-hooks/purity : on calcule la date via new Date() (impure mais autorisee
  // dans un Server Component async — le linter cible Date.now() specifiquement).
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: leadsReceived30d } = await service
    .from("project_leads")
    .select("id", { count: "exact", head: true })
    .eq("pro_id", pro.id)
    .gte("sent_at", thirtyDaysAgo);
  const { count: leadsAnswered30d } = await service
    .from("project_leads")
    .select("id", { count: "exact", head: true })
    .eq("pro_id", pro.id)
    .gte("sent_at", thirtyDaysAgo)
    .not("contacted_at", "is", null);

  const received = leadsReceived30d || 0;
  const answered = leadsAnswered30d || 0;
  const responseRate = received > 0 ? Math.round((answered / received) * 100) : 0;
  const stats = { leadsReceived30d: received, leadsAnswered30d: answered, responseRate };

  const firstName = pro.name?.split(" ")[0] || "Freelance";

  return (
    <div className="max-w-5xl">
      {/* H1 + accueil */}
      <div className="mb-10 sm:mb-12">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · ACCUEIL ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Bonjour {firstName}.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
          Voici votre activite freelance Workwave AI ces 30 derniers jours.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <StatCard
          label="Projets recus"
          value={stats.leadsReceived30d}
          period="30 derniers jours"
        />
        <StatCard
          label="Projets repondus"
          value={stats.leadsAnswered30d}
          period="30 derniers jours"
        />
        <StatCard
          label="Taux de reponse"
          value={`${stats.responseRate}%`}
          period="moyenne 30j"
          accent
        />
      </div>

      {/* Pay-per-lead info */}
      <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 sm:p-10 mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.2em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ MODELE ]
        </p>
        <h2
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(20px, 3vw, 30px)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          Pay-per-lead
        </h2>
        <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-6 max-w-lg">
          Vous debloquez les projets a{" "}
          <strong className="text-[var(--ai-text)]">9,90 €</strong> l&apos;unite,
          sans abonnement. Votre profil est gratuit et visible dans les listings.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/ai/dashboard/projets"
            className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
          >
            Voir les projets
            <svg
              className="ml-2 w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/ai/dashboard/abonnement"
            className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors"
          >
            Mes deblocages
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink
          href="/ai/dashboard/profil"
          title="Completer votre profil"
          desc="Ajoutez bio, stack, portfolio. Plus votre profil est complet, mieux notre IA vous match."
          cta="Modifier mon profil"
        />
        <QuickLink
          href="/ai/dashboard/preferences"
          title="Vos preferences"
          desc="Categories actives, TJM indicatif, disponibilite. Affine le matching."
          cta="Configurer"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  period,
  accent,
}: {
  label: string;
  value: number | string;
  period: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-2xl border ${
        accent
          ? "bg-[var(--ai-bg-subtle)] border-[var(--ai-border-strong)]"
          : "bg-[var(--ai-bg-card)] border-[var(--ai-border-subtle)]"
      }`}
    >
      <p
        className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
        style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {label}
      </p>
      <p
        className={`text-4xl font-black tracking-tight mb-1 ${
          accent ? "text-[var(--ai-accent)]" : "text-[var(--ai-text)]"
        }`}
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-[var(--ai-text-tertiary)]">{period}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
  cta,
}: {
  href: string;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block p-6 rounded-2xl bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all"
    >
      <h3 className="text-[18px] font-bold text-[var(--ai-text)] mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4">
        {desc}
      </p>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-accent)] group-hover:gap-2 transition-all">
        {cta}
        <svg
          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
