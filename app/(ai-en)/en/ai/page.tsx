import type { Metadata } from "next";
import Link from "next/link";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt, { type MonumentName } from "@/components/ai/MonumentArt";
import { aiAlternates } from "@/lib/i18n/alternates";
import { formatTjmRange, formatMoney, convertFromEur } from "@/lib/i18n/format";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";

/**
 * Landing ANGLAISE Workwave AI (/en/ai) — Phase B i18n.
 *
 * Contenu anglais natif (pas une traduction mot-a-mot de la home FR) optimise
 * pour le SEO international (Europe, Golfe, Afrique anglophone, Moyen-Orient).
 * Reutilise le design system .ai-theme (light + accent orange peec.ai).
 *
 * hreflang reciproque avec /ai via aiAlternates. FAQPage schema via AiFaqSection.
 */

const SITE_URL = "https://www.workwaveai.co";

export const metadata: Metadata = {
  title:
    "Workwave AI — Hire vetted freelancers across Europe, the Gulf & beyond",
  description:
    "Post your project and reach a community of 100,000+ vetted freelancers — AI, development, cloud, data, design, marketing, finance, legal. Free to post, AI-matched in 24h, 0% commission. Europe, the Gulf, the Middle East and beyond.",
  alternates: aiAlternates({ fr: "/ai", en: "/en/ai", current: "en" }),
  openGraph: {
    title: "Workwave AI — Hire vetted freelancers, 0% commission",
    description:
      "Post your project, our AI alerts a community of 100,000+ freelancers across Europe and the Gulf. They contact you directly. Free to post, no commission.",
    url: `${SITE_URL}/en/ai`,
    siteName: "Workwave AI",
    locale: "en_US",
    type: "website",
  },
};

// ─────────────────────────────────────────────────────────────────────
// FAQ — questions strategiques SEO/AEO/GEO international
// ─────────────────────────────────────────────────────────────────────
const FAQ: FaqItem[] = [
  {
    q: "How does Workwave AI work?",
    a: "You describe your project in 60 seconds (category, context, budget, timeline). Our AI qualifies your request, then alerts the whole community of freelancers registered on Workwave in real time. Freelancers who match your need contact you directly by email or phone. No middleman, no commission, you stay in control of the conversation and the contract.",
  },
  {
    q: "Is Workwave AI free for clients?",
    a: "Yes, 100% free. Posting a project, being contacted by freelancers and signing a quote are all free on the client side. Workwave takes no commission on the engagement. Freelancers fund the platform through an optional Premium subscription that lets them respond to posted projects.",
  },
  {
    q: "Which countries does Workwave AI cover?",
    a: "Workwave AI connects clients and freelancers across Europe (UK, Germany, Netherlands, Ireland, Portugal, Spain, the Nordics and more), the Gulf and the Middle East (UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman) and francophone Africa. Most freelancers work remotely, so you can hire across borders. English is supported throughout the international experience.",
  },
  {
    q: "How is Workwave different from Upwork, Fiverr or Malt?",
    a: "Three key differences. (1) Community broadcast: your project is sent in real time to every relevant freelancer, who chooses to reach out — instead of you scrolling through endless profiles. (2) 0% commission on the engagement: you pay the freelancer directly, transparent pricing, versus 10–20% taken by most marketplaces. (3) A simple flat subscription model for freelancers instead of per-bid credits or rising fees. The result: a better price for you and for the freelancer.",
  },
  {
    q: "How fast will freelancers contact me?",
    a: "Within 24 hours in most cases, often within a few hours. As soon as a freelancer sees your project matching their skills, they can contact you directly. The clearer your brief (stack, budget, timeline, remote or on-site), the faster the right freelancers respond.",
  },
  {
    q: "How much does it cost to hire a freelance developer or AI expert?",
    a: "Day rates vary by skill, seniority and region. As a rough global benchmark: a senior web developer runs about $650–$900/day, a senior AI/ML engineer about $850–$1,300/day, a senior cloud/DevOps engineer about $800–$1,100/day. Rates in the Gulf and major European hubs trend higher. See our day-rate benchmark for a detailed, sourced breakdown.",
  },
  {
    q: "Do freelancers work remotely?",
    a: "Most do. Around 80% of our community works fully remote, which is the norm in tech since 2020, with the rest hybrid or on-site. You specify your constraints (location, on-site requirement, time zone) when you post — each freelancer sees those criteria and decides whether the project is a fit.",
  },
  {
    q: "I am a freelancer — how do I get clients on Workwave?",
    a: "Create your profile for free in a few minutes (bio, skills, day rate, portfolio, links). You will be alerted about new projects that match your skills. To reply to a client and win the engagement, you subscribe to Premium — a flat monthly fee with no per-bid credits and no commission on what you earn. Your profile and project alerts stay free.",
  },
];

