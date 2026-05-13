import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import DeletionVerifyForm from "./DeletionVerifyForm";

export const metadata: Metadata = {
  title: "Vérification — Suppression de fiche — Workwave",
  robots: { index: false, follow: false },
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Obfusque un email pour affichage public.
 * Exemple : "marie.dupont@gmail.com" -> "m***@gmail.com"
 */
function obfuscateEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const first = local[0] ?? "";
  return `${first}***${domain}`;
}

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

  // Recupere l'email de la tentative pour l'afficher en obfusque
  // (rassure l'utilisateur : il sait exactement ou chercher son code).
  const supabase = getServiceClient();
  const { data: attemptRow } = await supabase
    .from("claim_attempts")
    .select("email")
    .eq("id", parseInt(attempt))
    .eq("type", "deletion")
    .single();

  const obfuscatedEmail = attemptRow?.email
    ? obfuscateEmail(attemptRow.email)
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Vérification
        </h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Un code de vérification à 6 chiffres a été envoyé
          {obfuscatedEmail ? (
            <>
              {" "}à <strong className="text-[var(--text-primary)]">{obfuscatedEmail}</strong>.
            </>
          ) : (
            <> à votre adresse email.</>
          )}{" "}
          Saisissez-le ci-dessous pour confirmer la suppression.
        </p>
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-xl p-4 mb-6">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Pas reçu ?</strong>{" "}
            Vérifiez votre dossier <em>spams / courriers indésirables</em>.
            L&apos;email vient de <code className="font-mono text-[11px]">contact@workwave.fr</code>.
            Le code expire dans 15 minutes.
          </p>
        </div>
        <DeletionVerifyForm slug={slug} attemptId={attempt} />
      </div>
    </div>
  );
}
