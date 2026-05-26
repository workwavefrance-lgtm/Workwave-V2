import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public-client";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import {
  getInitials,
  getAvatarStyle,
  getThemeColor,
  getThemeColorHover,
  getBadges,
  monthsSince,
} from "@/lib/ai/personalisation";

export const revalidate = 21600; // ISR 6h

import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

// Alias retro-compat : ne pas casser les references internes a TECH_CATEGORY_IDS
// dans le code historique. Maintenant = 14 cats (tech + business/creatif).
const TECH_CATEGORY_IDS = AI_CATEGORY_IDS;

type FreelancePageProps = {
  params: Promise<{ slug: string }>;
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (["de", "du", "des", "la", "le", "les", "el", "y", "et"].includes(w))
        return w;
      if (w.includes("-")) {
        return w
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("-");
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function getFirstName(fullName: string): string {
  const titled = titleCase(fullName);
  const tokens = titled.split(" ").filter((t) => t.length > 1);
  // Convention FR : si tout en CAPS, le 1er est probablement le nom
  // Ici fullName arrive deja titlecase via titleCase, donc 1er = prenom
  return tokens[0] || titled;
}

async function fetchPro(slug: string) {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("pros")
    .select(
      "id, name, slug, siret, postal_code, address, years_experience, github_username, linkedin, description, skills, hourly_rate, available_for_remote, claimed_by_user_id, claimed_at, subscription_product, subscription_status, founding_date, etat_admin, category_id, source, avatar_color, theme_color, created_at, categories(slug, name, description, vertical), cities(name, slug, postal_code)"
    )
    .eq("slug", slug)
    .in("category_id", TECH_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

// ─── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: FreelancePageProps): Promise<Metadata> {
  const { slug } = await params;
  const pro = await fetchPro(slug);
  if (!pro) {
    return {
      title: "Freelance introuvable — Workwave AI",
      robots: { index: false, follow: false },
    };
  }
  const name = titleCase(pro.name);
  const category = Array.isArray(pro.categories) ? pro.categories[0] : pro.categories;
  const city = Array.isArray(pro.cities) ? pro.cities[0] : pro.cities;
  const cityName = city?.name ? titleCase(city.name) : "France";

  return {
    title: `${name} — Freelance ${category?.name || "Tech"} a ${cityName} — Workwave AI`,
    description: `${name}, freelance ${(category?.name || "tech").toLowerCase()} a ${cityName}.${
      pro.years_experience && pro.years_experience > 0 && pro.years_experience <= 50 ? ` ${pro.years_experience} ans d'experience.` : ""
    } Contactez via Workwave AI : publiez votre projet, alertez la communaute. Sans credit, sans commission.`,
    alternates: { canonical: `/ai/freelance/${pro.slug}` },
    openGraph: {
      title: `${name} — Freelance ${category?.name || "Tech"} a ${cityName}`,
      url: `/ai/freelance/${pro.slug}`,
      type: "profile",
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function FreelancePage({ params }: FreelancePageProps) {
  const { slug } = await params;
  const pro = await fetchPro(slug);
  if (!pro) notFound();

  const displayName = titleCase(pro.name);
  const firstName = getFirstName(displayName);
  const initials = getInitials(displayName);
  const category = Array.isArray(pro.categories) ? pro.categories[0] : pro.categories;
  const city = Array.isArray(pro.cities) ? pro.cities[0] : pro.cities;
  const cityName = city?.name ? titleCase(city.name) : null;

  // Phase 12 — personnalisation : avatar + theme color + badges
  const avatarStyle = getAvatarStyle(pro.avatar_color);
  const themeMain = getThemeColor(pro.theme_color);
  const themeHover = getThemeColorHover(pro.theme_color);
  const monthsClaimed = monthsSince(pro.claimed_at) ?? undefined;
  const badges = getBadges(pro, {
    monthsSinceSubscription: monthsClaimed,
    monthsSinceClaim: monthsClaimed,
  });

  // Schema.org Person
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: `${baseUrl}/ai/freelance/${pro.slug}`,
    jobTitle: `Freelance ${category?.name || "Tech"}`,
    address: cityName
      ? {
          "@type": "PostalAddress",
          addressLocality: cityName,
          postalCode: pro.postal_code || undefined,
          addressCountry: "FR",
        }
      : undefined,
    sameAs: pro.github_username
      ? [`https://github.com/${pro.github_username}`]
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1/3 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text="PROFIL" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)] mb-8"
            aria-label="Fil d'Ariane"
          >
            <Link href="/ai" className="hover:text-[var(--ai-text)] transition-colors">
              Workwave AI
            </Link>
            <span>/</span>
            {category && (
              <>
                <Link
                  href={`/ai/${category.slug}`}
                  className="hover:text-[var(--ai-text)] transition-colors"
                >
                  {category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-[var(--ai-text)]">{displayName}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8">
              <SectionLabel index={1} total={3} label="Freelance tech" />

              {/* Avatar perso (Phase 12 cool/fun) */}
              <div
                className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl font-black text-[28px] sm:text-[34px] mb-6 shadow-lg"
                style={{
                  ...avatarStyle,
                  boxShadow: `0 16px 40px -12px ${themeMain}66`,
                }}
                aria-hidden="true"
              >
                {initials}
              </div>

              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(36px, 6.5vw, 80px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                  wordBreak: "break-word",
                }}
              >
                {displayName}
              </h1>

              {/* Badges achievements (Phase 12) */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {badges.map((b) => (
                    <span
                      key={b.kind}
                      title={b.description}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full"
                      style={{
                        background: `${themeMain}15`,
                        color: themeHover,
                        border: `1px solid ${themeMain}33`,
                      }}
                    >
                      <span aria-hidden="true">{b.emoji}</span>
                      <span>{b.label}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Meta inline */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--ai-text-secondary)] mb-8">
                {category && (
                  <Link
                    href={`/ai/${category.slug}`}
                    className="inline-flex items-center gap-2 hover:text-[var(--ai-text)] transition-colors"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                    {category.name}
                  </Link>
                )}
                {cityName && (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 text-[var(--ai-text-tertiary)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 22s-8-7-8-13a8 8 0 0 1 16 0c0 6-8 13-8 13z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {cityName}
                    {pro.postal_code && (
                      <span className="text-[var(--ai-text-tertiary)]">· {pro.postal_code}</span>
                    )}
                  </span>
                )}
                {pro.years_experience != null && pro.years_experience > 0 && pro.years_experience <= 50 && (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 text-[var(--ai-text-tertiary)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {pro.years_experience} ans d&apos;experience
                  </span>
                )}
                {pro.github_username && (
                  <a
                    href={`https://github.com/${pro.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 text-[var(--ai-accent)] hover:text-[var(--ai-accent-hover)] font-medium"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    @{pro.github_username}
                  </a>
                )}
              </div>

              {/* Description placeholder (profil non revendique) */}
              <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 sm:p-8 max-w-2xl">
                <p
                  className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    letterSpacing: "0.2em",
                  }}
                >
                  {"// Profil minimal"}
                </p>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                  Cette fiche est une base SIRENE non revendiquee.{" "}
                  {firstName} n&apos;a pas encore complete son profil (bio,
                  competences detaillees, portfolio). Vous pouvez{" "}
                  <Link
                    href="/ai/deposer"
                    className="text-[var(--ai-text)] font-semibold underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-accent)] transition-colors"
                  >
                    deposer votre projet
                  </Link>{" "}
                  — notre IA verifiera si {firstName} est un bon match et le
                  contactera directement.
                </p>
              </div>
            </div>

            {/* Stat block droite */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card abonnement / claim */}
              <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-2xl p-6">
                <p
                  className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                  style={{ letterSpacing: "0.18em" }}
                >
                  Vous etes {firstName} ?
                </p>
                <p className="text-sm text-[var(--ai-text)] font-semibold mb-4 leading-snug">
                  Reclamez votre fiche gratuitement
                </p>
                <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-5">
                  Completez votre bio, ajoutez vos competences, recevez les
                  briefs qui vous matchent. Inscription gratuite.
                </p>
                <Link
                  href={`/ai/inscription?siret=${pro.siret}`}
                  className="inline-flex items-center justify-center w-full h-11 px-5 text-[14px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
                >
                  Reclamer ma fiche
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

              {/* Identite SIRENE */}
              <div className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-6">
                <p
                  className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    letterSpacing: "0.2em",
                  }}
                >
                  {"// Identite SIRENE"}
                </p>
                <dl className="space-y-3 text-[13px]">
                  <div>
                    <dt className="text-[var(--ai-text-tertiary)] mb-0.5">SIRET</dt>
                    <dd
                      className="text-[var(--ai-text)] font-medium"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    >
                      {pro.siret}
                    </dd>
                  </div>
                  {pro.founding_date && (
                    <div>
                      <dt className="text-[var(--ai-text-tertiary)] mb-0.5">Creation</dt>
                      <dd
                        className="text-[var(--ai-text)] font-medium"
                        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      >
                        {new Date(pro.founding_date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                        })}
                      </dd>
                    </div>
                  )}
                  {pro.address && (
                    <div>
                      <dt className="text-[var(--ai-text-tertiary)] mb-0.5">Adresse</dt>
                      <dd className="text-[var(--ai-text-secondary)] text-[12px] leading-snug">
                        {pro.address}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2/3 — COMPETENCES (placeholder)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-3xl">
            <SectionLabel index={2} total={3} label="Expertise" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-6"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              {category?.name || "Tech"}
            </h2>
            {category?.description && (
              <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-8">
                {category.description}
              </p>
            )}

            {/* Hint vers GitHub si disponible */}
            {pro.github_username ? (
              <div className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 max-w-2xl">
                <p
                  className="text-[11px] uppercase font-semibold text-[var(--ai-accent)] mb-3"
                  style={{ letterSpacing: "0.18em" }}
                >
                  ● Code public
                </p>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed mb-4">
                  {firstName} publie son code sur GitHub. Vous pouvez parcourir
                  ses repos pour evaluer la qualite et le style.
                </p>
                <a
                  href={`https://github.com/${pro.github_username}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  github.com/{pro.github_username}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M7 17L17 7M17 7H9M17 7V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 max-w-2xl">
                <p
                  className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    letterSpacing: "0.2em",
                  }}
                >
                  {"// Profil non-enrichi"}
                </p>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                  Competences techniques detaillees, stack maitrise, portfolio
                  et historique de projets apparaitront ici une fois que{" "}
                  {firstName} aura revendique sa fiche.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3/3 — CTA TRAVAILLER AVEC X
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)] relative overflow-hidden">
        <Watermark text="MATCH" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <SectionLabel index={3} total={3} label="CTA" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-6"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              Travailler avec
              <br />
              <span className="text-[var(--ai-text-tertiary)]">{firstName}.</span>
            </h2>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] leading-relaxed mb-8">
              Decrivez votre projet — notre IA verifie si {firstName} est
              compatible (dispo, TJM, expertise) et le contacte si oui.
              Sinon, d&apos;autres freelances de la communaute vous contacteront directement.
              Gratuit, sans engagement.
            </p>

            <Link
              href="/ai/deposer"
              className="group inline-flex items-stretch bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all duration-200 max-w-2xl"
              style={{ boxShadow: "var(--ai-shadow-md)" }}
            >
              <div className="flex-1 flex items-center gap-3 px-5 py-4">
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
                  Decrivez votre projet en 60s
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[var(--ai-accent)] group-hover:bg-[var(--ai-accent-hover)] text-white px-6 sm:px-7 py-4 transition-colors duration-200">
                <span className="text-[14px] font-semibold whitespace-nowrap tracking-tight">
                  Deposer un projet
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

            <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4">
              Aucune commission, vous negociez directement avec {firstName}.
              Workwave est un simple intermediaire d&apos;information.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
