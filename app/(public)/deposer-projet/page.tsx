import type { Metadata } from "next";
import ProjectForm from "@/components/project/ProjectForm";
import {
  getAllCategories,
  getCategoryBySlug,
} from "@/lib/queries/categories";
import { getCityBySlug } from "@/lib/queries/cities";

export const metadata: Metadata = {
  title: "Deposer un projet - Devis gratuits en Vienne",
  description:
    "Decrivez votre projet de travaux gratuitement et recevez des devis de professionnels qualifies dans la Vienne.",
  alternates: { canonical: "https://workwave.fr/deposer-projet" },
};

type Props = {
  searchParams: Promise<{ categorie?: string; ville?: string }>;
};

export default async function DeposerProjetPage({ searchParams }: Props) {
  const { categorie, ville } = await searchParams;

  // Pré-remplissage depuis les liens des pages listings (/[metier]/[location])
  const [categories, prefilledCategory, prefilledCity] = await Promise.all([
    getAllCategories(),
    categorie ? getCategoryBySlug(categorie) : Promise.resolve(null),
    // ville peut être un slug de ville (ex: "poitiers") ou de département (ex: "vienne-86").
    // getCityBySlug renvoie null pour un slug de département → comportement OK (pas de prefill).
    ville ? getCityBySlug(ville) : Promise.resolve(null),
  ]);

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
        defaultCategoryId={prefilledCategory?.id}
        defaultCity={
          prefilledCity
            ? { id: prefilledCity.id, name: prefilledCity.name }
            : null
        }
      />
    </main>
  );
}
