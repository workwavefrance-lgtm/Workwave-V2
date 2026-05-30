import type { Metadata } from "next";
// Reutilise les memes design tokens .ai-theme que le vertical AI FR.
import "../(ai)/ai-globals.css";
import AiHeader from "@/components/ai/AiHeader";
import AiFooter from "@/components/ai/AiFooter";

/**
 * Layout ANGLAIS Workwave AI (routes /en/ai/*).
 *
 * Miroir de app/(ai)/layout.tsx mais :
 *   - metadata en anglais + openGraph locale en_US
 *   - lang="en" pose sur le wrapper (le <html lang="fr"> vient du root layout ;
 *     on marque ce sous-arbre comme anglais pour les lecteurs d'ecran + un
 *     signal de langue de contenu. hreflang reste le signal SEO principal).
 *   - PAS de AiStickyCta (ses chemins sont FR-only ; evite une fuite de texte
 *     FR sur les pages EN). Sera localise en Phase D.
 *
 * AiHeader/AiFooter detectent la locale via le pathname (/en/ai) et basculent
 * automatiquement en anglais.
 */

// Ce route group sert le contenu EN international, canonicalisé sur le gTLD
// workwaveai.co (cf. lib/i18n/alternates.ts + next.config.ts). Le metadataBase
// pointe donc sur .co : toute URL relative (og:image future, etc.) résout sur
// le bon domaine, et reste cohérente avec les canonical/hreflang des pages EN.
const SITE_URL = "https://www.workwaveai.co";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Workwave AI — Hire vetted freelancers (tech, AI, data, design)",
    template: "%s | Workwave AI",
  },
  description:
    "Post your project and reach a community of vetted freelancers across Europe, the Gulf and beyond — AI, development, cloud, data, design, marketing, finance, legal. Free to post, AI-matched, 0% commission.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Workwave AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workwave AI — Hire vetted freelancers",
    description:
      "AI-matched freelancers across Europe, the Gulf and beyond. Free to post a project, 0% commission.",
  },
};

export default function AiEnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      lang="en"
      className="ai-theme min-h-screen flex flex-col bg-[var(--ai-bg)] text-[var(--ai-text)]"
    >
      <AiHeader />
      <main className="flex-1">{children}</main>
      <AiFooter />
    </div>
  );
}
