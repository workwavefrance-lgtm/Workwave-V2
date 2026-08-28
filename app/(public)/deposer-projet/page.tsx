import type { Metadata } from "next";
import ProjectForm from "@/components/project/ProjectForm";
import {
  getAllCategories,
  getCategoryBySlug,
} from "@/lib/queries/categories";
import { getCityBySlug } from "@/lib/queries/cities";

export const metadata: Metadata = {
  title: "Déposer un projet · Devis gratuits d'artisans près de chez vous",
  description:
    "Décrivez votre projet de travaux gratuitement et recevez des devis d'artisans qualifiés près de chez vous, partout en France et en Belgique. 100% gratuit, sans engagement.",
  alternates: { canonical: "https://workwave.fr/deposer-projet" },
};

type Props = {
  searchParams: Promise<{ categorie?: string; ville?: string; besoin?: string }>;
};

export default async function DeposerProjetPage({ searchParams }: Props) {
  const { categorie, ville, besoin } = await searchParams;

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
        {/* 28/08/2026 : trois lignes ramenees a une. Sur un telephone, chaque
            ligne d'introduction repousse d'autant la premiere question. */}
        <p className="text-[var(--text-secondary)] text-lg max-w-lg mx-auto">
          Un pro adapté vous rappelle. Vous comparez, vous choisissez.
        </p>
        {/* Le titre reste : il porte le referencement de la page et annonce ce
            qu'on va faire. C'est la hauteur des blocs SOUS lui qui repoussait
            le formulaire hors de l'ecran, pas lui. */}
        {/* 28/08/2026 : les quatre grandes cartes de confiance qui se trouvaient
            ici ont ete DEPLACEES dans le formulaire, sur son premier ecran, en
            pastilles. Elles occupaient 700 px sur un telephone, si bien
            qu'AUCUN champ n'etait visible sans defiler ; et comme elles vivaient
            dans la page et non dans une etape, elles etaient reaffichees
            au-dessus des QUATRE etapes. Le fond est conserve, le volume non. */}
      </div>

      <ProjectForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          vertical: c.vertical,
        }))}
        defaultCategoryId={prefilledCategory?.id}
        // Ce que l'utilisateur avait tape dans la recherche de l'accueil quand
        // aucun metier ne correspondait. Borne a 500 caracteres : ce champ vient
        // d'une URL, donc de l'exterieur.
        defaultDescription={besoin ? besoin.slice(0, 500) : undefined}
        defaultCity={
          prefilledCity
            ? { id: prefilledCity.id, name: prefilledCity.name }
            : null
        }
      />
    </main>
  );
}
