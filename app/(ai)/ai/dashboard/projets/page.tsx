import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAiPremium } from "@/lib/ai/helpers";

export const metadata: Metadata = {
  title: "Projets recus — Dashboard Workwave AI",
  description: "Liste des projets recus via Workwave AI.",
  robots: { index: false, follow: false },
};

const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];

const BUDGET_LABELS: Record<string, string> = {
  lt5k: "< 5 000 €",
  "5k-15k": "5 000 - 15 000 €",
  "15k-50k": "15 000 - 50 000 €",
  gt50k: "> 50 000 €",
  tbd: "A definir",
};

export default async function AiDashboardProjetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  // Charger les vrais project_leads via service client (RLS bypass, mais
  // on filtre strictement par pro_id = pro courant)
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: leadsRaw } = await service
    .from("project_leads")
    .select(
      "id, project_id, sent_at, opened_at, contacted_at, status, projects(id, status, description, budget, urgency, created_at, ai_qualification, first_name, email, phone)"
    )
    .eq("pro_id", pro.id)
    .order("sent_at", { ascending: false })
    .limit(50);

  type LeadProject = {
    id: number;
    status: string;
    description: string | null;
    budget: string | null;
    urgency: string | null;
    created_at: string;
    ai_qualification: Record<string, unknown> | null;
    first_name: string | null;
    email: string | null;
    phone: string | null;
  };
  type Lead = {
    id: number;
    project_id: number;
    sent_at: string;
    opened_at: string | null;
    contacted_at: string | null;
    status: string;
    projects: LeadProject | LeadProject[] | null;
  };

  const leads = (leadsRaw || []) as Lead[];

  const projects = leads
    .map((lead) => {
      const proj = Array.isArray(lead.projects) ? lead.projects[0] : lead.projects;
      if (!proj) return null;
      const fullDesc = proj.description || "";
      // Fix #22 : robust parsing. Le format /ai/deposer concatenate :
      //   "${title}\n\n${description}${stack ? "\n\nStack: ${stack}" : ""}..."
      // On split sur \n\n (double linebreak) pour separer title du body.
      // Si l'user a saisi un title sans body, on garde le title comme body
      // mais on ne le DUPLIQUE pas.
      const parts = fullDesc.split(/\n\n+/);
      const title = (parts[0] || "").trim() || "Projet sans titre";
      const body =
        parts.length > 1
          ? parts.slice(1).join("\n\n").trim()
          : ""; // Pas de duplication si pas de body
      return {
        id: proj.id,
        leadId: lead.id,
        title: title.slice(0, 100),
        description: body,
        budget: BUDGET_LABELS[proj.budget || ""] || proj.budget || "A definir",
        urgency: proj.urgency || "Flexible",
        receivedAt: lead.sent_at,
        leadStatus: lead.status,
        clientName: proj.first_name,
        clientEmail: proj.email,
        clientPhone: proj.phone,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const isPremium = isAiPremium(pro);

  return (
    <div className="max-w-5xl">
      <div className="mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · PROJETS RECUS ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Projets recus.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
          Les projets matches par notre IA en fonction de votre expertise, votre TJM et votre disponibilite.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState isPremium={isPremium} />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.leadId}
              className="p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl hover:border-[var(--ai-text)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-[17px] font-bold text-[var(--ai-text)] flex-1">
                  {p.title}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    p.leadStatus === "contacted"
                      ? "bg-green-500/10 text-green-700"
                      : p.leadStatus === "opened"
                      ? "bg-blue-500/10 text-blue-700"
                      : "bg-[var(--ai-accent)]/10 text-[var(--ai-accent)]"
                  }`}
                >
                  {p.leadStatus === "contacted"
                    ? "Contacte"
                    : p.leadStatus === "opened"
                    ? "Vu"
                    : "Nouveau"}
                </span>
              </div>
              <p className="text-sm text-[var(--ai-text-secondary)] mb-3 line-clamp-3 whitespace-pre-wrap">
                {p.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--ai-text-tertiary)] mb-4">
                <span className="font-semibold text-[var(--ai-text)]">{p.budget}</span>
                <span>·</span>
                <span>Delai : {p.urgency}</span>
                <span>·</span>
                <span>
                  {new Date(p.receivedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              {isPremium && p.clientEmail ? (
                <div className="pt-4 border-t border-[var(--ai-border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] tracking-wider mb-1">
                      Client
                    </p>
                    <p className="text-[var(--ai-text)] font-medium">
                      {p.clientName || "Client Workwave"}
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
              ) : (
                <div className="pt-4 border-t border-[var(--ai-border-subtle)]">
                  <p className="text-[12px] text-[var(--ai-text-tertiary)] mb-2">
                    Pour voir les coordonnees du client et repondre au projet :
                  </p>
                  <Link
                    href="/ai/dashboard/abonnement"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-accent)] hover:text-[var(--ai-accent-hover)]"
                  >
                    Activer Premium (29,90€/mois)
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

function EmptyState({ isPremium }: { isPremium: boolean }) {
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
        Aucun projet recu pour l&apos;instant
      </h2>
      <p className="text-[14px] text-[var(--ai-text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
        Workwave AI est en lancement, le volume de projets monte progressivement.
        Completez votre profil et configurez vos preferences pour maximiser le matching.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/ai/dashboard/profil"
          className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
        >
          Completer mon profil
        </Link>
        {!isPremium && (
          <Link
            href="/ai/dashboard/abonnement"
            className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
          >
            Passer Premium
          </Link>
        )}
      </div>
    </div>
  );
}
