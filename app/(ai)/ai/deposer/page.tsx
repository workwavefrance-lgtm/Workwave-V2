import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";

export const metadata: Metadata = {
  title: "Deposer un projet tech — Workwave AI",
  description:
    "Decrivez votre projet tech en 4 etapes. Notre IA selectionne les 3 meilleurs freelances en moins de 24h. Gratuit, sans engagement, sans credit.",
};

const CATEGORIES = [
  { value: "ia", label: "Intelligence Artificielle", hint: "LLM, RAG, agents, vision, fine-tuning" },
  { value: "dev", label: "Developpement Web", hint: "React, Next.js, mobile, full-stack, e-commerce" },
  { value: "cloud", label: "Cloud & DevOps", hint: "AWS, GCP, Azure, Kubernetes, CI/CD" },
  { value: "nocode", label: "No-Code & Automation", hint: "Bubble, Make, Zapier, Airtable, Webflow" },
  { value: "data", label: "Data & Analytics", hint: "BI, ETL, ML engineering, data science" },
  { value: "design", label: "Design Produit", hint: "UX/UI, prototypage, design system, Figma" },
];

const BUDGETS = [
  { value: "lt5k", label: "< 5K€", desc: "Mission courte ou MVP" },
  { value: "5k-15k", label: "5 — 15K€", desc: "Projet de taille moyenne" },
  { value: "15k-50k", label: "15 — 50K€", desc: "Build complet" },
  { value: "gt50k", label: "> 50K€", desc: "Long terme ou equipe" },
  { value: "tbd", label: "A definir", desc: "On en discute" },
];

const TIMELINES = [
  { value: "asap", label: "Immediat", desc: "Sous 1 semaine" },
  { value: "1month", label: "Sous 1 mois", desc: "Demarrage progressif" },
  { value: "3months", label: "Dans 1 a 3 mois", desc: "Planifie" },
  { value: "flexible", label: "Flexible", desc: "Pas de contrainte" },
];

