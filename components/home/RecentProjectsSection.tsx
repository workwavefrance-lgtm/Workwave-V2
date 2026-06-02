import Link from "next/link";
import type { PublicProject } from "@/lib/queries/recent-projects";

/**
 * Section "Projets déposés récemment" — double CTA sous la bande de stats de la home.
 * - Particulier : "je peux déposer un projet ici" → /deposer-projet
 * - Pro : "il y a des demandes à recevoir" → /pro
 *
 * MODULABLE : affiche de 1 à 10 projets RÉELS (anonymisés : métier + ville + budget
 * + urgence + ancienneté, zéro PII). Se masque entièrement s'il n'y a aucun projet.
 * Au fil des dépôts, la section se remplit toute seule (ISR, cache 1h).
 */

const BUDGET_LABELS: Record<string, string> = {
  lt500: "< 500 €",
  "500_2000": "500 – 2 000 €",
  "2000_5000": "2 000 – 5 000 €",
  "5000_15000": "5 000 – 15 000 €",
  gt15000: "> 15 000 €",
};

const URGENCY_LABELS: Record<string, string> = {
  today: "Urgent",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  "3months": "Sous 3 mois",
  not_urgent: "Sans urgence",
  flexible: "Flexible",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "récemment";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

export default function RecentProjectsSection({
  projects,
}: {
  projects: PublicProject[];
}) {
  if (!projects || projects.length === 0) return null;

  return (
    <section className="px-4 py-16 sm:py-20 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
            En ce moment sur Workwave
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Des projets déposés récemment
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Des particuliers cherchent un pro près de chez eux. Déposez le
            vôtre — gratuit, en 60 secondes, sans inscription.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const urgent = p.urgency === "today";
            return (
              <Link
                key={p.id}
                href="/deposer-projet"
                className="group block bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span className="font-semibold text-[var(--text-primary)] text-[15px] group-hover:text-[var(--accent)] transition-colors duration-250">
                    {p.categoryName}
                  </span>
                  {p.urgency && URGENCY_LABELS[p.urgency] && (
                    <span
                      className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={
                        urgent
                          ? {
                              backgroundColor: "var(--accent-muted)",
                              color: "var(--accent-badge-text)",
                            }
                          : {
                              backgroundColor: "var(--bg-tertiary)",
                              color: "var(--text-tertiary)",
                            }
                      }
                    >
                      {URGENCY_LABELS[p.urgency]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  {p.cityName}
                  {p.deptCode ? ` (${p.deptCode})` : ""}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  {p.budget && BUDGET_LABELS[p.budget] && (
                    <>
                      <span className="font-medium text-[var(--text-secondary)]">
                        {BUDGET_LABELS[p.budget]}
                      </span>
                      <span aria-hidden>·</span>
                    </>
                  )}
                  <span>{relativeTime(p.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/deposer-projet"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
          >
            Déposer mon projet
          </Link>
          <Link
            href="/pro"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Vous êtes artisan ? Recevez ces demandes
          </Link>
        </div>
      </div>
    </section>
  );
}
