import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fiche réclamée avec succès — Workwave",
  robots: { index: false, follow: false },
};

export default function ClaimSuccessPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      {/* Icône succès */}
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-8">
        <svg
          className="w-10 h-10 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
        Fiche réclamée avec succès
      </h1>

      <p className="text-[var(--text-secondary)] mb-3 leading-relaxed">
        Votre compte a été créé et votre fiche professionnelle vous est désormais attribuée.
      </p>

      <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
        Vous pouvez maintenant compléter votre profil, configurer vos préférences
        et commencer à recevoir des demandes de clients.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/pro/dashboard"
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] inline-flex items-center justify-center gap-2"
        >
          Accéder à mon dashboard
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-250"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
