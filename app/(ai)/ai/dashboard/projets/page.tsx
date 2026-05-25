import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";

export const metadata: Metadata = {
  title: "Projets recus — Dashboard Workwave AI",
  description: "Liste des projets recus via Workwave AI.",
  robots: { index: false, follow: false },
};

const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];

export default async function AiDashboardProjetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  // TODO Sub-sprint F : charger les vrais project_leads ou matches IA
  const projects: Array<{
    id: number;
    title: string;
    description: string;
    budget: string;
    receivedAt: string;
    status: string;
  }> = [];

  const isPremium = pro.subscription_status === "active";

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
              key={p.id}
              className="p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl hover:border-[var(--ai-text)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-[17px] font-bold text-[var(--ai-text)]">{p.title}</h3>
                <span className="text-[11px] text-[var(--ai-accent)] font-semibold uppercase tracking-wider">
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-[var(--ai-text-secondary)] mb-3 line-clamp-2">
                {p.description}
              </p>
              <div className="flex items-center gap-4 text-[12px] text-[var(--ai-text-tertiary)]">
                <span>{p.budget}</span>
                <span>·</span>
                <span>{p.receivedAt}</span>
              </div>
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
