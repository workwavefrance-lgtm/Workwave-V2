import Link from "next/link";

// Modèle BTP LIVE = pay-per-lead (9,90 € pour débloquer un contact). L'ancien
// abonnement 39 €/mois a été retiré (0 abonné actif). Cette section explique
// le fonctionnement réel : compte gratuit, leads reçus gratuitement, on paie
// seulement 9,90 € pour débloquer les coordonnées d'un client qui intéresse.

const STEPS = [
  {
    n: "1",
    title: "Votre fiche est en ligne, gratuitement",
    desc: "Aucun abonnement, aucune mensualité. Votre fiche reste visible en permanence sur Workwave.",
  },
  {
    n: "2",
    title: "Vous recevez les demandes de votre zone",
    desc: "Dès qu'un particulier dépose un projet dans votre métier et votre secteur, vous le recevez — gratuitement.",
  },
  {
    n: "3",
    title: "Vous débloquez ce qui vous intéresse",
    desc: "Les coordonnées du client sont masquées. Vous payez 9,90 € pour débloquer un contact, uniquement quand le projet vous intéresse.",
  },
];

export default function AbonnementView() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Facturation
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Comment fonctionne Workwave pour les professionnels
        </p>
      </div>

      {/* Statut : compte gratuit */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Votre compte
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Aucun abonnement — vous êtes listé gratuitement
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
            Gratuit
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Pas de mensualité, pas d&apos;engagement. Vous payez seulement quand
          un client vous intéresse.
        </p>
      </div>

      {/* Comment ça marche */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Comment ça marche
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold flex items-center justify-center mb-3">
                {s.n}
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1 leading-snug">
                {s.title}
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prix pay-per-lead */}
      <div className="bg-[var(--accent)]/5 border-2 border-[var(--accent)]/20 rounded-2xl p-6 text-center">
        <p className="text-3xl font-bold text-[var(--text-primary)]">
          9,90 €{" "}
          <span className="text-base font-medium text-[var(--text-secondary)]">
            par lead débloqué
          </span>
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Sans abonnement · sans engagement · 0 % de commission sur vos chantiers
        </p>
        <Link
          href="/pro/dashboard/leads"
          className="inline-flex items-center justify-center gap-2 mt-5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
        >
          Voir mes leads reçus
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
