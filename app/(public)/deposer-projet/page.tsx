import type { Metadata } from "next";
import ProjectForm from "@/components/project/ProjectForm";
import {
  getAllCategories,
  getCategoryBySlug,
} from "@/lib/queries/categories";
import { getCityBySlug } from "@/lib/queries/cities";

export const metadata: Metadata = {
  title: "Déposer un projet — Devis gratuits d'artisans près de chez vous",
  description:
    "Décrivez votre projet de travaux gratuitement et recevez des devis d'artisans qualifiés près de chez vous, partout en France et en Belgique. 100% gratuit, sans engagement.",
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
          Un professionnel adapté vous contactera rapidement. Vous comparez,
          vous choisissez.
        </p>
        {/* Repères de confiance (tous vrais, tous vérifiables).
            Avant le 08/08/2026 : une ligne grise en 14px, au même niveau visuel
            qu'une note de bas de page — invisible au moment où le doute se joue.
            Et « Coordonnées protégées » ne veut rien dire pour quelqu'un qui
            n'est pas du métier : chaque promesse porte donc sa traduction en
            français courant. */}
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-left">
          {[
            {
              titre: "Gratuit",
              detail: "Vous ne payez rien, ni maintenant ni plus tard.",
            },
            {
              titre: "Sans engagement",
              detail: "Vous choisissez, ou vous ne choisissez personne.",
            },
            {
              titre: "Artisans vérifiés",
              detail: "SIRET contrôlé au registre officiel des entreprises.",
            },
            {
              titre: "Numéro protégé",
              detail: "Jamais affiché sur le site, jamais revendu.",
            },
          ].map(({ titre, detail }) => (
            <li
              key={titre}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-4"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <span className="text-[var(--accent)]" aria-hidden>
                  ✓
                </span>
                {titre}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
                {detail}
              </p>
            </li>
          ))}
        </ul>
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
