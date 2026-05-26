import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";

const SITE_URL = "https://workwave.fr";

export const metadata: Metadata = {
  title:
    "Pour les freelances — Recevez 100% des projets en temps reel | Workwave AI",
  description:
    "Inscrivez-vous gratuitement (tech, marketing, finance, juridique, RH, design, creation, audiovisuel) et recevez en temps reel TOUS les projets publies sur Workwave AI. Filtrez par savoir-faire, repondez aux projets qui vous interessent. 29,90€/mois pour repondre, sans credit, sans commission. Alternative a Malt, Codeur, Freelancer.com.",
  alternates: { canonical: `${SITE_URL}/ai/pour-les-freelances` },
};

const PROCESS = [
  {
    n: "01",
    title: "Inscription en 4 etapes",
    desc: "Profil, competences, TJM, disponibilite. 5 minutes maximum, gratuit.",
  },
  {
    n: "02",
    title: "Recevez 100% des projets en temps reel",
    desc: "Chaque projet publie sur Workwave dans votre vertical (tech, marketing, finance, juridique, RH, design, creatif) vous est notifie par email immediatement. Vous voyez tout dans votre dashboard, filtre par categorie + budget.",
  },
  {
    n: "03",
    title: "Vous choisissez, vous repondez directement",
    desc: "Pas de selection imposee : c'est vous qui filtrez et decidez. Premium = vous voyez les coordonnees et contactez le client. Devis, contrat, paiement : 100% libre. Aucune commission.",
  },
];

const VS = [
  {
    title: "vs Codeur.com",
    point: "Pas de credits a acheter",
    desc: "Sur Codeur, chaque reponse necessite un credit a acheter. Sur Workwave AI : 29,90€/mois fixe, reponse illimitee. Plus simple a budgeter, surtout si vous repondez regulierement.",
  },
  {
    title: "vs Malt",
    point: "0% de commission",
    desc: "Malt prend 10% sur vos missions jusqu'a 5K€. Workwave AI : 0%, jamais. Le client paie ce qu'il vous doit, vous gardez tout.",
  },
  {
    title: "vs LinkedIn outbound",
    point: "Projets deja qualifies",
    desc: "Plus besoin de chasser des leads froids. Les projets arrivent qualifies, avec budget et delai connus. Vous repondez ou pas, en 1 clic.",
  },
  {
    title: "vs Freelancer.com",
    point: "Focus France & Europe",
    desc: "Freelancer.com et Upwork c'est un marche mondial avec beaucoup d'offshore. Workwave AI cible le tech francophone et europeen, junior, senior, ou expert, du moment que le travail est de qualite. Vous fixez votre TJM, le client decide.",
  },
];

const FAQ = [
  {
    q: "C'est vraiment gratuit pour s'inscrire ?",
    a: "Oui. L'inscription, la creation du profil, la reception en temps reel des projets : tout est gratuit. L'abonnement 29,90€/mois est uniquement requis si vous voulez RÉPONDRE aux projets (voir les coordonnees du client et le contacter).",
  },
  {
    q: "Vais-je voir TOUS les projets ou juste ceux qui matchent ?",
    a: "TOUS. A chaque projet publie sur Workwave AI dans votre vertical (tech, marketing, finance, juridique, RH, design, creatif), tous les freelances inscrits du vertical recoivent un email. C'est vous qui filtrez ensuite par categorie, budget ou stack dans le dashboard. Modele communaute Codeur.com : pas de selection imposee, vous gardez la main.",
  },
  {
    q: "Combien de projets vais-je recevoir ?",
    a: "Ca depend de la demande sur Workwave AI au global. La plateforme est en lancement, donc le volume monte progressivement. Vous serez alerte par email a chaque nouveau projet publie, et le tableau de bord centralise tout avec filtres.",
  },
  {
    q: "Puis-je resilier a tout moment ?",
    a: "Oui, en 1 clic depuis le dashboard. Aucun engagement. La resiliation prend effet a la fin de la periode en cours, sans frais.",
  },
  {
    q: "Workwave prend une commission sur les missions ?",
    a: "Non. Jamais. Vous facturez le client directement, vous gardez 100%. Workwave est financee uniquement par les abonnements freelances.",
  },
];

