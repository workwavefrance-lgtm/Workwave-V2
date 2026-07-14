import Link from "next/link";

/**
 * CTA Pro de la home : point d'entrée pour les professionnels qui découvrent
 * Workwave (2 cards BTP / Workwave AI + badge « 100 % gratuit » + trust signals).
 * Extrait en composant pour pouvoir le positionner librement dans la page.
 */
export default function ProCtaSection() {
  return (
    <section className="py-20 px-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
      <div className="max-w-5xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
              100&nbsp;% gratuit
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Votre fiche est peut-être déjà sur Workwave.
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            2,5&nbsp;millions+ de professionnels sont déjà référencés via les registres officiels SIRENE (France) et BCE (Belgique).
            Réclamez votre fiche gratuitement et sans engagement.
          </p>
        </div>

        {/* 2 cards BTP / AI */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {/* Card BTP */}
          <div
            className="rounded-2xl p-6 sm:p-7 transition-all duration-250 hover:-translate-y-1 hover:shadow-md"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Artisan ou BTP
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
              Plombier, électricien, peintre, maçon, paysagiste… 2,5&nbsp;millions de fiches
              créées à partir des registres officiels SIRENE (France) et BCE (Belgique).
            </p>
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:gap-3 transition-all duration-250"
            >
              Retrouver ma fiche avec mon SIRET
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>

          {/* Card Workwave AI */}
          <div
            className="rounded-2xl p-6 sm:p-7 transition-all duration-250 hover:-translate-y-1 hover:shadow-md"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Freelance Workwave AI
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
              Dev, IA, data, design, marketing, juridique, RH… Créez votre profil
              freelance en 60&nbsp;secondes.
            </p>
            <Link
              href="/ai/inscription"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:gap-3 transition-all duration-250"
            >
              Créer mon profil freelance
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-[var(--text-tertiary)]">
          {["Profil 100 % gratuit", "Sans engagement", "Visibilité immédiate", "Aucune carte demandée"].map((label) => (
            <span key={label} className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-[var(--accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
