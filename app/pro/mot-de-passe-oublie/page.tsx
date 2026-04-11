import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Workwave",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
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
            Réinitialisez votre mot de passe
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-8">
          <ForgotPasswordForm />
        </div>

        {/* Retour connexion */}
        <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
          <Link
            href="/pro/connexion"
            className="text-[var(--accent)] hover:underline transition-colors duration-250"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
