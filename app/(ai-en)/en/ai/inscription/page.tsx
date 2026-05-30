import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import SubmitButton from "@/components/ai/SubmitButton";
import { submitInscription } from "@/app/(ai)/ai/inscription/actions";

/**
 * Signup page EN : /en/ai/inscription.
 *
 * Memes name/value que le form FR (app/(ai)/ai/inscription/page.tsx) => reutilise
 * le MEME Server Action submitInscription. Un champ cache name="locale"=en pilote
 * les redirections (succes/erreur) vers /en/ai/*.
 *
 * EN = PLAN GRATUIT UNIQUEMENT. La carte/step "plan premium" est retiree et
 * remplacee par un seul <input type="hidden" name="plan" value="free" />. La
 * branche Stripe de l'action ne se declenche que si plan=premium (cf. actions.ts).
 *
 * noindex : ces pages ne sont pas SEO (auth tunnel).
 */

export const metadata: Metadata = {
  title: "Join as a freelancer — Workwave AI",
  description:
    "Create your freelancer profile on Workwave AI in 4 steps (tech, marketing, finance, legal, HR, design, creative, media). Free to join. Receive every project posted in your vertical in real time.",
  robots: { index: false, follow: false },
};

const CATEGORIES = [
  // Tech (6)
  { value: "ia", label: "Artificial Intelligence", hint: "LLM, RAG, agents, fine-tuning" },
  { value: "dev", label: "Web Development", hint: "React, Next.js, mobile, full-stack" },
  { value: "cloud", label: "Cloud & DevOps", hint: "AWS, GCP, Azure, K8s, CI/CD" },
  { value: "nocode", label: "No-Code & Automation", hint: "Bubble, Make, Zapier, Webflow" },
  { value: "data", label: "Data & Analytics", hint: "BI, ETL, ML, data science" },
  { value: "design", label: "Product Design", hint: "UX/UI, prototyping, design systems" },
  // Business (5)
  { value: "marketing", label: "Marketing & Communication", hint: "SEO, SEA, social, growth, content" },
  { value: "strategie", label: "Strategy & Management", hint: "Consulting, transformation, ops" },
  { value: "finance", label: "Finance & Accounting", hint: "CFO, controlling, advisory" },
  { value: "juridique", label: "Legal & Advisory", hint: "Lawyers, contracts, GDPR" },
  { value: "rh", label: "HR & Recruitment", hint: "Talent, training, payroll" },
  // Creative (3)
  { value: "redaction", label: "Writing & Copywriting", hint: "Ghostwriting, SEO, scripts" },
  { value: "audiovisuel", label: "Audiovisual & Media", hint: "Editing, motion, photo, podcasts" },
  { value: "creation", label: "Design & Creative", hint: "Graphic design, branding, illustration" },
];

const AVAILABILITY = [
  { value: "remote", label: "100% remote", desc: "Fully remote work" },
  { value: "hybrid", label: "Hybrid", desc: "Remote + occasional on-site" },
  { value: "onsite", label: "On-site", desc: "Client premises only" },
];

const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "All required fields must be filled in.",
  invalid_email: "The email address is invalid. Please check the format.",
  invalid_category: "Invalid category. Please select one from the list.",
  insert_failed: "A technical error prevented signup. Please try again shortly.",
};

export default async function InscriptionEnPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error && SIGNUP_ERROR_MESSAGES[sp.error] ? SIGNUP_ERROR_MESSAGES[sp.error] : "";

  return (
    <>
      {/* Error banner (shown if redirected with ?error=...) */}
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
              Join
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                Workwave AI.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
              4 steps to create your profile. Free to join. No commitment. Get
              every tech project posted, in real time, the moment it lands.
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
        {/* Locale => redirections /en/ai/* */}
        <input type="hidden" name="locale" value="en" />
        {/* EN = plan gratuit uniquement (rend la branche Stripe inerte) */}
        <input type="hidden" name="plan" value="free" />

        <div className="max-w-3xl space-y-12 sm:space-y-16">
          {/* ───────── Step 01 — Identity ───────── */}
          <div>
            <SectionLabel index={1} total={3} label="Identity" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-8"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Who are you?
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
                    First name
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
                    Last name
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
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
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
                    GitHub <span className="text-[var(--ai-text-muted)] normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[var(--ai-text-tertiary)]">
                      github.com/
                    </span>
                    <input
                      id="github"
                      type="text"
                      name="github"
                      placeholder="your-handle"
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
                    LinkedIn <span className="text-[var(--ai-text-muted)] normal-case">(optional)</span>
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

          {/* ───────── Step 02 — Pro profile ───────── */}
          <div>
            <SectionLabel index={2} total={3} label="Pro profile" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Your expertise.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Pick your main category. You can add more after signing up.
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
                  Skills <span className="text-[var(--ai-text-muted)] normal-case">(comma-separated)</span>
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
                  Short bio <span className="text-[var(--ai-text-muted)] normal-case">(280 characters max)</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  maxLength={280}
                  placeholder="Describe in one sentence what sets you apart. E.g. 'Full-stack React/Node dev, 8 yrs XP, focused on B2B SaaS and AI integrations.'"
                  className="w-full px-4 py-3 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* ───────── Step 03 — Availability & rate ───────── */}
          <div>
            <SectionLabel index={3} total={3} label="Availability" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Your terms.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Indicative only, shown on your public profile. You receive EVERY
              tech project posted, in real time — you decide which ones interest
              you from your dashboard. Editable anytime.
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
                    Indicative day rate
                  </label>
                  <div className="relative">
                    <input
                      id="tjmIndicatif"
                      type="number"
                      name="tjmIndicatif"
                      min="50"
                      max="3000"
                      step="50"
                      placeholder="Your day rate"
                      className="w-full h-12 pl-4 pr-16 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[var(--ai-text-tertiary)]">
                      €/day
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2 leading-relaxed">
                    Indicative only. You stay free to reply to any project, even
                    below this rate.
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
                    Years of experience
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
                      yrs
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
                  Work mode
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
                  Main location
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  placeholder="Dubai, London, Lisbon, Berlin, Paris..."
                  className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* ───────── Honeypot anti-bot (visible aux bots, cache aux humains) ───────── */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
            <label htmlFor="hp_website_signup">Website (do not fill)</label>
            <input
              id="hp_website_signup"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* ───────── Form footer : terms + submit ───────── */}
          <div className="border-t border-[var(--ai-border-subtle)] pt-10">
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                name="cgu"
                required
                className="mt-1 w-4 h-4 rounded border-[var(--ai-border-strong)] text-[var(--ai-accent)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] cursor-pointer"
              />
              <span className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
                I accept the{" "}
                <Link
                  href="/cgu"
                  className="text-[var(--ai-text)] underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-accent)]"
                >
                  terms of use
                </Link>{" "}
                and the{" "}
                <Link
                  href="/mentions-legales"
                  className="text-[var(--ai-text)] underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-accent)]"
                >
                  privacy policy
                </Link>
                . My email may be used for operational notifications only.
              </span>
            </label>

            <SubmitButton
              pendingText="Creating account..."
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 text-[15px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              style={{ boxShadow: "var(--ai-shadow-sm)" }}
            >
              <span className="inline-flex items-center">
                Create my freelancer account
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
              </span>
            </SubmitButton>

            <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4">
              Already registered?{" "}
              <Link
                href="/en/ai/connexion"
                className="text-[var(--ai-text)] hover:text-[var(--ai-accent)] underline decoration-[var(--ai-border)] underline-offset-2 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
