import { processUnsubscribe } from "./actions";

export const metadata = {
  title: "Désinscription — Workwave",
  robots: "noindex, nofollow",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; id?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const proId = params.id ? parseInt(params.id, 10) : null;

  let result: { success: boolean; error?: string } | null = null;

  if (token && proId && !isNaN(proId)) {
    result = await processUnsubscribe(proId, token);
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {!token || !proId || isNaN(proId) ? (
          <>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Lien invalide
            </h1>
            <p className="text-[var(--text-secondary)]">
              Ce lien de désinscription est invalide ou incomplet.
              Contactez-nous à{" "}
              <a
                href="mailto:contact@workwave.fr"
                className="text-[#FF5A36] underline"
              >
                contact@workwave.fr
              </a>{" "}
              si vous souhaitez vous désinscrire.
            </p>
          </>
        ) : result?.success ? (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Désinscription confirmée
            </h1>
            <p className="text-[var(--text-secondary)]">
              Vous ne recevrez plus d&apos;emails de cette campagne Workwave.
              Votre fiche reste visible dans l&apos;annuaire.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Erreur
            </h1>
            <p className="text-[var(--text-secondary)]">
              {result?.error ||
                "Une erreur est survenue. Contactez-nous à contact@workwave.fr."}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
