import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeletionRequestForm from "./DeletionRequestForm";
import { getServiceClient } from "@/lib/supabase/service-client";
import { ownsPro } from "@/lib/pro/ownership";

export const metadata: Metadata = {
  title: "Supprimer ma fiche · Workwave",
  robots: { index: false, follow: false },
};


export default async function ProDeletionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getServiceClient();

  const { data: pro } = await supabase
    .from("pros")
    .select("id, name, siret, deleted_at, claimed_by_user_id")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Fiche introuvable
          </h1>
          <p className="text-[var(--text-secondary)]">
            Cette fiche n&apos;existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  if (pro.deleted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Fiche déjà supprimée
          </h1>
          <p className="text-[var(--text-secondary)]">
            Cette fiche a déjà fait l&apos;objet d&apos;une demande de suppression.
          </p>
        </div>
      </div>
    );
  }

  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email || !ownsPro(user.id, pro.claimed_by_user_id)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Demander la suppression</h1>
          <p className="text-lg text-[var(--text-secondary)] mb-4">{pro.name}</p>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Connectez-vous au compte qui gère cette fiche pour confirmer sa suppression.
            Si vous n’avez pas accès à ce compte ou si la fiche n’a jamais été réclamée,
            le support vérifiera votre demande avec vous.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/pro/connexion" className="bg-[var(--accent)] text-white text-center rounded-full px-5 py-3 font-semibold">
              Me connecter au compte propriétaire
            </Link>
            <a href="mailto:contact@workwave.fr?subject=Demande%20de%20suppression%20de%20fiche" className="text-[var(--accent)] text-center font-semibold hover:underline">
              Demander la suppression au support
            </a>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-5">
            Après connexion, revenez sur cette page pour continuer.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Supprimer la fiche
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-6">
          {pro.name}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Pour supprimer votre fiche, saisissez le SIRET ou le numéro BCE de
          l&apos;entreprise. Un code à 6 chiffres sera envoyé à l’adresse email
          de votre compte pour confirmer cette suppression.
        </p>
        <DeletionRequestForm slug={slug} hasSiret={!!pro.siret} accountEmail={user.email} />
      </div>
    </div>
  );
}
