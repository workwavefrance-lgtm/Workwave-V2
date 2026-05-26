import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import { submitInscription } from "./actions";

export const metadata: Metadata = {
  title: "Inscription freelance — Workwave AI",
  description:
    "Creez votre profil freelance tech sur Workwave AI en 4 etapes. Inscription gratuite. Recevez les briefs qualifies par IA. Abonnement 29,90€/mois pour repondre.",
  robots: { index: false, follow: false },
};

const CATEGORIES = [
  { value: "ia", label: "Intelligence Artificielle", hint: "LLM, RAG, agents, fine-tuning" },
  { value: "dev", label: "Developpement Web", hint: "React, Next.js, mobile, full-stack" },
  { value: "cloud", label: "Cloud & DevOps", hint: "AWS, GCP, Azure, K8s, CI/CD" },
  { value: "nocode", label: "No-Code & Automation", hint: "Bubble, Make, Zapier, Webflow" },
  { value: "data", label: "Data & Analytics", hint: "BI, ETL, ML, data science" },
  { value: "design", label: "Design Produit", hint: "UX/UI, prototypage, design system" },
];

const AVAILABILITY = [
  { value: "remote", label: "100% remote", desc: "Travail entierement a distance" },
  { value: "hybrid", label: "Hybride", desc: "Remote + presence ponctuelle" },
  { value: "onsite", label: "Sur site", desc: "Presentiel client uniquement" },
];

