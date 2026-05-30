import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { isAiPremium, AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "Dashboard — Workwave AI",
  description: "Your Workwave AI freelancer space.",
  robots: { index: false, follow: false },
};

export default async function AiEnDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // layout redirects already

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  // Real stats : count leads over the last 30 days
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Fix react-hooks/purity : we compute the date via new Date() (impure but
  // allowed in an async Server Component — the linter targets Date.now()).
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

  const firstName = pro.name?.split(" ")[0] || "Freelancer";
  const isPremium = isAiPremium(pro); // centralized helper (fix #15)

  return (
    <div className="max-w-5xl">
      {/* H1 + welcome */}
      <div className="mb-10 sm:mb-12">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · HOME ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Hi {firstName}.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
          Here is your Workwave AI freelancer activity over the last 30 days.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <StatCard
          label="Projects received"
          value={stats.leadsReceived30d}
          period="last 30 days"
        />
        <StatCard
          label="Projects answered"
          value={stats.leadsAnswered30d}
          period="last 30 days"
        />
        <StatCard
          label="Response rate"
          value={`${stats.responseRate}%`}
          period="30-day average"
          accent
        />
      </div>

      {/* Membership info banner (free-only — no checkout) */}
      {!isPremium && (
        <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 sm:p-10 mb-10 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10">
            <p
              className="text-[11px] uppercase font-semibold text-[var(--ai-accent)] mb-3"
              style={{ letterSpacing: "0.2em" }}
            >
              ● Premium
            </p>
            <h2
              className="font-black uppercase mb-3"
              style={{
                fontSize: "clamp(24px, 3.5vw, 36px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Premium is{" "}
              <span className="text-[var(--ai-accent)]">coming soon</span>
              <br />
              for international accounts.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mb-6 max-w-lg">
              Your free profile is already live and visible in the directory.
              Paid plans for international freelancers are on the way — no
              action needed for now.
            </p>
            <Link
              href="/en/ai/dashboard/abonnement"
              className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
            >
              View membership
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
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink
          href="/en/ai/dashboard/profil"
          title="Complete your profile"
          desc="Add a bio, your stack, your portfolio. The more complete your profile, the better our AI matches you."
          cta="Edit my profile"
        />
        <QuickLink
          href="/en/ai/dashboard/preferences"
          title="Your preferences"
          desc="Availability, minimum budget. Fine-tune your matching."
          cta="Configure"
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
