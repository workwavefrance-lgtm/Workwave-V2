import type { Metadata } from "next";
import Link from "next/link";
import { getReviewByToken } from "@/lib/queries/reviews";
import ReviewSubmitForm from "./ReviewSubmitForm";

export const metadata: Metadata = {
  title: "Donnez votre avis — Workwave",
  description:
    "Évaluez la prestation de l'artisan contacté via Workwave. Votre avis aide d'autres particuliers à choisir le bon professionnel.",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ReviewPage({ params }: Props) {
  const { token } = await params;
  const review = await getReviewByToken(token);

  return (
    <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Card principal */}
        <div
          className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-10 overflow-hidden"
          style={{
            boxShadow:
              "0 24px 48px -12px rgba(15, 23, 42, 0.18), 0 8px 16px -4px rgba(15, 23, 42, 0.06)",
          }}
        >
          {/* Liseré coral en haut */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #FF5A36 25%, #FF7A5C 50%, #FF5A36 75%, transparent 100%)",
            }}
          />

          {!review ? (
            // ─── Lien invalide ────────────────────────────────────────────
            <div className="text-center py-6">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-[#F3F4F6] dark:bg-[#1F1F23]"
                aria-hidden="true"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
                Lien invalide ou expiré
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Ce lien de notation n&apos;est plus actif. Il a peut-être déjà été utilisé, ou la durée de validité est dépassée.
              </p>
              <p className="text-[13px] text-[var(--text-tertiary)] mb-8 max-w-md mx-auto">
                Un problème ? Écrivez-nous à{" "}
                <a
                  href="mailto:contact@workwave.fr"
                  className="text-[var(--accent)] hover:underline"
                >
                  contact@workwave.fr
                </a>{" "}
                en indiquant le lien complet — on s&apos;en occupe.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[14px] font-medium transition-all duration-200"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : review.status === "published" ? (
            // ─── Avis deja publie ────────────────────────────────────────
            <div className="text-center py-6">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, #FF7A5C 0%, #FF5A36 60%, #D63916 100%)",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
                Avis déjà publié
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Vous avez déjà laissé votre avis sur <strong>{review.pro_name}</strong>. Merci de votre contribution !
              </p>
              <Link
                href={`/artisan/${review.pro_slug}`}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[14px] font-semibold transition-all duration-200 hover:scale-105"
                style={{ boxShadow: "0 4px 12px -2px rgba(255, 90, 54, 0.4)" }}
              >
                Voir la fiche de l&apos;artisan
              </Link>
            </div>
          ) : (
            // ─── Formulaire de notation ──────────────────────────────────
            <ReviewSubmitForm
              token={token}
              proName={review.pro_name}
            />
          )}
        </div>

        {/* Pied de page : assurance + lien legal */}
        <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-6 leading-relaxed">
          Workwave est un service indépendant de mise en relation. Les avis sont vérifiés par notre équipe.
          <br />
          <Link
            href="/cgu"
            className="hover:text-[var(--accent)] transition-colors"
          >
            CGU
          </Link>
          {" · "}
          <Link
            href="/mentions-legales"
            className="hover:text-[var(--accent)] transition-colors"
          >
            Mentions légales
          </Link>
        </p>
      </div>
    </main>
  );
}
