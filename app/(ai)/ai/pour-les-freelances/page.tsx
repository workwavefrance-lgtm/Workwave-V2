import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";

export const metadata: Metadata = {
  title: "Pour les freelances tech — Workwave AI",
  description:
    "Workwave AI envoie aux freelances tech les briefs qualifies par IA qui matchent leur profil. Inscription gratuite. 29,90€/mois pour repondre, sans credit, sans commission. France et Europe.",
};

const PROCESS = [
  {
    n: "01",
    title: "Inscription en 4 etapes",
    desc: "Profil, competences, TJM, disponibilite. 5 minutes maximum, gratuit.",
  },
  {
    n: "02",
    title: "Reception de briefs qualifies",
    desc: "Notre IA vous envoie les briefs qui matchent votre expertise, votre TJM et votre disponibilite. Vous repondez si ca vous interesse, libre.",
  },
  {
    n: "03",
    title: "Reponse directe au client",
    desc: "Vous discutez sans intermediaire. Devis, contrat, paiement : 100% libre. Aucune commission.",
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
    point: "Briefs deja qualifies",
    desc: "Plus besoin de chasser des leads froids. Les briefs arrivent qualifies, avec budget et delai connus. Vous repondez ou pas, en 1 clic.",
  },
  {
    title: "vs Freelancer.com",
    point: "France & Europe, profils premium",
    desc: "Pas de concurrence avec des TJM a 50€/jour. Workwave AI cible le tech francophone et europeen, avec des TJM dans la realite du marche (400-1200€/jour).",
  },
];

const FAQ = [
  {
    q: "C'est vraiment gratuit pour s'inscrire ?",
    a: "Oui. L'inscription, la creation du profil, la reception des briefs : tout est gratuit. L'abonnement 29,90€/mois est uniquement requis si vous voulez repondre aux briefs (envoyer un message au client).",
  },
  {
    q: "Comment l'IA selectionne-t-elle les briefs ?",
    a: "Matching semantique sur l'expertise (tags + bio), filtres durs sur le TJM, la dispo et la categorie. Score composite pondere par l'historique de reponses. Les 3 meilleurs profils sont notifies par email a chaque brief.",
  },
  {
    q: "Combien de briefs vais-je recevoir ?",
    a: "Ca depend de la demande sur votre categorie et vos criteres. Workwave AI est en lancement, donc le volume monte progressivement. Une categorie demandee (Dev Web, IA) genere plus de briefs qu'une niche pointue. Le tableau de bord vous montrera votre flux reel des votre inscription.",
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
  return (
    <>
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
              les briefs tech
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                qui vous matchent.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed mb-10">
              Inscription gratuite. Profil mis en avant. Briefs filtres par
              IA selon votre expertise, votre TJM, votre dispo. 29,90€/mois
              pour repondre, sans credit. Resiliation libre. Aucune commission.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/ai/inscription"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors w-full sm:w-auto"
                style={{ boxShadow: "var(--ai-shadow-sm)" }}
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
              <Link
                href="/ai/tarifs"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors w-full sm:w-auto"
              >
                Voir les tarifs
              </Link>
            </div>
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
