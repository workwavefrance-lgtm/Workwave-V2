import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeletionVerifyForm from "./DeletionVerifyForm";
import { getServiceClient } from "@/lib/supabase/service-client";
import { deletionAttemptMatches } from "@/lib/pro/ownership";

export const metadata: Metadata = {
  title: "Vérification · Suppression de fiche · Workwave",
  robots: { index: false, follow: false },
};


/** Affichage limité à l'adresse du propriétaire déjà authentifié. */
function obfuscateEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const first = local[0] ?? "";
  return `${first}***${domain}`;
}

function VerificationUnavailable({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Vérification indisponible</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Ce lien est invalide, a expiré ou appartient à un autre compte.
          Connectez-vous au compte propriétaire puis demandez un nouveau code depuis la fiche.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/pro/connexion" className="text-[var(--accent)] font-semibold hover:underline">Me connecter</Link>
          <Link href={`/artisan/${slug}/supprimer`} className="text-[var(--accent)] font-semibold hover:underline">Revenir à la demande de suppression</Link>
          <a href="mailto:contact@workwave.fr?subject=Demande%20de%20suppression%20de%20fiche" className="text-[var(--text-secondary)] hover:underline">Contacter le support</a>
        </div>
      </div>
    </main>
  );
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

  if (!attempt || !/^[1-9]\d*$/.test(attempt) || !Number.isSafeInteger(Number(attempt))) {
    return <VerificationUnavailable slug={slug} />;
  }

  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return <VerificationUnavailable slug={slug} />;

  // Le droit sur la fiche est vérifié avant de lire la tentative : un lien
  // forgé ne doit jamais afficher même une partie de l'email d'un tiers.
  const supabase = getServiceClient();
  const { data: pro, error: proError } = await supabase
    .from("pros")
    .select("id, siret, claimed_by_user_id")
    .eq("slug", slug)
    .eq("claimed_by_user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (proError || !pro) return <VerificationUnavailable slug={slug} />;

  const { data: attemptRow, error: attemptError } = await supabase
    .from("claim_attempts")
    .select("email, siret, target_pro_id, type, status, code_expires_at, attempts_count")
    .eq("id", Number(attempt))
    .eq("type", "deletion")
    .maybeSingle();
  if (
    attemptError || !attemptRow ||
    !deletionAttemptMatches(attemptRow, pro, user) ||
    attemptRow.status !== "pending" ||
    // Page serveur dynamique (session) : le lien doit encore être valide à cette requête.
    // eslint-disable-next-line react-hooks/purity
    !(new Date(attemptRow.code_expires_at).getTime() > Date.now()) ||
    typeof attemptRow.attempts_count !== "number" || attemptRow.attempts_count >= 3
  ) {
    return <VerificationUnavailable slug={slug} />;
  }

  const obfuscatedEmail = obfuscateEmail(user.email);

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
