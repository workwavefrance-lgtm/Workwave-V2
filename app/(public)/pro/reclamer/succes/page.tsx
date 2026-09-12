import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Suivi de votre fiche · Workwave",
  robots: { index: false, follow: false },
};

export default function ClaimSuccessPage() {
  // Ancien lien : le tableau de bord résout la session, la fiche attribuée ou
  // la demande en attente, sans annoncer une attribution non vérifiée.
  redirect("/pro/dashboard");
}
