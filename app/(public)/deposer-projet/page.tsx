import type { Metadata } from "next";
import ProjectForm from "@/components/project/ProjectForm";
import { getAllCategories } from "@/lib/queries/categories";

export const metadata: Metadata = {
  title: "Déposer un projet",
  description:
    "Décrivez votre projet de travaux gratuitement et recevez des devis de professionnels qualifiés dans la Vienne.",
};

export default async function DeposerProjetPage() {
  const categories = await getAllCategories();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] mb-4">
          Décrivez votre projet
        </h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-lg mx-auto">
          Gratuit et sans engagement. Un professionnel adapté vous contactera
          rapidement.
        </p>
      </div>

      <ProjectForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          vertical: c.vertical,
        }))}
      />
    </main>
  );
}
