import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion Espace Pro — Workwave",
  robots: { index: false, follow: false },
};

export default function ConnexionPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold text-[var(--text-primary)] tracking-tight"
          >
            Workwave
          </Link>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Connectez-vous à votre espace professionnel
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-8">
          <LoginForm />
        </div>

        {/* Lien réclamation */}
        <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
          Vous n&apos;avez pas encore réclamé votre fiche ?{" "}
          <Link
            href="/"
            className="text-[var(--accent)] hover:underline transition-colors duration-250"
          >
            Recherchez votre entreprise
          </Link>
        </p>
      </div>
    </main>
  );
}
