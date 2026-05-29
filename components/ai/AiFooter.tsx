"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { en } from "@/lib/i18n/en";

/**
 * Footer minimaliste Workwave AI (style peec.ai), bilingue (FR + EN).
 *
 * Locale deduite du pathname (routes EN sous /en/ai/*). Branche FR inchangee
 * (zero regression), branche EN via le dictionnaire anglais.
 *
 * Hide sur /ai/dashboard pour ne pas confuser l'experience freelance.
 */
export default function AiFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/ai/dashboard")) return null;

  const year = new Date().getFullYear();
  const isEn = pathname.startsWith("/en/ai");

  const homeHref = isEn ? "/en/ai" : "/ai";

  const t = isEn
    ? {
        tagline: en.footer.tagline,
        clients: en.footer.clients,
        freelances: en.footer.freelances,
        company: en.footer.company,
        postProject: en.footer.postProject,
        findFreelance: en.footer.findFreelance,
        howItWorks: en.footer.howItWorks,
        whyUs: en.footer.whyUs,
        pricing: en.footer.pricing,
        signup: en.footer.signup,
        login: en.footer.login,
        about: en.footer.about,
        terms: en.footer.terms,
        legal: en.footer.legal,
        contact: en.footer.contact,
        rights: en.footer.rights,
        btpQuestion: en.footer.btpQuestion,
        // hrefs EN
        findFreelanceHref: "/ai/freelances",
        howItWorksHref: "/en/ai#how-it-works",
        whyUsHref: "/en/ai#for-freelances",
        pricingHref: "/en/ai#pricing",
        postProjectHref: "/en/ai/deposer",
      }
    : {
        tagline:
          "Plateforme de mise en relation entre porteurs de projet tech et freelances IA, dev, cloud, no-code, data, design.",
        clients: "Clients",
        freelances: "Freelances",
        company: "Workwave",
        postProject: "Déposer un projet",
        findFreelance: "Trouver un freelance",
        howItWorks: "Comment ça marche",
        whyUs: "Pourquoi nous",
        pricing: "Tarifs",
        signup: "S'inscrire",
        login: "Connexion",
        about: "À propos",
        terms: "CGU",
        legal: "Mentions légales",
        contact: "Contact",
        rights: "Tous droits réservés.",
        btpQuestion: "Vous cherchez un artisan BTP ?",
        // hrefs FR (inchanges)
        findFreelanceHref: "/ai",
        howItWorksHref: "/ai#methode",
        whyUsHref: "/ai/pour-les-freelances",
        pricingHref: "/ai/tarifs",
        postProjectHref: "/ai/deposer",
      };

  return (
    <footer
      className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] mt-24"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Colonne 1 : Workwave AI */}
          <div className="col-span-2 sm:col-span-1">
            <Link href={homeHref} className="flex items-center gap-2.5 mb-4 group">
              <div
                className="grid grid-cols-2 grid-rows-2 gap-[2px] w-7 h-7 transition-transform duration-200 group-hover:rotate-90"
                aria-hidden="true"
              >
                <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                <div className="bg-[var(--ai-text)] rounded-[2px]" />
                <div className="bg-[var(--ai-text)] rounded-[2px]" />
                <div className="bg-[var(--ai-accent)] rounded-[2px]" />
              </div>
              <span className="text-[15px] font-semibold text-[var(--ai-text)] tracking-tight">
                Workwave <span className="text-[var(--ai-text-tertiary)] font-medium">AI</span>
              </span>
            </Link>
            <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
              {t.tagline}
            </p>
          </div>

          {/* Colonne 2 : Pour les clients */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider mb-3">
              {t.clients}
            </p>
            <ul className="space-y-2 text-[13px] text-[var(--ai-text-secondary)]">
              <li>
                <Link href={t.postProjectHref} className="hover:text-[var(--ai-text)] transition-colors">
                  {t.postProject}
                </Link>
              </li>
              <li>
                <Link href={t.findFreelanceHref} className="hover:text-[var(--ai-text)] transition-colors">
                  {t.findFreelance}
                </Link>
              </li>
              <li>
                <Link href={t.howItWorksHref} className="hover:text-[var(--ai-text)] transition-colors">
                  {t.howItWorks}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Pour les freelances */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider mb-3">
              {t.freelances}
            </p>
            <ul className="space-y-2 text-[13px] text-[var(--ai-text-secondary)]">
              <li>
                <Link href={t.whyUsHref} className="hover:text-[var(--ai-text)] transition-colors">
                  {t.whyUs}
                </Link>
              </li>
              <li>
                <Link href={t.pricingHref} className="hover:text-[var(--ai-text)] transition-colors">
                  {t.pricing}
                </Link>
              </li>
              <li>
                <Link href="/ai/inscription" className="hover:text-[var(--ai-text)] transition-colors">
                  {t.signup}
                </Link>
              </li>
              <li>
                <Link href="/ai/connexion" className="hover:text-[var(--ai-text)] transition-colors">
                  {t.login}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Workwave */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider mb-3">
              {t.company}
            </p>
            <ul className="space-y-2 text-[13px] text-[var(--ai-text-secondary)]">
              <li>
                <Link href="/a-propos" className="hover:text-[var(--ai-text)] transition-colors">
                  {t.about}
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="hover:text-[var(--ai-text)] transition-colors">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-[var(--ai-text)] transition-colors">
                  {t.legal}
                </Link>
              </li>
              <li>
                <a href="mailto:contact@workwave.fr" className="hover:text-[var(--ai-text)] transition-colors">
                  {t.contact}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bas : copyright + lien vertical BTP */}
        <div className="pt-8 border-t border-[var(--ai-border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[12px] text-[var(--ai-text-tertiary)]">
            © {year} Workwave. {t.rights}
          </p>
          <Link
            href="/"
            className="text-[12px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors inline-flex items-center gap-1.5"
          >
            <span>{t.btpQuestion}</span>
            <span className="font-medium underline decoration-[var(--ai-border)] underline-offset-2">
              workwave.fr
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
