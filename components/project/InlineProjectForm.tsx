import DepositGlass from "@/components/redesign/DepositGlass";
import { publicRedesignEnabled } from "@/lib/public-redesign";
import ProjectForm from "@/components/project/ProjectForm";
import { getAllCategories } from "@/lib/queries/categories";

/** Dépôt intégré aux listings, avec métier et ville conservés. */
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
  // (utilisée seulement si l'user revient en arrière à l'étape 1, non bloquant).
  const categories = await getAllCategories();

  if (publicRedesignEnabled) return (
    <section className="max-w-3xl mx-auto my-12" aria-labelledby="inline-project-form-title">
      <div className="text-center mb-7 px-4">
        <h2 id="inline-project-form-title" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] mb-3">
          Et si on parlait de votre projet&nbsp;?
        </h2>
        <p className="text-[var(--text-secondary)] text-base">
          {category.name}{city ? ` · ${city.name}` : ""}. Décrivez votre besoin, puis échangez avec les professionnels intéressés.
        </p>
      </div>
      <DepositGlass embedded categories={categories.map(c => ({ id: c.id, name: c.name, vertical: c.vertical }))}
        defaultCategoryId={category.id} defaultCity={city ?? null} />
    </section>
  );

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
            Vous n’avez pas trouvé ?
            <span className="text-[#FF5A36]"> Décrivez votre projet</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-base">
            On vous met en relation avec des {category.name.toLowerCase()}{city ? ` à ${city.name}` : ""} intéressés par votre demande.
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
