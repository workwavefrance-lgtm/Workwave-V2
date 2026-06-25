import type { Metadata } from "next";
import Link from "next/link";
import RetrouverFicheForm from "./RetrouverFicheForm";

export const metadata: Metadata = {
  title: "Retrouver ma fiche pro — Workwave",
  description:
    "Vous êtes professionnel ? Retrouvez votre fiche Workwave en saisissant simplement votre SIRET.",
  // Page utilitaire pas strategique en SEO mais on la laisse indexable :
  // utile pour les recherches "workwave SIRET" / "comment retrouver ma fiche workwave".
};

export default function RetrouverFichePage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Retrouvez votre fiche
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Vous êtes professionnel ? Saisissez votre SIRET pour retrouver
            votre fiche et la réclamer.
          </p>
        </div>

        {/* Card form */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <RetrouverFicheForm />
        </div>

        {/* Pro déjà inscrit : accès connexion bien visible (gros) */}
        <div className="text-center mt-8">
          <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-3">
            Vous avez déjà un compte&nbsp;?
          </p>
          <Link
            href="/pro/connexion"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border-2 border-[var(--accent)] text-[var(--accent)] text-lg font-semibold hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
