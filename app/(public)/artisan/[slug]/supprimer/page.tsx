import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import DeletionRequestForm from "./DeletionRequestForm";

export const metadata: Metadata = {
  title: "Supprimer ma fiche — Workwave",
  robots: { index: false, follow: false },
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function ProDeletionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getServiceClient();

  const { data: pro } = await supabase
    .from("pros")
    .select("id, name, siret, deleted_at")
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
          Pour supprimer cette fiche, veuillez confirmer le SIRET de
          l&apos;entreprise et votre adresse email. Un code de vérification vous
          sera envoyé.
        </p>
        <DeletionRequestForm slug={slug} hasSiret={!!pro.siret} />
      </div>
    </div>
  );
}
