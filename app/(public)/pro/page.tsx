import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { getFaqSchema } from "@/lib/utils/schema";
import HeroSiretLookup from "@/components/landing/HeroSiretLookup";

export const metadata: Metadata = {
  title: "Trouver des chantiers près de chez vous — Workwave Pro",
  description:
    "Recevez des demandes qualifiees de particuliers dans votre zone. Vos 2 premiers leads sont offerts. Fiche gratuite, pas d'abonnement, zero commission, puis 9,90 EUR TTC par lead.",
  alternates: { canonical: "https://workwave.fr/pro" },
  openGraph: {
    type: "website",
    title: "Trouver des chantiers près de chez vous — Workwave Pro",
    description:
      "Vos 2 premiers leads sont offerts. Fiche gratuite, pas d'abonnement, zero commission, puis 9,90 EUR TTC par lead.",
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
      "Chaque demande est analysée par notre IA, qui identifie le métier exact et vérifie la cohérence avant de la transmettre aux pros concernés de votre zone. Pas de spam, que des projets réels.",
  },
  {
    title: "Zéro commission sur vos chantiers",
    description:
      "Vous payez 9,90 € TTC par lead que vous voulez contacter. Pas de pourcentage sur vos devis ni sur vos factures. Vos revenus restent vos revenus.",
  },
  {
    title: "Fiche pro gratuite à vie, visible sur Google",
    description:
      "Votre fiche est référencée automatiquement sur les moteurs de recherche, et reste gratuite. Aucun abonnement, vous payez uniquement quand vous voulez débloquer les coordonnées d'un client.",
  },
  {
    title: "Inscription gratuite, sans carte bancaire",
    description:
      "Réclamez votre fiche en 2 min via SIRET. Recevez tous les projets de votre zone par email. Aucun engagement, aucune carte demandée.",
  },
  {
    title: "Pay-per-lead, sans engagement",
    description:
      "Vous payez 9,90 € TTC uniquement quand vous décidez de contacter un client. Pas de frais récurrents, pas de période de blocage.",
  },
];

const features = [
  "Tous les projets de votre zone reçus par email",
  "Fiche pro référencée SEO sur Google",
  "Dashboard avec liste des projets disponibles",
  "Qualification IA des demandes",
  "Coordonnées débloquées à la demande (9,90 € TTC/lead)",
  "Gestion des préférences (catégorie, zone, pause)",
  "Paiement uniquement quand vous débloquez un lead",
];

