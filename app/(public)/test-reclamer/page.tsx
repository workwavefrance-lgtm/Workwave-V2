import type { Metadata } from "next";
import TestClaimRedesign from "./TestClaimRedesign";

export const metadata: Metadata = {
  title: "Démo — Nouveau formulaire de réclamation",
  robots: { index: false, follow: false },
};

export default function TestReclamerPage() {
  return <TestClaimRedesign />;
}
