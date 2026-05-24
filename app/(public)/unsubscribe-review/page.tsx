import Link from "next/link";
import { processReviewUnsubscribe } from "./actions";

export const metadata = {
  title: "Désinscription des demandes d'avis — Workwave",
  robots: "noindex, nofollow",
};

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function UnsubscribeReviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token;
  const email = params.email;

  let result: { success: boolean; error?: string } | null = null;

  if (token && email) {
    result = await processReviewUnsubscribe(email, token);
  }

  const isInvalid = !token || !email;
  const isSuccess = result?.success === true;
  const errorMessage =
    result && !result.success ? result.error : null;

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div
          className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-10 overflow-hidden text-center"
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

          {isInvalid || errorMessage ? (
            <>
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-[#F3F4F6] dark:bg-[#1F1F23]"
                aria-hidden="true"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
                Lien invalide
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6">
                {errorMessage ||
                  "Ce lien de désinscription est invalide ou incomplet."}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] mb-6">
                Pour vous désinscrire manuellement, écrivez-nous à{" "}
                <a href="mailto:contact@workwave.fr" className="text-[var(--accent)] hover:underline">
                  contact@workwave.fr
                </a>{" "}
                en indiquant votre adresse email.
              </p>
            </>
          ) : (
            <>
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, #FF7A5C 0%, #FF5A36 60%, #D63916 100%)",
                  boxShadow: "0 8px 24px -8px rgba(255, 90, 54, 0.45)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
                Désinscription confirmée
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-2">
                Vous ne recevrez plus de demandes d&apos;avis post-prestation de la part de Workwave sur cette adresse email.
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] mb-6">
                Cela n&apos;affecte pas les autres communications Workwave (confirmations de projet, etc.). Pour une désinscription totale, écrivez à <a href="mailto:contact@workwave.fr" className="text-[var(--accent)] hover:underline">contact@workwave.fr</a>.
              </p>
            </>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[14px] font-medium transition-all duration-200"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