// 14 categories (tech + business & creative). Liens vers les listings FR
// existants en Phase B ; deviendront /en/ai/[skill] en Phase C.
const CATEGORIES: { slug: string; label: string; desc: string }[] = [
  { slug: "intelligence-artificielle", label: "AI & Machine Learning", desc: "LLMs, RAG, agents, fine-tuning, computer vision" },
  { slug: "developpement-web", label: "Web Development", desc: "React, Next.js, Vue, full-stack, mobile" },
  { slug: "cloud-devops", label: "Cloud & DevOps", desc: "AWS, GCP, Azure, Kubernetes, Terraform" },
  { slug: "no-code-automation", label: "No-Code & Automation", desc: "Bubble, Make, Zapier, Airtable, Webflow" },
  { slug: "data-analytics", label: "Data & Analytics", desc: "BI, ETL, ML engineering, data science" },
  { slug: "design-produit", label: "Product Design", desc: "UX/UI, design systems, Figma, prototyping" },
  { slug: "marketing-communication", label: "Marketing & Communication", desc: "SEO, SEA, social, growth, content" },
  { slug: "design-creation", label: "Design & Creative", desc: "Branding, graphic design, illustration, print" },
  { slug: "strategie-management", label: "Strategy & Management", desc: "Consulting, transformation, ops" },
  { slug: "finance-comptabilite", label: "Finance & Accounting", desc: "Fractional CFO, controlling, accounting" },
  { slug: "rh-recrutement", label: "HR & Recruiting", desc: "Talent acquisition, training, payroll" },
  { slug: "juridique-conseil", label: "Legal & Consulting", desc: "Contracts, GDPR, IP, advisory" },
  { slug: "redaction-copywriting", label: "Writing & Copywriting", desc: "Ghostwriting, SEO, technical, scripts" },
  { slug: "audiovisuel-medias", label: "Audiovisual & Media", desc: "Editing, motion, photo, podcasts" },
];

// 3 etapes "How it works"
const STEPS = [
  {
    n: "01",
    title: "Describe your project",
    desc: "Tell us what you need in 60 seconds: skills, context, budget, timeline. No account required to start.",
  },
  {
    n: "02",
    title: "Our AI alerts the community",
    desc: "We qualify your brief and notify every freelancer whose skills match — across Europe, the Gulf and beyond, in real time.",
  },
  {
    n: "03",
    title: "Freelancers reach out to you",
    desc: "Matching freelancers contact you directly. You compare, choose and work together — with 0% commission from Workwave.",
  },
];

// Pourquoi Workwave (4 differentiators)
const VALUE_PROPS = [
  { title: "0% commission", desc: "You pay the freelancer directly. We never take a cut of the engagement." },
  { title: "Free to post", desc: "Posting a project and receiving offers is completely free for clients." },
  { title: "AI-matched in 24h", desc: "Your brief reaches the right freelancers in real time — most replies land within a day." },
  { title: "Vetted profiles", desc: "100,000+ registered freelancers with verified business identities." },
];

// TJM teaser — quelques skills, fourchette senior convertie en USD
const TJM_TEASER: { label: string; key: string }[] = [
  { label: "Web Development", key: "developpement-web" },
  { label: "AI / ML", key: "intelligence-artificielle" },
  { label: "Cloud & DevOps", key: "cloud-devops" },
  { label: "Data & Analytics", key: "data-analytics" },
  { label: "Product Design", key: "design-produit" },
  { label: "React", key: "react" },
];

// Coverage strip — villes + monuments line-art
const COVERAGE: { monument: MonumentName; region: string; cities: string }[] = [
  { monument: "dubai", region: "Gulf & Middle East", cities: "Dubai · Abu Dhabi · Riyadh · Doha · Manama" },
  { monument: "london", region: "Europe", cities: "London · Dublin · Amsterdam · Lisbon · Stockholm" },
  { monument: "paris", region: "France & Francophone", cities: "Paris · Brussels · Geneva · Casablanca · Dakar" },
];

