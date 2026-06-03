import type { Metadata } from "next";
import AbonnementView from "@/components/pro/dashboard/AbonnementView";

export const metadata: Metadata = {
  title: "Facturation — Workwave Pro",
  robots: { index: false, follow: false },
};

export default function AbonnementPage() {
  return <AbonnementView />;
}
