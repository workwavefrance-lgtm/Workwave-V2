import AcquisitionTracker from "@/components/analytics/AcquisitionTracker";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RecentClaimsToast from "@/components/social-proof/RecentClaimsToast";
import CommercialAgent from "@/components/agent/CommercialAgent";
import ClarityScript from "@/components/analytics/ClarityScript";
import { publicRedesignEnabled } from "@/lib/public-redesign";
import styles from "@/components/redesign/public-shell.module.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={publicRedesignEnabled ? styles.shell : "contents"}>
      <AcquisitionTracker />
      <Header redesign={publicRedesignEnabled} />
      <div className={publicRedesignEnabled ? styles.content : "flex-1"}>{children}</div>
      <Footer redesign={publicRedesignEnabled} />
      <RecentClaimsToast />
      {/* Agent commercial : bulle bottom-right qui distingue
          particuliers / artisans selon la page et oriente vers
          deposer-projet ou reclamer/[slug] (cf. composant). */}
      <CommercialAgent />
      {/* Microsoft Clarity (heatmaps + enregistrements), chargé après
          consentement analytics uniquement (RGPD). */}
      <ClarityScript />
    </div>
  );
}
