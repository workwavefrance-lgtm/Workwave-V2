import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import DeletionForm from "./DeletionForm";

export const metadata: Metadata = {
  title: "Supprimer ma demande — Workwave",
  robots: { index: false, follow: false },
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function ProjectDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Lien invalide
          </h1>
          <p className="text-[var(--text-secondary)]">
            Ce lien de suppression est invalide ou incomplet.
          </p>
        </div>
      </div>
    );
  }

  const supabase = getServiceClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, first_name, status, category:categories(name), city:cities(name)")
    .eq("deletion_token", token)
    .single();

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Demande introuvable
          </h1>
          <p className="text-[var(--text-secondary)]">
            Cette demande n&apos;existe pas ou a déjà été supprimée.
          </p>
        </div>
      </div>
    );
  }

  if (project.status === "deleted") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Demande déjà supprimée
          </h1>
          <p className="text-[var(--text-secondary)]">
            Votre demande a déjà été supprimée. Les professionnels concernés ont été informés.
          </p>
        </div>
      </div>
    );
  }

  const category = project.category as unknown as { name: string } | null;
  const city = project.city as unknown as { name: string } | null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Supprimer ma demande
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Vous êtes sur le point de supprimer votre demande
          {category ? ` de ${category.name}` : ""}
          {city ? ` à ${city.name}` : ""}.
          Les professionnels qui ont reçu votre demande seront informés de son retrait.
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mb-8">
          Cette action est irréversible.
        </p>
        <DeletionForm token={token} />
      </div>
    </div>
  );
}
