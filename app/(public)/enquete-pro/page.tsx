import type { Metadata } from "next";
import ProSurveyForm from "@/components/survey/ProSurveyForm";

export const metadata: Metadata = {
  title: "2 minutes pour orienter les outils qu'on développe — Workwave",
  description:
    "Artisans du BTP : 2 minutes pour nous dire ce qui vous prend du temps en dehors du chantier. Vos réponses orientent les outils qu'on construit.",
  alternates: { canonical: "https://workwave.fr/enquete-pro" },
};

export default function EnqueteProPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          2 minutes pour orienter les outils qu&apos;on développe.
        </h1>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          Vos réponses comptent. Une idée, un bug, quelque chose qui vous a agacé ou plu — dites-le,
          c&apos;est lu par l&apos;équipe et ça fait vraiment avancer la plateforme.
        </p>
      </div>
      <ProSurveyForm />
    </main>
  );
}
