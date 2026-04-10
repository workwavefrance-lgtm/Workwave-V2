import type { Metadata } from "next";
import ParametresView from "@/components/pro/dashboard/ParametresView";

export const metadata: Metadata = {
  title: "Paramètres — Workwave Pro",
  robots: { index: false, follow: false },
};

export default function ParametresPage() {
  return <ParametresView />;
}
