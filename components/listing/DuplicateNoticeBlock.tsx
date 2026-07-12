type Props = {
  categoryName: string;
  locationName: string;
  /** true pour une page belge → registre BCE au lieu du Sirene français. */
  isBE?: boolean;
};

/**
 * Encart affiche en bas des pages liste /[metier]/[location] pour inviter
 * les pros qui voient leur entreprise en doublon a reclamer la bonne fiche
 * et nous contacter pour fusionner les doublons.
 *
 * Strategie : on convertit un probleme (doublons hereites du scraping
 * Sirene + enrichissements Apify) en levier d'engagement (le pro identifie
 * lui-meme sa bonne fiche, on supprime les autres a la demande).
 *
 * Visible UNIQUEMENT quand count > 1 (sinon le message n'a pas de sens).
 */
export default function DuplicateNoticeBlock({
  categoryName,
  locationName,
  isBE = false,
}: Props) {
  const subject = `Doublon de fiche à fusionner — ${categoryName} ${locationName}`;
  const mailto = `mailto:contact@workwave.fr?subject=${encodeURIComponent(subject)}`;

  return (
    <section className="mt-12 pt-8 border-t border-[var(--border-color)]">
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: "var(--accent-muted)" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Vous voyez votre entreprise listée plusieurs fois ?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
              {isBE
                ? "Notre annuaire est issu de la Banque-Carrefour des Entreprises (BCE) et de sources publiques. Une même entreprise peut parfois apparaître en doublon (unité d'établissement, ancienne inscription, etc.). Pour corriger :"
                : "Notre annuaire est issu du registre Sirene et de sources publiques. Une même entreprise peut parfois apparaître en doublon (ancien SIRET, établissement secondaire, etc.). Pour corriger :"}
            </p>
            <ol className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 pl-5 list-decimal space-y-1">
              <li>
                <strong className="text-[var(--text-primary)]">
                  Réclamez la fiche la plus complète
                </strong>{" "}
                (la plus à jour, avec la bonne adresse).
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Écrivez-nous</strong>{" "}
                avec les liens des doublons à supprimer. Nous les fusionnons
                sous 24h.
              </li>
            </ol>
            <a
              href={mailto}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Nous écrire pour fusionner des doublons
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
