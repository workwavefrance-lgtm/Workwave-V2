import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Workwave pour les professionnels - Recevez des leads qualifies",
  description:
    "Recevez des demandes qualifiees de particuliers dans votre zone. Fiche gratuite, essai 14 jours sans carte bancaire, zero commission. A partir de 32,50 euros/mois.",
  alternates: { canonical: "https://workwave.fr/pro" },
  openGraph: {
    type: "website",
    title: "Workwave pour les professionnels - Recevez des leads qualifies",
    description:
      "Fiche gratuite, essai 14 jours sans CB, zero commission. A partir de 32,50 euros/mois.",
    url: "https://workwave.fr/pro",
  },
};

// ============================================
// Données statiques
// ============================================

const steps = [
  {
    number: "1",
    title: "Réclamez votre fiche",
    description:
      "Trouvez votre entreprise dans l'annuaire et réclamez votre fiche en quelques clics. C'est gratuit et sans engagement.",
  },
  {
    number: "2",
    title: "Complétez votre profil",
    description:
      "Ajoutez vos photos, descriptions, certifications et zones d'intervention pour maximiser votre visibilité.",
  },
  {
    number: "3",
    title: "Recevez des demandes qualifiées",
    description:
      "Les particuliers déposent leurs projets et notre système vous envoie automatiquement les demandes qui correspondent à vos critères.",
  },
];

const advantages = [
  {
    title: "Leads qualifiés dans votre zone",
    description:
      "Chaque demande est analysée par notre IA et routée vers les 3 professionnels les mieux placés. Pas de spam, que des projets réels.",
  },
  {
    title: "Zéro commission sur vos chantiers",
    description:
      "Vous payez un abonnement fixe. Pas de pourcentage sur vos devis ni sur vos factures. Vos revenus restent vos revenus.",
  },
  {
    title: "Fiche pro gratuite et visible sur Google",
    description:
      "Votre fiche est référencée automatiquement sur les moteurs de recherche. Plus de visibilité, plus de clients potentiels.",
  },
  {
    title: "Essai gratuit 14 jours sans carte bancaire",
    description:
      "Testez le service pendant 14 jours, recevez vos premiers leads. Aucun engagement, aucune carte demandée.",
  },
  {
    title: "Résiliation libre, sans engagement",
    description:
      "Vous pouvez résilier à tout moment en un clic depuis votre dashboard. Pas de frais cachés, pas de période de blocage.",
  },
];

const features = [
  "Leads illimités dans votre zone",
  "Fiche pro premium référencée SEO",
  "Dashboard avec statistiques d'activité",
  "Qualification IA des demandes",
  "Notifications email instantanées",
  "Gestion des préférences de leads",
  "Support prioritaire par email",
];

const stats = [
  { value: "226 000+", label: "professionnels référencés" },
  { value: "4 293", label: "communes couvertes" },
  { value: "12", label: "départements de Nouvelle-Aquitaine" },
  { value: "14 jours", label: "d'essai gratuit, sans carte bancaire" },
];

const routingSteps = [
  {
    number: "1",
    title: "Le particulier dépose un projet",
    description:
      "Description, ville, budget, urgence. Le formulaire est qualifié en 2 minutes côté demandeur.",
  },
  {
    number: "2",
    title: "Claude analyse en temps réel",
    description:
      "Notre IA lit la demande, identifie le métier exact, vérifie la cohérence et détecte le score d'urgence.",
  },
  {
    number: "3",
    title: "3 pros les mieux placés sont sélectionnés",
    description:
      "Score composite : distance, équité de charge, ancienneté. Maximum 3 pros par projet, jamais de mise en concurrence à 30.",
  },
];

const faqs = [
  {
    question: "Comment réclamer ma fiche ?",
    answer:
      "Recherchez votre entreprise dans l'annuaire Workwave, puis cliquez sur \"C'est mon entreprise\". Vous devrez confirmer votre SIRET et votre email professionnel. L'opération prend moins de 2 minutes.",
  },
  {
    question: "C'est quoi un lead ?",
    answer:
      "Un lead est une demande de projet déposée par un particulier dans votre zone et votre domaine d'activité. Vous recevez les coordonnées complètes du demandeur pour le contacter directement.",
  },
  {
    question: "Puis-je résilier à tout moment ?",
    answer:
      "Oui. Vous pouvez résilier votre abonnement à tout moment depuis votre dashboard. La résiliation prend effet à la fin de la période en cours. Pour l'offre annuelle, un remboursement au prorata est calculé automatiquement.",
  },
  {
    question: "Combien de leads vais-je recevoir ?",
    answer:
      "Le nombre de leads dépend de votre zone géographique, de votre catégorie et de la demande des particuliers. Chaque lead est envoyé à 3 professionnels maximum, ce qui garantit une concurrence raisonnable.",
  },
  {
    question: "Mes coordonnées sont-elles partagées ?",
    answer:
      "Vos coordonnées professionnelles (téléphone, email) sont visibles sur votre fiche publique une fois que vous l'avez réclamée. Les coordonnées des particuliers ne vous sont communiquées que via les leads.",
  },
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "Dès que vous réclamez votre fiche, vous bénéficiez de 14 jours d'essai gratuit sans carte bancaire. Pendant cette période, vous recevez normalement les leads. À la fin de l'essai, vous pouvez activer votre abonnement ou rester sur la version gratuite (fiche visible mais sans réception de leads).",
  },
];