export default function PourLesFreelancesPage() {
  // JSON-LD FAQPage schema sur les 5 questions existantes
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((qa) => ({
      "@type": "Question",
      name: qa.q,
      acceptedAnswer: { "@type": "Answer", text: qa.a },
    })),
  };

  // JSON-LD Service (offer pour freelance)
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Workwave AI Premium — Abonnement freelance",
    serviceType: "Plateforme de matching projets freelance multi-verticale",
    provider: {
      "@type": "Organization",
      name: "Workwave AI",
      url: `${SITE_URL}/ai`,
    },
    description:
      "Recevez les projets qualifies par IA qui matchent votre profil, tous verticaux confondus : tech, marketing, finance, juridique, RH, design, creation. Reponse illimitee, sans credit, sans commission. 29,90€/mois TTC, resiliable en 1 clic.",
    areaServed: { "@type": "Place", name: "France et Europe" },
    offers: {
      "@type": "Offer",
      price: "29.90",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/ai/inscription`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "29.90",
        priceCurrency: "EUR",
        unitCode: "MON",
      },
    },
  };

  // JSON-LD BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/ai` },
      { "@type": "ListItem", position: 2, name: "Pour les freelances", item: `${SITE_URL}/ai/pour-les-freelances` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <Watermark text="FREELANCERS" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-4xl">
            <SectionLabel index={1} total={4} label="Pour freelances" />
            <h1
              className="font-black text-[var(--ai-text)] uppercase mb-8"
              style={{
                fontSize: "clamp(40px, 7.5vw, 92px)",
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
              }}
            >
              Recevez
              <br />
              100% des projets
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                en temps reel.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed mb-10">
              Inscription gratuite. A chaque nouveau projet tech publie sur
              Workwave, vous etes notifie par email. Filtrez dans le dashboard
              par savoir-faire, repondez aux projets qui vous interessent.
              29,90€/mois pour repondre, sans credit, sans commission.
            </p>

            {/* CTA bar composite — meme pattern que /ai (landing) */}
            <Link
              href="/ai/inscription"
              className="group flex flex-col sm:flex-row items-stretch bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all duration-200 max-w-2xl"
              style={{ boxShadow: "var(--ai-shadow-md)" }}
              aria-label="S'inscrire gratuitement comme freelance — formulaire en 4 etapes"
            >
              {/* Hint text (left) */}
              <div className="flex-1 flex items-center gap-3 px-5 py-5 sm:py-4 min-w-0">
                <div
                  className="grid grid-cols-2 grid-rows-2 gap-[2px] w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90"
                  aria-hidden="true"
                >
                  <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                  <div className="bg-[var(--ai-text)] rounded-[1px]" />
                  <div className="bg-[var(--ai-text)] rounded-[1px]" />
                  <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                </div>
                <span className="text-[14px] sm:text-[15px] text-[var(--ai-text-secondary)] truncate">
                  Creez votre profil tech en 5 minutes
                  <span className="hidden sm:inline">...</span>
                </span>
              </div>

              {/* Orange CTA (right) */}
              <div className="flex items-center justify-center gap-2 bg-[var(--ai-accent)] group-hover:bg-[var(--ai-accent-hover)] text-white px-6 sm:px-7 py-4 sm:py-0 transition-colors duration-200">
                <span className="text-[14px] font-semibold whitespace-nowrap tracking-tight">
                  S&apos;inscrire gratuitement
                </span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>

            {/* Secondary link */}
            <Link
              href="/ai/tarifs"
              className="inline-flex items-center gap-1.5 mt-5 text-[14px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors duration-150"
            >
              Ou voir les tarifs detailles
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 17L17 7M17 7H9M17 7V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — PROCESS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <SectionLabel index={2} total={4} label="Process" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              3 etapes pour
              <br />
              commencer
              <br />
              <span className="text-[var(--ai-text-tertiary)]">a recevoir.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROCESS.map((step) => (
              <div
                key={step.n}
                className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 hover:border-[var(--ai-text)] transition-colors duration-200"
              >
                <span
                  className="block text-5xl font-black text-[var(--ai-accent)] mb-6 tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {step.n}
                </span>
                <h3 className="text-lg font-bold text-[var(--ai-text)] mb-3 leading-tight tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — VS CONCURRENCE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <SectionLabel index={3} total={4} label="Comparatif" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              Pourquoi
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                Workwave AI ?
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VS.map((item, i) => (
              <div
                key={item.title}
                className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 hover:border-[var(--ai-text)] transition-colors duration-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    [ {String(i + 1).padStart(2, "0")} ]
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xl font-bold text-[var(--ai-text)] mb-3 leading-tight tracking-tight">
                  → {item.point}
                </p>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — FAQ + CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionLabel index={4} total={4} label="FAQ" />
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                }}
              >
                Questions
                <br />
                <span className="text-[var(--ai-text-tertiary)]">
                  frequentes.
                </span>
              </h2>
              <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-8">
                Et si la votre n&apos;est pas la, vous pouvez nous ecrire
                avant d&apos;ouvrir un compte.
              </p>

              {/* Final CTA dans card noire */}
              <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                <div className="relative z-10">
                  <p
                    className="text-[10px] uppercase font-semibold text-[var(--ai-accent)] mb-3"
                    style={{ letterSpacing: "0.2em" }}
                  >
                    ● Pret a essayer
                  </p>
                  <h3
                    className="font-black uppercase mb-4"
                    style={{
                      fontSize: "clamp(24px, 3.5vw, 36px)",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Creez votre
                    <br />
                    <span className="text-[var(--ai-accent)]">
                      profil freelance.
                    </span>
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-6">
                    Inscription gratuite en 5 minutes. Aucun engagement.
                    Aucune CB requise.
                  </p>
                  <Link
                    href="/ai/inscription"
                    className="inline-flex items-center justify-center w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
                  >
                    S&apos;inscrire gratuitement
                    <svg
                      className="ml-2 w-4 h-4"
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
              </div>
            </div>

            <div className="lg:col-span-7">
              <ul className="space-y-3">
                {FAQ.map((item, i) => (
                  <li
                    key={item.q}
                    className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl"
                  >
                    <details className="group">
                      <summary className="flex items-start gap-4 p-6 cursor-pointer list-none">
                        <span
                          className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)] pt-1 flex-shrink-0"
                          style={{
                            fontFamily:
                              "var(--font-geist-mono), monospace",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-base font-semibold text-[var(--ai-text)] leading-snug">
                          {item.q}
                        </span>
                        <svg
                          className="w-5 h-5 mt-1 text-[var(--ai-text-tertiary)] flex-shrink-0 transition-transform group-open:rotate-45"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </summary>
                      <p className="px-6 pb-6 pl-[60px] text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
