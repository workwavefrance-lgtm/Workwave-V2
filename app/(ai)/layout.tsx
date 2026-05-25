import type { Metadata } from "next";
import "./ai-globals.css";
import AiHeader from "@/components/ai/AiHeader";
import AiFooter from "@/components/ai/AiFooter";

/**
 * Layout dédié aux routes /ai/* (Workwave AI).
 *
 * IMPORTANT : ce layout N'inclut PAS les composants Workwave BTP :
 *   - Pas de Header coral
 *   - Pas de RecentClaimsToast (social proof BTP)
 *   - Pas de CommercialAgent Léa (sera remplacé par un agent dédié IA)
 *   - Pas de CookieBanner (héritage root layout suffit)
 *
 * Design tokens scopés via la classe `.ai-theme` (cf. ai-globals.css).
 * Toutes les vars `--ai-*` ne fuient PAS hors de ce scope.
 */

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ),
  title: {
    default: "Workwave AI — Trouvez le freelance tech idéal",
    template: "%s | Workwave AI",
  },
  description:
    "Plateforme de mise en relation entre porteurs de projet et freelances tech (IA, dev, cloud, no-code, data, design). Inscription gratuite, matching par IA, sans crédit.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Workwave AI",
  },
};

export default function AiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ai-theme min-h-screen flex flex-col bg-[var(--ai-bg)] text-[var(--ai-text)]">
      <AiHeader />
      <main className="flex-1">{children}</main>
      <AiFooter />
    </div>
  );
}
