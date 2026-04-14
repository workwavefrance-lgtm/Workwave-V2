import { processGlobalUnsubscribe } from "./actions";

export const metadata = {
  title: "Désinscription globale — Workwave",
  robots: "noindex, nofollow",
};

export default async function UnsubscribeAllPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; id?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const proId = params.id ? parseInt(params.id, 10) : null;

  let result: { success: boolean; error?: string } | null = null;

  if (token && proId && !isNaN(proId)) {
    result = await processGlobalUnsubscribe(proId, token);
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
              Désinscription globale confirmée
            </h1>
            <p className="text-[var(--text-secondary)]">
              Vous ne recevrez plus jamais d&apos;emails de Workwave.
              Votre adresse a été ajoutée à notre liste d&apos;exclusion permanente.
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