export default function AiEnHomePage() {
  // Pricing multi-devise (donnee base EUR 29,90).
  const premiumEur = 29.9;
  const premiumUsd = formatMoney(Math.round(convertFromEur(premiumEur, "USD")), "USD", "en");
  const premiumAed = formatMoney(Math.round(convertFromEur(premiumEur, "AED")), "AED", "en");
  const premiumSar = formatMoney(Math.round(convertFromEur(premiumEur, "SAR")), "SAR", "en");

  // JSON-LD : Organization + WebSite + ItemList des categories
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Workwave AI",
    url: `${SITE_URL}/en/ai`,
    description:
      "Freelance marketplace connecting clients with vetted freelancers across Europe, the Gulf and beyond. 0% commission.",
    areaServed: ["Europe", "Middle East", "Africa"],
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Workwave AI",
    url: `${SITE_URL}/en/ai`,
    inLanguage: "en",
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Freelance categories on Workwave AI",
    itemListElement: CATEGORIES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      url: `${SITE_URL}/ai/${c.slug}`,
    })),
  };

  return (
    <>
      {/* ───────────────────────── [1] HERO ───────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Monument skyline watermark (accent orange, tres subtil) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 select-none"
          style={{ color: "var(--ai-accent)", opacity: 0.1 }}
        >
          <MonumentArt
            name="skyline-global"
            className="w-full h-[180px] sm:h-[240px] lg:h-[300px]"
            strokeWidth={1.25}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 lg:pt-28 pb-20 sm:pb-28">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span
              className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Europe · The Gulf · Beyond
            </span>
          </div>

          <h1
            className="font-black text-[var(--ai-text)] max-w-4xl"
            style={{
              fontSize: "clamp(40px, 7vw, 84px)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            Hire vetted freelancers
            <br />
            across Europe{" "}
            <span className="text-[var(--ai-accent)]">&amp; the Gulf.</span>
          </h1>

          <p className="mt-7 text-[17px] sm:text-[19px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            Post your project in 60 seconds. Our AI alerts a community of
            100,000+ freelancers — in AI, development, data, design, marketing
            and more. They reach out to you directly. 0% commission, free to
            post.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              href="/en/ai/deposer"
              className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              style={{ boxShadow: "var(--ai-shadow-sm)" }}
            >
              Post a project — it&rsquo;s free
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/ai/inscription"
              className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-text)] hover:bg-[var(--ai-primary-hover)] text-white transition-colors"
            >
              I&rsquo;m a freelancer — create my free profile
            </Link>
          </div>

          {/* Trust chips */}
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {["0% commission", "Free to post", "AI-matched in 24h", "100,000+ freelancers"].map((chip) => (
              <span key={chip} className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--ai-text-secondary)]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── [2] HOW IT WORKS ───────────────────── */}
      <section id="how-it-works" className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionLabel index={2} total={6} label="How it works" />
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-12 max-w-2xl" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}>
            Three steps. No middleman.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-7">
                <span className="text-[13px] font-bold text-[var(--ai-accent)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  {s.n}
                </span>
                <h3 className="mt-4 text-[19px] font-semibold text-[var(--ai-text)]">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ai-text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── [3] CATEGORIES ───────────────────── */}
      <section id="categories" className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionLabel index={3} total={6} label="Categories" />
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-3xl" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}>
            14 categories. One community.
          </h2>
          <p className="text-[15px] text-[var(--ai-text-secondary)] mb-12 max-w-2xl">
            From AI engineers to fractional CFOs — tech, business and creative talent, all in one place.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((c) => (
              <div key={c.slug} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-6 transition-colors hover:border-[var(--ai-border-strong)]">
                <h3 className="text-[16px] font-semibold text-[var(--ai-text)]">{c.label}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ai-text-tertiary)]">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/ai/freelances" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors">
              Browse all freelances
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── [4] COVERAGE (monuments) ───────────────── */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionLabel index={4} total={6} label="Coverage" />
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-12 max-w-2xl" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}>
            Talent without borders.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COVERAGE.map((c) => (
              <div key={c.region} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-7 overflow-hidden">
                <div className="h-20 mb-4" style={{ color: "var(--ai-accent)" }}>
                  <MonumentArt name={c.monument} className="h-full w-auto" strokeWidth={2} />
                </div>
                <h3 className="text-[17px] font-semibold text-[var(--ai-text)]">{c.region}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--ai-text-secondary)]">{c.cities}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── [5] FREELANCES + PRICING ─────────────── */}
      <section id="for-freelances" className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionLabel index={5} total={6} label="For freelancers" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h2 className="font-black uppercase text-[var(--ai-text)] mb-5" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}>
                Win clients,
                <br />
                keep 100%.
              </h2>
              <p className="text-[16px] leading-relaxed text-[var(--ai-text-secondary)] mb-6">
                Create a free profile, get alerted about projects that match your
                skills, and reach out to clients directly. Workwave never takes a
                commission on what you earn.
              </p>
              <div className="space-y-3 mb-8">
                {VALUE_PROPS.map((v) => (
                  <div key={v.title} className="flex items-start gap-3">
                    <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)] flex-shrink-0" />
                    <p className="text-[15px] text-[var(--ai-text-secondary)]">
                      <span className="font-semibold text-[var(--ai-text)]">{v.title}.</span> {v.desc}
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/ai/inscription" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors" style={{ boxShadow: "var(--ai-shadow-sm)" }}>
                Create my free profile
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Pricing card */}
            <div id="pricing" className="rounded-3xl border border-[var(--ai-border)] bg-[var(--ai-bg-card)] p-8 sm:p-10" style={{ boxShadow: "var(--ai-shadow-md)" }}>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]">Freelancer Premium</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[44px] font-black text-[var(--ai-text)] tracking-tight">{premiumUsd}</span>
                <span className="text-[15px] text-[var(--ai-text-secondary)]">/ month</span>
              </div>
              <p className="mt-1 text-[13px] text-[var(--ai-text-tertiary)]">
                Billed €29.90/mo · approx. {premiumAed} · {premiumSar}
              </p>
              <div className="my-7 h-px bg-[var(--ai-border-subtle)]" />
              <ul className="space-y-3 text-[15px] text-[var(--ai-text-secondary)]">
                {["Reply to unlimited matching projects", "No per-bid credits, no commission", "Profile & project alerts always free", "Cancel anytime"].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="mt-0.5 w-4 h-4 flex-shrink-0 text-[var(--ai-accent)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-[13px] text-[var(--ai-text-tertiary)]">
                Clients pay nothing — ever. Posting a project and hiring is 100% free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── [6] DAY-RATE BENCHMARK ─────────────── */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionLabel index={6} total={6} label="Day rates" />
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-2xl" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}>
            What freelancers charge.
          </h2>
          <p className="text-[15px] text-[var(--ai-text-secondary)] mb-12 max-w-2xl">
            Indicative senior day rates (USD, converted from EUR market data). For planning only — final rates depend on stack, scope and region.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TJM_TEASER.map((t) => {
              const ref = TJM_REFERENCE[t.key];
              if (!ref) return null;
              return (
                <div key={t.key} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6">
                  <p className="text-[14px] font-semibold text-[var(--ai-text)]">{t.label}</p>
                  <p className="mt-2 text-[18px] font-black text-[var(--ai-accent)] tracking-tight">
                    {formatTjmRange(ref.senior.min, ref.senior.max, "en")}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--ai-text-tertiary)]">senior level</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <AiFaqSection
        id="faq"
        title="FAQ"
        subtitle="Everything you need to know before posting a project or creating your profile."
        questions={FAQ}
        sectionLabel="FAQ"
      />

      {/* ───────────────────── FINAL CTA ───────────────────── */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="font-black uppercase text-white mx-auto max-w-3xl" style={{ fontSize: "clamp(32px, 6vw, 64px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}>
            Find your freelancer today.
          </h2>
          <p className="mt-6 text-[17px] text-white/60 max-w-xl mx-auto">
            Post your project for free. Get matched with the right talent across Europe, the Gulf and beyond in 24 hours.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/en/ai/deposer" className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors">
              Post a project — it&rsquo;s free
            </Link>
            <Link href="/ai/inscription" className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-semibold rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              Create my free profile
            </Link>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </>
  );
}

// Petit label de section reutilisable (style Pixel Rise).
function SectionLabel({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
        [ {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} ]
      </span>
      <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text)]">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
        {label}
      </span>
    </div>
  );
}