// ============================================
// Composants
// ============================================

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="shrink-0"
    >
      <circle cx="10" cy="10" r="10" fill="var(--accent)" opacity="0.1" />
      <path
        d="M6 10.5L8.5 13L14 7.5"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================
// Page
// ============================================

export default function ProLandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="py-24 sm:py-32 lg:py-40 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight mb-6">
            Développez votre activité avec Workwave
            <span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed mb-10">
            Recevez des demandes qualifiées de particuliers dans votre zone,
            sans commission sur vos chantiers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/recherche"
              className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-4 px-8 rounded-full text-base transition-all duration-250 hover:scale-[1.02]"
            >
              Réclamer ma fiche gratuitement
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center border border-[var(--border-color)] text-[var(--text-primary)] font-semibold py-4 px-8 rounded-full text-base transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Voir les tarifs
            </a>
          </div>
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">
            Déjà inscrit ?{" "}
            <Link
              href="/pro/connexion"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline decoration-[var(--border-color)] hover:decoration-[var(--text-primary)] underline-offset-4 transition-colors duration-250"
            >
              Connectez-vous
            </Link>
          </p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 sm:py-28 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-16 tracking-tight">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--accent)] text-white text-xl font-bold flex items-center justify-center mx-auto mb-5">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                  {step.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-16 tracking-tight">
            Pourquoi choisir Workwave
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((adv) => (
              <div
                key={adv.title}
                className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 hover:border-[var(--accent)] transition-all duration-250"
              >
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                  {adv.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {adv.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-20 sm:py-28 px-4 bg-[var(--bg-secondary)]"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-4 tracking-tight">
            Un tarif simple et transparent
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-12 max-w-xl mx-auto">
            Pas de commission, pas de frais cachés. Un abonnement fixe pour
            recevoir tous vos leads.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {/* Mensuel */}
            <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Mensuel
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Sans engagement
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  39 &euro;
                </span>
                <span className="text-[var(--text-secondary)]"> /mois</span>
              </div>
              <Link
                href="/recherche"
                className="block w-full text-center border border-[var(--border-color)] text-[var(--text-primary)] font-semibold py-3 px-6 rounded-full transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Commencer l&apos;essai gratuit
              </Link>
            </div>

            {/* Annuel */}
            <div className="bg-[var(--bg-primary)] border-2 border-[var(--accent)] rounded-2xl p-8 relative">
              <span className="absolute -top-3 right-6 bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1 rounded-full">
                2 mois offerts
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Annuel
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Économisez 78 &euro; par an
              </p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  32,50 &euro;
                </span>
                <span className="text-[var(--text-secondary)]"> /mois</span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mb-6">
                Facturé 390 &euro; par an
              </p>
              <Link
                href="/recherche"
                className="block w-full text-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 px-6 rounded-full transition-all duration-250 hover:scale-[1.02]"
              >
                Commencer l&apos;essai gratuit
              </Link>
            </div>
          </div>

          {/* Fonctionnalités incluses */}
          <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-8">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5">
              Inclus dans chaque abonnement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres cles — credibilite par le volume */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-4 tracking-tight">
            Workwave en chiffres
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-12 max-w-xl mx-auto">
            Données issues du registre Sirene et de notre infrastructure SEO.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 text-center"
              >
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-snug">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Routing IA — differenciateur fort vs concurrents */}
      <section className="py-20 sm:py-28 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-4 tracking-tight">
            Comment vous recevez vos leads
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-16 max-w-2xl mx-auto">
            3 étapes, zéro spam. Notre IA Claude qualifie chaque projet et
            sélectionne les 3 professionnels les mieux placés.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {routingSteps.map((step, idx) => (
              <div key={step.number} className="relative">
                <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-7 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">
                      {step.number}
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {/* Connecteur fleche entre cards (visible md+) */}
                {idx < routingSteps.length - 1 && (
                  <div
                    className="hidden md:flex absolute top-1/2 -right-4 lg:-right-5 -translate-y-1/2 w-8 h-8 items-center justify-center text-[var(--text-tertiary)] z-10"
                    aria-hidden="true"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="M13 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Pas de mise en concurrence à 30 comme sur les plateformes
              traditionnelles. Maximum 3 pros par projet, ce qui garantit des
              leads qualifiés et une compétition raisonnable.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-12 tracking-tight">
            Questions fréquentes
          </h2>
          <div className="space-y-0 divide-y divide-[var(--border-color)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-base font-medium text-[var(--text-primary)] pr-4">
                    {faq.question}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-250 group-open:rotate-180"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 pr-8">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
            Prêt à recevoir vos premiers clients
            <span className="text-[var(--accent)]"> ?</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Trouvez votre fiche dans l&apos;annuaire et réclamez-la
            gratuitement. L&apos;essai de 14 jours démarre immédiatement.
          </p>
          <Link
            href="/recherche"
            className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-4 px-10 rounded-full text-base transition-all duration-250 hover:scale-[1.02]"
          >
            Trouver ma fiche
          </Link>
        </div>
      </section>
    </main>
  );
}
