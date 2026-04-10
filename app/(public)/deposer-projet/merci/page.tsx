import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demande envoyée",
  description: "Votre demande de projet a bien été reçue.",
};

export default function MerciPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Icône check */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] mb-4">
        Votre demande a bien été reçue
      </h1>

      <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto mb-3">
        Un professionnel adapté à votre projet vous contactera très
        prochainement.
      </p>

      <p className="text-[var(--text-tertiary)] text-sm max-w-md mx-auto mb-10">
        Nous avons envoyé une confirmation à votre adresse email.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/deposer-projet"
          className="border border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-primary)] px-8 py-3 rounded-full text-sm font-semibold transition-all duration-250"
        >
          Déposer un autre projet
        </Link>
      </div>
    </main>
  );
}
