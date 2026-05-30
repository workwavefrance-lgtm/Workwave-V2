import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAiPremium, AI_CATEGORY_IDS } from "@/lib/ai/helpers";
// Reuse the FR Server Action (now locale-aware). The hidden field
// name="locale" value="en" in each form drives the EN redirects.
import { markProjectAsContacted } from "@/app/(ai)/ai/dashboard/projets/actions";

export const metadata: Metadata = {
  title: "All projects — Workwave AI Dashboard",
  description:
    "Every project posted on Workwave AI, in real time (tech, marketing, finance, legal, HR, design, creative, media).",
  robots: { index: false, follow: false },
};

const BUDGET_LABELS: Record<string, string> = {
  lt5k: "< €5,000",
  "5k-15k": "€5,000 - €15,000",
  "15k-50k": "€15,000 - €50,000",
  gt50k: "> €50,000",
  tbd: "To be defined",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "Immediate (< 1 week)",
  "1month": "Within 1 month",
  "3months": "In 1 to 3 months",
  flexible: "Flexible",
};

// Display limit : 50 most recent projects (pagination later if needed)
const PROJECTS_LIMIT = 50;

export default async function AiEnDashboardProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{
    marked?: string;
    error?: string;
    cat?: string;
    budget?: string;
  }>;
}) {
  const sp = await searchParams;
  const justMarked = sp.marked === "contacted";
  const errKey = sp.error;
  const filterCat = sp.cat || "all";
  const filterBudget = sp.budget || "all";

  const errorMsg =
    errKey === "invalid_project"
      ? "Invalid link. Please try again."
      : errKey === "unauthorized"
      ? "You don't have access to this project."
      : errKey === "project_not_found"
      ? "Project not found."
      : errKey === "premium_required"
      ? "Premium members only. Activate your membership to respond."
      : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  const isPremium = isAiPremium(pro);

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Load all Workwave AI categories (14 verticals) for the filters
  const { data: categoriesRaw } = await service
    .from("categories")
    .select("id, slug, name")
    .in("id", AI_CATEGORY_IDS)
    .order("name");
  const categories = categoriesRaw || [];

  // Load all active Workwave AI projects (Phase 11 broadcast model : every
  // freelancer sees ALL projects, no more project_leads filter).
  // NB: the `projects` table has NO `deleted_at` column — soft-delete uses
  // `status='deleted'`. The only filter needed is .neq("status", "deleted").
  let projectsQuery = service
    .from("projects")
    .select(
      "id, description, budget, urgency, status, created_at, ai_qualification, first_name, email, phone, category_id, categories(name, slug)"
    )
    .eq("vertical", "tech")
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(PROJECTS_LIMIT);

  // Category filter
  if (filterCat !== "all") {
    const cat = categories.find((c) => c.slug === filterCat);
    if (cat) projectsQuery = projectsQuery.eq("category_id", cat.id);
  }

  // Budget filter
  if (filterBudget !== "all") {
    projectsQuery = projectsQuery.eq("budget", filterBudget);
  }

  const { data: projectsRaw } = await projectsQuery;

  type ProjectRow = {
    id: number;
    description: string | null;
    budget: string | null;
    urgency: string | null;
    status: string;
    created_at: string;
    ai_qualification: Record<string, unknown> | null;
    first_name: string | null;
    email: string | null;
    phone: string | null;
    category_id: number;
    categories:
      | { name: string; slug: string }
      | { name: string; slug: string }[]
      | null;
  };

  const projectsRows = (projectsRaw || []) as ProjectRow[];

  // Load the pro's existing leads to know which are already "contacted"
  const projectIds = projectsRows.map((p) => p.id);
  const { data: leadsRaw } = projectIds.length
    ? await service
        .from("project_leads")
        .select("project_id, contacted_at")
        .eq("pro_id", pro.id)
        .in("project_id", projectIds)
    : { data: [] as { project_id: number; contacted_at: string | null }[] };
  const contactedMap = new Map<number, boolean>();
  (leadsRaw || []).forEach((l) => {
    if (l.contacted_at) contactedMap.set(l.project_id, true);
  });

  const projects = projectsRows.map((proj) => {
    const fullDesc = proj.description || "";
    const parts = fullDesc.split(/\n\n+/);
    const title = (parts[0] || "").trim() || "Untitled project";
    const body = parts.length > 1 ? parts.slice(1).join("\n\n").trim() : "";
    const cat = Array.isArray(proj.categories) ? proj.categories[0] : proj.categories;
    const suspicionScore =
      proj.ai_qualification &&
      typeof (proj.ai_qualification as Record<string, unknown>).suspicion_score === "number"
        ? ((proj.ai_qualification as Record<string, unknown>).suspicion_score as number)
        : 0;
    return {
      id: proj.id,
      title: title.slice(0, 100),
      description: body,
      budget: BUDGET_LABELS[proj.budget || ""] || proj.budget || "To be defined",
      timeline: TIMELINE_LABELS[proj.urgency || ""] || proj.urgency || "Flexible",
      receivedAt: proj.created_at,
      status: proj.status,
      isSuspicious: proj.status === "suspicious" || suspicionScore > 70,
      categoryName: cat?.name || "Workwave AI",
      categorySlug: cat?.slug || "ai",
      clientName: proj.first_name,
      clientEmail: proj.email,
      clientPhone: proj.phone,
      alreadyContacted: contactedMap.get(proj.id) || false,
    };
  });

  return (
    <div className="max-w-5xl">
      {justMarked && (
        <div
          className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/10 text-green-800"
          role="status"
        >
          <p className="text-sm font-medium">✓ Project marked as contacted.</p>
        </div>
      )}
      {errorMsg && (
        <div
          className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800"
          role="alert"
        >
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="mb-8">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · LIVE PROJECTS ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          All projects.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
          Every project posted on Workwave AI, in real time. Filter by skill to
          only see the ones you care about.
          {!isPremium && (
            <>
              {" "}
              <strong className="text-[var(--ai-text)]">
                Premium is coming soon for international accounts.
              </strong>
            </>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill
          href="/en/ai/dashboard/projets"
          label="All categories"
          active={filterCat === "all"}
        />
        {categories.map((c) => (
          <FilterPill
            key={c.slug}
            href={`/en/ai/dashboard/projets?cat=${c.slug}${filterBudget !== "all" ? `&budget=${filterBudget}` : ""}`}
            label={c.name}
            active={filterCat === c.slug}
          />
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <FilterPill
          href={
            filterCat !== "all"
              ? `/en/ai/dashboard/projets?cat=${filterCat}`
              : "/en/ai/dashboard/projets"
          }
          label="All budgets"
          active={filterBudget === "all"}
          small
        />
        {Object.entries(BUDGET_LABELS).map(([key, label]) => (
          <FilterPill
            key={key}
            href={`/en/ai/dashboard/projets?budget=${key}${filterCat !== "all" ? `&cat=${filterCat}` : ""}`}
            label={label}
            active={filterBudget === key}
            small
          />
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState filterActive={filterCat !== "all" || filterBudget !== "all"} />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className={`p-6 rounded-2xl transition-colors border ${
                p.isSuspicious
                  ? "bg-amber-50/50 border-amber-300 hover:border-amber-500"
                  : "bg-[var(--ai-bg-card)] border-[var(--ai-border-subtle)] hover:border-[var(--ai-text)]"
              }`}
            >
              {/* ATTENTION banner for suspicious projects */}
              {p.isSuspicious && (
                <div className="mb-4 p-3 bg-amber-100/70 border border-amber-300 rounded-lg">
                  <p className="text-[12px] font-semibold text-amber-900 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>
                      Project flagged by our AI. Double-check the details before
                      reaching out.
                    </span>
                  </p>
                </div>
              )}

              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-[17px] font-bold text-[var(--ai-text)] mb-1">
                    {p.title}
                  </h3>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--ai-accent)]/10 text-[var(--ai-accent)]">
                    {p.categoryName}
                  </span>
                </div>
                {p.alreadyContacted && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/10 text-green-700">
                    Contacted
                  </span>
                )}
              </div>

              {p.description && (
                <p className="text-sm text-[var(--ai-text-secondary)] mb-3 line-clamp-3 whitespace-pre-wrap">
                  {p.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--ai-text-tertiary)] mb-4">
                <span className="font-semibold text-[var(--ai-text)]">{p.budget}</span>
                <span>·</span>
                <span>Timeline: {p.timeline}</span>
                <span>·</span>
                <span>
                  {new Date(p.receivedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Access to contact details : Premium only */}
              {isPremium && p.clientEmail ? (
                <>
                  <div className="pt-4 border-t border-[var(--ai-border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] mb-4">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] tracking-wider mb-1">
                        Client
                      </p>
                      <p className="text-[var(--ai-text)] font-medium">
                        {p.clientName || "Workwave client"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] tracking-wider mb-1">
                        Contact
                      </p>
                      <a
                        href={`mailto:${p.clientEmail}`}
                        className="text-[var(--ai-accent)] underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent-hover)]"
                      >
                        {p.clientEmail}
                      </a>
                      {p.clientPhone && (
                        <a
                          href={`tel:${p.clientPhone}`}
                          className="block text-[var(--ai-text-secondary)]"
                        >
                          {p.clientPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  {!p.alreadyContacted && (
                    <form action={markProjectAsContacted}>
                      <input type="hidden" name="locale" value="en" />
                      <input type="hidden" name="projectId" value={p.id} />
                      <button
                        type="submit"
                        className="text-[12px] font-semibold text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] underline decoration-[var(--ai-border)] underline-offset-2 transition-colors"
                      >
                        ✓ I&apos;ve contacted this client
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="pt-4 border-t border-[var(--ai-border-subtle)]">
                  <p className="text-[12px] text-[var(--ai-text-tertiary)] mb-2">
                    To see the client&apos;s contact details and respond:
                  </p>
                  <Link
                    href="/en/ai/dashboard/abonnement"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-accent)] hover:text-[var(--ai-accent-hover)]"
                  >
                    View membership
                    <svg
                      className="w-3.5 h-3.5"
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
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
  small = false,
}: {
  href: string;
  label: string;
  active: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${small ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-[12px]"} font-semibold rounded-full border transition-colors ${
        active
          ? "bg-[var(--ai-text)] text-white border-[var(--ai-text)]"
          : "bg-[var(--ai-bg-card)] text-[var(--ai-text-secondary)] border-[var(--ai-border-subtle)] hover:border-[var(--ai-text)] hover:text-[var(--ai-text)]"
      }`}
    >
      {label}
    </Link>
  );
}

function EmptyState({ filterActive }: { filterActive: boolean }) {
  return (
    <div className="text-center py-16 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
      <div
        className="grid grid-cols-2 grid-rows-2 gap-[3px] w-12 h-12 mx-auto mb-6"
        aria-hidden="true"
      >
        <div className="bg-[var(--ai-accent)] rounded-[3px] opacity-30" />
        <div className="bg-[var(--ai-text)] rounded-[3px] opacity-20" />
        <div className="bg-[var(--ai-text)] rounded-[3px] opacity-20" />
        <div className="bg-[var(--ai-accent)] rounded-[3px] opacity-30" />
      </div>
      <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-2">
        {filterActive
          ? "No project matches your filters"
          : "No project posted yet"}
      </h2>
      <p className="text-[14px] text-[var(--ai-text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
        {filterActive
          ? "Try widening your filters or check back later. New projects are posted every day."
          : "Workwave AI is launching, so the volume of projects is ramping up gradually. You'll be alerted by email for every new project."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {filterActive && (
          <Link
            href="/en/ai/dashboard/projets"
            className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
          >
            Reset filters
          </Link>
        )}
      </div>
    </div>
  );
}
