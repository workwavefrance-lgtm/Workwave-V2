import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import SubmitButton from "@/components/ai/SubmitButton";
import { submitTechProject } from "@/app/(ai)/ai/deposer/actions";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";

/**
 * Page de depot de projet EN : /en/ai/deposer.
 *
 * Memes name/value que le form FR (app/(ai)/ai/deposer/page.tsx) => reutilise
 * le MEME Server Action submitTechProject. Un champ cache name="locale"=en
 * pilote les redirections (succes/erreur) vers /en/ai/deposer/*.
 *
 * Backend (qualif Claude, broadcast freelances, mail admin) 100% partage.
 */

export const metadata: Metadata = {
  title: "Post a tech project — Workwave AI",
  description:
    "Post your tech project in 4 steps. We alert our whole freelance community in real time. Replies in under 24h, free, no commission.",
  alternates: aiAlternatesEnOnly("/en/ai/deposer"),
};

const CATEGORIES = [
  { value: "ia", label: "Artificial Intelligence", hint: "LLM, RAG, agents, vision, fine-tuning" },
  { value: "dev", label: "Web Development", hint: "React, Next.js, mobile, full-stack, e-commerce" },
  { value: "cloud", label: "Cloud & DevOps", hint: "AWS, GCP, Azure, Kubernetes, CI/CD" },
  { value: "nocode", label: "No-Code & Automation", hint: "Bubble, Make, Zapier, Airtable, Webflow" },
  { value: "data", label: "Data & Analytics", hint: "BI, ETL, ML engineering, data science" },
  { value: "design", label: "Product Design", hint: "UX/UI, prototyping, design systems, Figma" },
];

const BUDGETS = [
  { value: "lt5k", label: "< €5K", desc: "Short mission or MVP" },
  { value: "5k-15k", label: "€5 — 15K", desc: "Mid-size project" },
  { value: "15k-50k", label: "€15 — 50K", desc: "Full build" },
  { value: "gt50k", label: "> €50K", desc: "Long-term or team" },
  { value: "tbd", label: "To define", desc: "Let's discuss" },
];

const TIMELINES = [
  { value: "asap", label: "Immediate", desc: "Within 1 week" },
  { value: "1month", label: "Within 1 month", desc: "Gradual start" },
  { value: "3months", label: "1 to 3 months", desc: "Planned" },
  { value: "flexible", label: "Flexible", desc: "No constraint" },
];

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "All required fields must be filled in.",
  invalid_email: "The email address is invalid. Please check the format.",
  invalid_category: "Invalid category. Please select one from the list.",
  category_not_found: "Category not found. Please try again or contact support.",
  insert_failed: "A technical error prevented saving your project. Please try again shortly.",
};

const INPUT_CLS =
  "w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all";
const FIELD_LABEL_CLS =
  "block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2";
const FIELD_LABEL_STYLE = {
  letterSpacing: "0.18em",
  fontFamily: "var(--font-geist-mono), monospace",
} as const;