const stats = [
  { value: "2,5 M+", label: "professionnels référencés" },
  { value: "35 163", label: "communes couvertes" },
  { value: "107", label: "départements et provinces" },
  { value: "2 offerts", label: "vos 2 premiers leads, puis 9,90 € TTC/lead" },
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
    title: "Notre IA analyse en temps réel",
    description:
      "Notre IA lit la demande, identifie le métier exact, vérifie la cohérence et détecte le score d'urgence.",
  },
  {
    number: "3",
    title: "Vous recevez les projets de votre zone",
    description:
      "Vous recevez par email les demandes qui correspondent à votre métier et à votre zone d'intervention. Vous débloquez librement celles qui vous intéressent pour 9,90 € TTC.",
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
    question: "Y a-t-il un abonnement à payer ?",
    answer:
      "Non. Aucun abonnement, aucune carte bancaire requise pour s'inscrire. Vous réclamez votre fiche gratuitement et recevez automatiquement tous les projets de votre zone par email. Vos 2 premiers déblocages sont offerts (offre de lancement), puis vous payez 9,90 € TTC par lead que vous souhaitez contacter (paiement unique par projet, via Stripe sécurisé).",
  },
  {
    question: "Combien de leads vais-je recevoir ?",
    answer:
      "Vous recevez en temps réel, par email, les projets publiés dans votre métier et votre zone d'intervention. Il n'y a pas de limite : à vous de choisir ensuite lesquels débloquer pour 9,90 € TTC, selon ceux qui vous intéressent.",
  },
  {
    question: "Mes coordonnées sont-elles partagées ?",
    answer:
      "Vos coordonnées professionnelles (téléphone, email) sont visibles sur votre fiche publique une fois que vous l'avez réclamée. Les coordonnées des particuliers ne vous sont communiquées que via les leads.",
  },
  {
    question: "Comment fonctionne l'inscription ?",
    answer:
      "Dès que vous réclamez votre fiche (vérification SIRET + email, 2 min), vous êtes inscrit au broadcast. Vous recevez automatiquement par email tous les projets de votre catégorie publiés dans votre département. Vous gardez le contrôle : aucune carte demandée à l'inscription, vous payez 9,90 € TTC uniquement quand vous décidez de débloquer un lead spécifique.",
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
          <span className="inline-flex items-center gap-2 bg-[var(--accent)] text-white text-sm sm:text-lg font-bold px-5 py-2.5 sm:px-7 sm:py-3 rounded-full shadow-md mb-8">
            🎁 Vos 2 premiers leads sont offerts
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight mb-6">
            Développez votre activité avec Workwave
            <span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed mb-10">
            <strong className="text-[var(--text-primary)] font-semibold">Fiche 100&nbsp;% gratuite</strong>, sans abonnement et sans commission.
            Recevez les demandes de particuliers dans votre zone — <strong className="text-[var(--text-primary)] font-semibold">vos 2 premiers leads sont offerts</strong>, puis payez uniquement ceux que vous voulez contacter.
          </p>
          {/* Hero CTA : input SIRET inline (zero friction). Le composant client
              gere la Server Action lookupBySiret + redirect intelligent. */}
          <HeroSiretLookup />
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
            Pay-per-lead. Pas d&apos;abonnement.
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-12 max-w-xl mx-auto">
            Réclamez votre fiche gratuitement, recevez tous les projets de votre
            zone. <strong className="text-[var(--text-primary)]">Vos 2 premiers
            leads sont offerts</strong>, puis 9,90 € TTC pour débloquer les
            coordonnées d&apos;un client. Sans engagement, sans commission.
          </p>

          {/* Card unique pay-per-lead */}
          <div className="max-w-md mx-auto mb-12">
            <div className="bg-[var(--bg-primary)] border-2 border-[var(--accent)] rounded-2xl p-8 relative">
              <span
                className="absolute -top-3 right-6 bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1 rounded-full"
              >
                🎁 2 premiers leads offerts
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Lead Unlock
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Vos 2 premiers déblocages sont offerts · puis paiement unique,
                sans abonnement
              </p>
              <div className="mb-1">
                <span className="text-5xl font-bold text-[var(--text-primary)]">
                  9,90 &euro;
                </span>
                <span className="text-[var(--text-secondary)]"> TTC / projet</span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mb-6">
                Coordonnées débloquées immédiatement (nom + email + téléphone)
              </p>
              <Link
                href="/pro/retrouver-fiche"
                className="block w-full text-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 px-6 rounded-full transition-all duration-250 hover:scale-[1.02]"
              >
                Tapez votre SIRET pour commencer
              </Link>
              <p className="text-xs text-center text-[var(--text-tertiary)] mt-3">
                Sans CB · Vous payez uniquement les leads qui vous intéressent
              </p>
            </div>
          </div>

          {/* Encart rassurance : fiche gratuite a vie + comment ça marche */}
          <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 mb-6">
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
                  Comment ça marche ?
                </h3>
                <ol className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Réclamez votre fiche gratuitement</strong> en
                    vérifiant votre SIRET. Inscription en 2 min.
                  </li>
                  <li>
                    <strong>Recevez automatiquement tous les projets</strong>{" "}
                    de votre catégorie et département (par email + dashboard).
                  </li>
                  <li>
                    <strong>Choisissez les projets qui vous intéressent</strong>{" "}
                    en lisant la description, le budget et le délai.
                  </li>
                  <li>
                    <strong>Débloquez les coordonnées pour 9,90 € TTC</strong>{" "}
                    quand vous voulez répondre. Paiement unique par projet.
                  </li>
                  <li>
                    <strong>Contactez le client en direct.</strong> Devis,
                    contrat, paiement : 100 % entre vous et le client. Workwave
                    ne prend aucune commission.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Fonctionnalités incluses */}
          <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-8">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5">
              Inclus pour tous les pros, gratuitement
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
            3 étapes, zéro spam. Notre IA qualifie chaque projet et le
            transmet aux professionnels concernés de votre zone d&apos;intervention.
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
              Vous recevez le projet gratuitement et ne payez 9,90 € que si
              vous décidez de débloquer les coordonnées. Pas d&apos;abonnement,
              pas de lead acheté à l&apos;aveugle : vous gardez le contrôle,
              projet par projet.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {/* JSON-LD FAQPage : le contenu reflete exactement la FAQ visible
          ci-dessous (variable `faqs`). Conforme guidelines Google. */}
      <JsonLd data={getFaqSchema(faqs)} />
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
            gratuitement, sans carte bancaire.
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
