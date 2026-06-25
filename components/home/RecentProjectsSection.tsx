import Link from "next/link";
import type { PublicProject } from "@/lib/queries/recent-projects";
import { getCategoryIcon } from "@/lib/data/category-icons";

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
        <div className="text-center mb-12">
          <span
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)] mb-5 tracking-wider uppercase px-3.5 py-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent-muted)" }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: "var(--accent)" }}
              />
            </span>
            Ils nous font confiance
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] mb-4">
            De vraies demandes, partout en France
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Des particuliers cherchent un pro près de chez eux. Déposez le
            vôtre — gratuit, en 60 secondes, sans inscription.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const urgent = p.urgency === "today";
            const Icon = getCategoryIcon(p.categorySlug);
            return (
              <Link
                key={p.id}
                href="/pro"
                className="group block bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent)]"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--accent)]"
                    style={{ backgroundColor: "var(--accent-muted)" }}
                    aria-hidden
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-[var(--text-primary)] text-base leading-tight group-hover:text-[var(--accent)] transition-colors duration-250">
                        {p.categoryName}
                      </span>
                      {p.urgency && URGENCY_LABELS[p.urgency] && (
                        <span
                          className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={
                            urgent
                              ? { backgroundColor: "var(--accent)", color: "#ffffff" }
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
                    <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                      {p.cityName}
                      {p.deptCode ? ` (${p.deptCode})` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mt-4 pt-4 border-t border-[var(--card-border)]">
                  {p.budget && BUDGET_LABELS[p.budget] && (
                    <>
                      <span className="font-semibold text-[var(--text-secondary)]">
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

        <div className="mt-10 text-center">
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-base transition-all duration-250 hover:opacity-90 hover:-translate-y-0.5"
          >
            Vous êtes artisan ? Recevez ces demandes
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
