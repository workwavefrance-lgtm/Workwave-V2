import ProjectForm from "@/components/project/ProjectForm";
import { getAllCategories } from "@/lib/queries/categories";

/**
 * Form de dépôt projet EMBEDDÉ inline sur les pages listing et autres pages
 * publiques. Réutilise `<ProjectForm>` (zéro modif du flow validé /deposer-projet)
 * + le step initial intelligent : si catégorie+ville sont passées, l'user
 * arrive directement à l'étape "Projet" (urgence + budget), saute "Métier" et
 * "Ville".
 *
 * Objectif business : capter les visiteurs qui ont scrollé la liste sans
 * trouver le pro idéal — ils n'ont qu'à décrire leur besoin sans changer
 * de page. Impact attendu : × 3-5 la conversion sur les pages listing.
 */
export default async function InlineProjectForm({
  category,
  city,
  variant = "default",
}: {
  category: { id: number; name: string };
  city?: { id: number; name: string } | null;
  /** "default" = bord visible + titre clair ; "compact" = sans bord pour intégration dans une section parente. */
  variant?: "default" | "compact";
}) {
  // Le composant ProjectForm a besoin de la liste complète des catégories
  // (utilisée seulement si l'user revient en arrière à l'étape 1 — non bloquant).
  const categories = await getAllCategories();

  const wrapperClasses =
    variant === "compact"
      ? "max-w-2xl mx-auto"
      : "max-w-2xl mx-auto rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)] p-6 sm:p-10 my-12 shadow-sm";

  return (
    <section className={wrapperClasses} aria-labelledby="inline-project-form-title">
      {variant === "default" && (
        <div className="text-center mb-8">
          <h2
            id="inline-project-form-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-3"
          >
            Vous n'avez pas trouvé ?
            <span className="text-[#FF5A36]"> Décrivez votre projet</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-base">
            On vous met en relation avec des {category.name.toLowerCase()}{city ? ` à ${city.name}` : ""} en 24h.
            Gratuit, sans engagement.
          </p>
        </div>
      )}

      <ProjectForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          vertical: c.vertical,
        }))}
        defaultCategoryId={category.id}
        defaultCity={city ?? null}
      />
    </section>
  );
}
