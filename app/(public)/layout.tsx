import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RecentClaimsToast from "@/components/social-proof/RecentClaimsToast";
import CommercialAgent from "@/components/agent/CommercialAgent";
import ClarityScript from "@/components/analytics/ClarityScript";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <RecentClaimsToast />
      {/* Agent commercial : bulle bottom-right qui distingue
          particuliers / artisans selon la page et oriente vers
          deposer-projet ou reclamer/[slug] (cf. composant). */}
      <CommercialAgent />
      {/* Microsoft Clarity (heatmaps + enregistrements) — chargé après
          consentement analytics uniquement (RGPD). */}
      <ClarityScript />
    </>
  );
}