export default async function DeposerEnPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error && ERROR_MESSAGES[sp.error] ? ERROR_MESSAGES[sp.error] : "";

  return (
    <>
      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800" role="alert">
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text="PROJECT" position="bottom" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                [ NEW PROJECT ]
              </span>
              <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                Reply &lt; 24h
              </span>
            </div>
            <h1 className="font-black text-[var(--ai-text)] uppercase mb-6" style={{ fontSize: "clamp(40px, 7vw, 80px)", lineHeight: 0.95, letterSpacing: "-0.05em" }}>
              Describe
              <br />
              <span className="text-[var(--ai-text-tertiary)]">your project.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
              4 steps, 60 seconds. We alert our whole freelance community in real time — interested profiles contact you directly. Free, no strings, no commission.
            </p>
          </div>
        </div>
      </section>

      {/* FORM */}
      <form action={submitTechProject} className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        {/* Locale => redirections /en/ai/deposer/* */}
        <input type="hidden" name="locale" value="en" />

        <div className="max-w-3xl space-y-12 sm:space-y-16">
          {/* Step 01 — Category */}
          <div>
            <SectionLabel index={1} total={4} label="Category" />
            <h2 className="font-black text-[var(--ai-text)] uppercase mb-3" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              What kind of project?
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Pick the category that fits best. You can add detail in the next step.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <label key={cat.value} className="group flex flex-col gap-2 p-5 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all">
                  <input type="radio" name="category" value={cat.value} required className="sr-only peer" />
                  <div className="flex items-center gap-3">
                    <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-5 h-5" aria-hidden="true">
                      <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                      <div className="bg-[var(--ai-text)] rounded-[1px]" />
                      <div className="bg-[var(--ai-text)] rounded-[1px]" />
                      <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--ai-text)]">{cat.label}</span>
                  </div>
                  <span className="text-[12px] text-[var(--ai-text-secondary)] leading-relaxed pl-8">{cat.hint}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 02 — Your project */}
          <div>
            <SectionLabel index={2} total={4} label="Your project" />
            <h2 className="font-black text-[var(--ai-text)] uppercase mb-3" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              Describe the context.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              The clearer your brief (tech, context, constraints), the faster the right freelancers reply.
            </p>
            <div className="space-y-5">
              <div>
                <label htmlFor="title" className={FIELD_LABEL_CLS} style={FIELD_LABEL_STYLE}>Project title</label>
                <input id="title" type="text" name="title" required maxLength={200} placeholder="e.g. Rebuild of our React Native mobile app" className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="description" className={FIELD_LABEL_CLS} style={FIELD_LABEL_STYLE}>Detailed description</label>
                <textarea id="description" name="description" required rows={8} maxLength={5000} placeholder="Describe your project context, goals, technical constraints and expected scope. Be specific: it's what lets us pick the right profiles." className="w-full px-4 py-3 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all resize-y" />
                <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2">At least 100 characters recommended so the right profiles engage.</p>
              </div>
              <div>
                <label htmlFor="stack" className={FIELD_LABEL_CLS} style={FIELD_LABEL_STYLE}>
                  Preferred tech stack <span className="text-[var(--ai-text-muted)] normal-case">(optional)</span>
                </label>
                <input id="stack" type="text" name="stack" placeholder="React, Next.js, PostgreSQL, AWS..." className={INPUT_CLS} />
              </div>
            </div>
          </div>

          {/* Step 03 — Budget & timeline */}
          <div>
            <SectionLabel index={3} total={4} label="Budget" />
            <h2 className="font-black text-[var(--ai-text)] uppercase mb-3" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              Budget &amp; timeline.
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Signals to match compatible profiles. No commitment — you negotiate directly with the freelancer.
            </p>
            <div className="space-y-8">
              <div>
                <span className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3" style={FIELD_LABEL_STYLE}>Estimated budget</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {BUDGETS.map((opt) => (
                    <label key={opt.value} className="flex flex-col gap-1 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all text-center">
                      <input type="radio" name="budget" value={opt.value} required className="sr-only peer" />
                      <span className="text-sm font-semibold text-[var(--ai-text)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{opt.label}</span>
                      <span className="text-[11px] text-[var(--ai-text-secondary)] leading-tight">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3" style={FIELD_LABEL_STYLE}>Preferred timeline</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIMELINES.map((opt) => (
                    <label key={opt.value} className="flex flex-col gap-1 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all text-center">
                      <input type="radio" name="timeline" value={opt.value} required className="sr-only peer" />
                      <span className="text-sm font-semibold text-[var(--ai-text)]">{opt.label}</span>
                      <span className="text-[11px] text-[var(--ai-text-secondary)] leading-tight">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="remoteOk" className="mt-1 w-4 h-4 rounded border-[var(--ai-border-strong)] text-[var(--ai-accent)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] cursor-pointer" />
                <span className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
                  <span className="font-semibold text-[var(--ai-text)]">Remote OK</span> — I accept fully remote freelancers (recommended to widen matching).
                </span>
              </label>
            </div>
          </div>

          {/* Step 04 — Contact */}
          <div>
            <SectionLabel index={4} total={4} label="You" />
            <h2 className="font-black text-[var(--ai-text)] uppercase mb-3" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              How can we reach you?
            </h2>
            <p className="text-sm text-[var(--ai-text-secondary)] mb-8">
              Your details are only visible to Premium freelancers in our community. Never published, never resold.
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contactName" className={FIELD_LABEL_CLS} style={FIELD_LABEL_STYLE}>Full name</label>
                  <input id="contactName" type="text" name="contactName" required maxLength={100} autoComplete="name" className={INPUT_CLS} />
                </div>
                <div>
                  <label htmlFor="company" className={FIELD_LABEL_CLS} style={FIELD_LABEL_STYLE}>
                    Company <span className="text-[var(--ai-text-muted)] normal-case">(optional)</span>
                  </label>
                  <input id="company" type="text" name="company" maxLength={150} autoComplete="organization" className={INPUT_CLS} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contactEmail" className={FIELD_LABEL_CLS} style={FIELD_LABEL_STYLE}>Email</label>
                  <input id="contactEmail" type="email" name="contactEmail" required maxLength={200} placeholder="you@company.com" className={INPUT_CLS} autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="contactPhone" className={FIELD_LABEL_CLS} style={FIELD_LABEL_STYLE}>
                    Phone <span className="text-[var(--ai-text-muted)] normal-case">(optional)</span>
                  </label>
                  <input id="contactPhone" type="tel" name="contactPhone" maxLength={30} autoComplete="tel" placeholder="+971 50 123 4567" className={INPUT_CLS} />
                </div>
              </div>
            </div>
          </div>

          {/* Honeypot anti-bot */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
            <label htmlFor="hp_website">Website (do not fill)</label>
            <input id="hp_website" type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {/* Submit */}
          <div className="border-t border-[var(--ai-border-subtle)] pt-10">
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input type="checkbox" name="cgu" required className="mt-1 w-4 h-4 rounded border-[var(--ai-border-strong)] text-[var(--ai-accent)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] cursor-pointer" />
              <span className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
                I accept the{" "}
                <Link href="/cgu" className="text-[var(--ai-text)] underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-accent)]">terms</Link>{" "}
                and that my details be shared with Premium freelancers in the Workwave AI community. No other sharing.
              </span>
            </label>
            <SubmitButton pendingText="Posting..." className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 text-[15px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors" style={{ boxShadow: "var(--ai-shadow-sm)" }}>
              <span className="inline-flex items-center">
                Post my project
                <svg className="ml-2 w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </SubmitButton>
            <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4 leading-relaxed max-w-md">
              No fees. No commission. You negotiate directly with the freelancer. Workwave is simply an intermediary.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