export default function DeposerPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text="BRIEF" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <span
                className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                [ NEW BRIEF ]
              </span>
              <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                Reponse &lt; 24h
              </span>
            </div>

            <h1
              className="font-black text-[var(--ai-text)] uppercase mb-6"
              style={{
                fontSize: "clamp(40px, 7vw, 80px)",
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
              }}
            >
              Decrivez
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                votre projet.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
              4 etapes, 60 secondes. Notre IA selectionne les 3 freelances tech
              les plus pertinents en moins de 24h. Gratuit, sans engagement,
              aucune commission.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FORM
          ═══════════════════════════════════════════════════════════════ */}
      <form
        action="/ai/deposer"
        method="POST"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20"
      >
        <div className="max-w-3xl space-y-12 sm:space-y-16">
          {/* ───────── Step 01 — Categorie ───────── */}
          <div>
            <SectionLabel index={1} total={4} label="Categorie" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Quel type de projet ?
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Selectionnez la categorie qui correspond le mieux. Vous pourrez
              preciser dans le brief.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className="group flex flex-col gap-2 p-5 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all"
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    required
                    className="sr-only peer"
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className="grid grid-cols-2 grid-rows-2 gap-[2px] w-5 h-5"
                      aria-hidden="true"
                    >
                      <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                      <div className="bg-[var(--ai-text)] rounded-[1px]" />
                      <div className="bg-[var(--ai-text)] rounded-[1px]" />
                      <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--ai-text)]">
                      {cat.label}
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--ai-text-secondary)] leading-relaxed pl-8">
                    {cat.hint}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ───────── Step 02 — Brief ───────── */}
          <div>
            <SectionLabel index={2} total={4} label="Brief" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Decrivez le contexte.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Plus le brief est precis, meilleur sera le matching. Notre IA
              re-questionne si necessaire pour qualifier.
            </p>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="title"
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Titre du projet
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  required
                  placeholder="Ex : Refonte de notre app mobile React Native"
                  className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Description detaillee
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={8}
                  placeholder="Decrivez le contexte de votre projet, les objectifs, les contraintes techniques, le perimetre attendu. Soyez precis : c'est ce qui permettra a notre IA de matcher les bons profils."
                  className="w-full px-4 py-3 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all resize-y"
                />
                <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2">
                  Minimum 100 caracteres recommande pour un matching de qualite.
                </p>
              </div>

              <div>
                <label
                  htmlFor="stack"
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Stack technique souhaitee <span className="text-[var(--ai-text-muted)] normal-case">(optionnel)</span>
                </label>
                <input
                  id="stack"
                  type="text"
                  name="stack"
                  placeholder="React, Next.js, PostgreSQL, AWS..."
                  className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* ───────── Step 03 — Budget & delai ───────── */}
          <div>
            <SectionLabel index={3} total={4} label="Budget" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Budget &amp; calendrier.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Indicateurs pour matcher les profils compatibles. Pas
              d&apos;engagement, vous negociez directement avec le freelance.
            </p>

            <div className="space-y-8">
              <div>
                <span
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Budget estime
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {BUDGETS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex flex-col gap-1 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all text-center"
                    >
                      <input
                        type="radio"
                        name="budget"
                        value={opt.value}
                        required
                        className="sr-only peer"
                      />
                      <span
                        className="text-sm font-semibold text-[var(--ai-text)]"
                        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-[var(--ai-text-secondary)] leading-tight">
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Calendrier souhaite
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIMELINES.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex flex-col gap-1 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all text-center"
                    >
                      <input
                        type="radio"
                        name="timeline"
                        value={opt.value}
                        required
                        className="sr-only peer"
                      />
                      <span className="text-sm font-semibold text-[var(--ai-text)]">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-[var(--ai-text-secondary)] leading-tight">
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="remoteOk"
                  className="mt-1 w-4 h-4 rounded border-[var(--ai-border-strong)] text-[var(--ai-accent)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] cursor-pointer"
                />
                <span className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
                  <span className="font-semibold text-[var(--ai-text)]">
                    Remote OK
                  </span>{" "}
                  — j&apos;accepte les freelances en remote total (recommande
                  pour elargir le matching).
                </span>
              </label>
            </div>
          </div>

          {/* ───────── Step 04 — Contact ───────── */}
          <div>
            <SectionLabel index={4} total={4} label="Vous" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Comment vous joindre ?
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Vos coordonnees ne sont partagees qu&apos;avec les 3 freelances
              selectionnes par notre IA. Jamais publiees.
            </p>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    Nom complet
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    name="contactName"
                    required
                    className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="company"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    Entreprise <span className="text-[var(--ai-text-muted)] normal-case">(optionnel)</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    name="company"
                    className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    Email
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    name="contactEmail"
                    required
                    placeholder="vous@entreprise.fr"
                    className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    Telephone <span className="text-[var(--ai-text-muted)] normal-case">(optionnel)</span>
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    name="contactPhone"
                    placeholder="+33 6 12 34 56 78"
                    className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ───────── Submit ───────── */}
          <div className="border-t border-[var(--ai-border-subtle)] pt-10">
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                name="cgu"
                required
                className="mt-1 w-4 h-4 rounded border-[var(--ai-border-strong)] text-[var(--ai-accent)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] cursor-pointer"
              />
              <span className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
                J&apos;accepte les{" "}
                <Link
                  href="/cgu"
                  className="text-[var(--ai-text)] underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-accent)]"
                >
                  CGU
                </Link>{" "}
                et que mes coordonnees soient partagees avec les 3 freelances
                selectionnes par l&apos;IA Workwave. Aucune autre diffusion.
              </span>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 text-[15px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              style={{ boxShadow: "var(--ai-shadow-sm)" }}
            >
              Recevoir 3 freelances en 24h
              <svg
                className="ml-2 w-5 h-5"
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
            </button>

            <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4 leading-relaxed max-w-md">
              Aucun frais. Aucune commission. Vous negociez directement avec le
              freelance. Workwave est un simple intermediaire.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