const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Tous les champs obligatoires doivent etre remplis.",
  invalid_email: "L'adresse email saisie n'est pas valide. Verifiez le format.",
  invalid_category: "Categorie invalide. Selectionnez une categorie dans la liste.",
  insert_failed: "Une erreur technique a empeche l'inscription. Reessayez dans quelques instants.",
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error && SIGNUP_ERROR_MESSAGES[sp.error] ? SIGNUP_ERROR_MESSAGES[sp.error] : "";

  return (
    <>
      {/* Banner d'erreur (affichage si redirect avec ?error=...) */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div
            className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800"
            role="alert"
          >
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text="SIGNUP" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <span
                className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                [ SIGNUP ]
              </span>
              <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                Freelance tech
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
              Rejoignez
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                Workwave AI.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
              4 etapes pour creer votre profil. Inscription gratuite. Aucun
              engagement. L&apos;abonnement 29,90€/mois est uniquement requis
              pour repondre aux briefs.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FORM
          ═══════════════════════════════════════════════════════════════ */}
      <form
        action={submitInscription}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20"
      >
        <div className="max-w-3xl space-y-12 sm:space-y-16">
          {/* ───────── Step 01 — Identite ───────── */}
          <div>
            <SectionLabel index={1} total={4} label="Identite" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-8"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Qui etes-vous ?
            </h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    Prenom
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    required
                    className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    Nom
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    required
                    className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Email professionnel
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="vous@entreprise.fr"
                  className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                  autoComplete="email"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="github"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    GitHub <span className="text-[var(--ai-text-muted)] normal-case">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[var(--ai-text-tertiary)]">
                      github.com/
                    </span>
                    <input
                      id="github"
                      type="text"
                      name="github"
                      placeholder="votre-handle"
                      className="w-full h-12 pl-[110px] pr-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="linkedin"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    LinkedIn <span className="text-[var(--ai-text-muted)] normal-case">(optionnel)</span>
                  </label>
                  <input
                    id="linkedin"
                    type="url"
                    name="linkedin"
                    placeholder="https://linkedin.com/in/..."
                    className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ───────── Step 02 — Profil pro ───────── */}
          <div>
            <SectionLabel index={2} total={4} label="Profil pro" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Votre expertise.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Choisissez votre categorie principale. Vous pourrez en ajouter
              d&apos;autres apres l&apos;inscription.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className="group flex flex-col gap-2 p-5 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all"
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
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

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="skills"
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Competences <span className="text-[var(--ai-text-muted)] normal-case">(separez par des virgules)</span>
                </label>
                <input
                  id="skills"
                  type="text"
                  name="skills"
                  placeholder="React, TypeScript, Node.js, PostgreSQL..."
                  className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Bio courte <span className="text-[var(--ai-text-muted)] normal-case">(280 caracteres max)</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  maxLength={280}
                  placeholder="Decrivez en une phrase ce qui vous distingue. Ex : 'Dev full-stack React/Node 8 ans d'XP, specialise SaaS B2B et integrations IA.'"
                  className="w-full px-4 py-3 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* ───────── Step 03 — Disponibilite & tarif ───────── */}
          <div>
            <SectionLabel index={3} total={4} label="Disponibilite" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Vos conditions.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Indicatifs pour affichage sur votre fiche publique. Vous recevez
              en temps reel TOUS les projets tech publies — c&apos;est vous qui
              choisissez ceux qui vous interessent dans le dashboard.
              Modifiable a tout moment.
            </p>

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="tjmIndicatif"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    TJM indicatif
                  </label>
                  <div className="relative">
                    <input
                      id="tjmIndicatif"
                      type="number"
                      name="tjmIndicatif"
                      min="50"
                      max="3000"
                      step="50"
                      placeholder="Votre TJM"
                      className="w-full h-12 pl-4 pr-16 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[var(--ai-text-tertiary)]">
                      €/jour
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2 leading-relaxed">
                    Indicatif uniquement. Vous gardez la main pour repondre a
                    n&apos;importe quel projet, meme en dessous de ce tarif.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="experience"
                    className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                    style={{
                      letterSpacing: "0.18em",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    Annees d&apos;experience
                  </label>
                  <div className="relative">
                    <input
                      id="experience"
                      type="number"
                      name="experience"
                      min="0"
                      max="40"
                      placeholder="5"
                      className="w-full h-12 pl-4 pr-12 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[var(--ai-text-tertiary)]">
                      ans
                    </span>
                  </div>
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
                  Mode de travail
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AVAILABILITY.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex flex-col gap-1 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all"
                    >
                      <input
                        type="radio"
                        name="availability"
                        value={opt.value}
                        className="sr-only peer"
                      />
                      <span className="text-sm font-semibold text-[var(--ai-text)]">
                        {opt.label}
                      </span>
                      <span className="text-[12px] text-[var(--ai-text-secondary)]">
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{
                    letterSpacing: "0.18em",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  Localisation principale
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  placeholder="Paris, Lyon, Bordeaux, Berlin, Lisbonne..."
                  className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* ───────── Step 04 — Plan ───────── */}
          <div>
            <SectionLabel index={4} total={4} label="Votre plan" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Choisissez votre acces.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Modifiable a tout moment depuis votre dashboard. Aucun engagement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ─── Free plan ─── */}
              <label className="group relative flex flex-col p-7 bg-[var(--ai-bg-card)] border-2 border-[var(--ai-border-strong)] rounded-2xl cursor-pointer transition-all duration-200 has-[:checked]:border-[var(--ai-text)] has-[:checked]:ring-4 has-[:checked]:ring-[var(--ai-text)]/10 has-[:checked]:-translate-y-1 has-[:checked]:shadow-xl hover:-translate-y-0.5 hover:shadow-lg">
                <input
                  type="radio"
                  name="plan"
                  value="free"
                  defaultChecked
                  className="sr-only peer"
                />

                {/* Badge "✓ Selectionne" visible quand peer:checked */}
                <span className="absolute top-4 right-4 hidden peer-checked:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--ai-text)] text-white text-[11px] font-bold uppercase tracking-wider">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Selectionne
                </span>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-[var(--ai-text)] tracking-tight" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                    0€
                  </span>
                  <span className="text-sm text-[var(--ai-text-tertiary)]">/ illimite</span>
                </div>
                <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-5" style={{ letterSpacing: "0.18em" }}>
                  Plan Visibilite
                </p>
                <ul className="space-y-2.5 text-[13px] text-[var(--ai-text-secondary)] mb-7 flex-1">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                    Profil visible sur la plateforme
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                    Reception des briefs en read-only
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-text-muted)] mt-0.5">×</span>
                    <span className="text-[var(--ai-text-muted)]">Reponse aux briefs (necessite Premium)</span>
                  </li>
                </ul>

                {/* Gros bouton "Choisir ce plan" */}
                <span className="inline-flex items-center justify-center w-full h-12 text-[14px] font-bold rounded-lg bg-[var(--ai-bg-subtle)] text-[var(--ai-text)] border border-[var(--ai-border-strong)] peer-checked:bg-[var(--ai-text)] peer-checked:text-white peer-checked:border-[var(--ai-text)] transition-all">
                  <span className="peer-checked:hidden">Choisir ce plan</span>
                  <span className="hidden peer-checked:inline">Plan selectionne</span>
                </span>
              </label>

              {/* ─── Premium plan ─── */}
              <label className="group relative flex flex-col p-7 bg-[var(--ai-text)] text-white rounded-2xl cursor-pointer border-2 border-[var(--ai-text)] transition-all duration-200 overflow-hidden has-[:checked]:border-[var(--ai-accent)] has-[:checked]:ring-4 has-[:checked]:ring-[var(--ai-accent)]/20 has-[:checked]:-translate-y-1 has-[:checked]:shadow-2xl hover:-translate-y-0.5 hover:shadow-xl">
                {/* Grid pattern bg */}
                <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                <input
                  type="radio"
                  name="plan"
                  value="premium"
                  className="sr-only peer"
                />

                {/* Badge "Recommande" toujours visible top-right */}
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--ai-accent)] text-white text-[11px] font-bold uppercase tracking-wider z-10">
                  ★ Recommande
                </span>

                {/* Badge "✓ Selectionne" centered si checked */}
                <span className="absolute top-4 left-4 hidden peer-checked:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[var(--ai-text)] text-[11px] font-bold uppercase tracking-wider z-10">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Selectionne
                </span>

                <div className="relative z-10 mt-8 flex-1 flex flex-col">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                      29,90€
                    </span>
                    <span className="text-sm text-white/50">/ mois TTC</span>
                  </div>
                  <p className="text-[11px] uppercase font-semibold text-white/40 mb-5" style={{ letterSpacing: "0.18em" }}>
                    Plan Reponse illimitee
                  </p>
                  <ul className="space-y-2.5 text-[13px] text-white/80 mb-7 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                      Reponse a tous les briefs (sans credit)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                      Profil mis en avant dans les listings
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                      Badge Pro Workwave sur la fiche
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                      Resiliable en 1 clic, sans engagement
                    </li>
                  </ul>

                  {/* Gros bouton "Choisir ce plan" — orange premium */}
                  <span className="inline-flex items-center justify-center w-full h-12 text-[14px] font-bold rounded-lg bg-white/10 text-white border border-white/20 peer-checked:bg-[var(--ai-accent)] peer-checked:border-[var(--ai-accent)] transition-all">
                    <span className="peer-checked:hidden">Choisir ce plan</span>
                    <span className="hidden peer-checked:inline">Plan selectionne ★</span>
                  </span>
                </div>
              </label>
            </div>

            {/* Helper text */}
            <p className="text-[12px] text-[var(--ai-text-tertiary)] text-center mt-4">
              Cliquez sur la carte pour selectionner. Plan modifiable a tout moment depuis votre dashboard.
            </p>
          </div>

          {/* ───────── Honeypot anti-bot (champ visible aux bots, cache aux humains) ───────── */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
            <label htmlFor="hp_website_signup">Site web (ne pas remplir)</label>
            <input
              id="hp_website_signup"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* ───────── Footer form : CGU + submit ───────── */}
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
                  conditions generales d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link
                  href="/mentions-legales"
                  className="text-[var(--ai-text)] underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-accent)]"
                >
                  politique de confidentialite
                </Link>
                . Mon email peut etre utilise pour des notifications
                operationnelles uniquement.
              </span>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 text-[15px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              style={{ boxShadow: "var(--ai-shadow-sm)" }}
            >
              Creer mon compte freelance
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

            <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4">
              Deja inscrit ?{" "}
              <Link
                href="/ai/connexion"
                className="text-[var(--ai-text)] hover:text-[var(--ai-accent)] underline decoration-[var(--ai-border)] underline-offset-2 transition-colors font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
