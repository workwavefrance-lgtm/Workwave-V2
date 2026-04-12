import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Generales de Vente",
  description: "Conditions Generales de Vente de la plateforme Workwave.",
  alternates: { canonical: "https://workwave.fr/cgv" },
};

export default function CGVPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
        Conditions Générales de Vente
      </h1>
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-8">
        <p className="text-[var(--text-secondary)] leading-relaxed">
          Les Conditions Générales de Vente de Workwave sont en cours de
          rédaction. Cette page sera mise à jour prochainement avec l&apos;ensemble
          des conditions applicables aux abonnements et services proposés aux
          professionnels.
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-6">
          Pour toute question, contactez-nous à{" "}
          <a
            href="mailto:contact@workwave.fr"
            className="text-[var(--accent)] hover:underline"
          >
            contact@workwave.fr
          </a>
        </p>
      </div>
    </main>
  );
}
