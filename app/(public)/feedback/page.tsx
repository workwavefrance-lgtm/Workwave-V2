import type { Metadata } from "next";
import FeedbackAgent from "@/components/feedback/FeedbackAgent";

export const metadata: Metadata = {
  title: "Aidez-nous à améliorer Workwave | Workwave",
  description:
    "Une idée d'amélioration ? Un problème rencontré ? Dites-le nous : chaque retour est transmis directement à l'équipe et aide Workwave à s'améliorer.",
};

export default function FeedbackPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary,#0A0A0A)] mb-4">
        Aidez-nous à améliorer <span style={{ color: "#FF5A36" }}>Workwave</span>
      </h1>
      <p className="text-base text-[#6B7280] leading-relaxed mb-10">
        Workwave se construit avec ses utilisateurs. Une idée d&apos;amélioration, un
        bug, quelque chose qui vous a agacé ou plu&nbsp;: dites-le ici — chaque retour
        est lu par l&apos;équipe et fait avancer la plateforme.
      </p>
      <FeedbackAgent />
      <p className="mt-8 text-xs text-[#9CA3AF] leading-relaxed">
        Pour toute question de facturation, litige ou demande RGPD, écrivez-nous
        directement à{" "}
        <a href="mailto:contact@workwave.fr" className="underline">
          contact@workwave.fr
        </a>{" "}
        (réponse sous 48&nbsp;h ouvrées).
      </p>
    </main>
  );
}
