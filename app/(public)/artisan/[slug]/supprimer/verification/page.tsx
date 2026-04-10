import type { Metadata } from "next";
import DeletionVerifyForm from "./DeletionVerifyForm";

export const metadata: Metadata = {
  title: "Vérification — Suppression de fiche — Workwave",
  robots: { index: false, follow: false },
};

export default async function DeletionVerificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { slug } = await params;
  const { attempt } = await searchParams;

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Lien invalide
          </h1>
          <p className="text-[var(--text-secondary)]">
            Ce lien de vérification est invalide ou expiré.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Vérification
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Un code de vérification à 6 chiffres a été envoyé à votre adresse
          email. Saisissez-le ci-dessous pour confirmer la suppression.
        </p>
        <DeletionVerifyForm slug={slug} attemptId={attempt} />
      </div>
    </div>
  );
}
