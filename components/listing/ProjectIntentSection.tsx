import Link from "next/link";
import { SPECIALTIES } from "@/lib/specialties";
import { getCategoryServiceLabel } from "@/lib/utils/category-grammar";

/**
 * Elision francaise : "de" -> "d'" devant une voyelle ou un h muet.
 * Evite les "projet de électricité" / "de isolation" disgracieux.
 * (Aucun metier ne commence par un h aspire, donc h est traite comme elidable.)
 */
function deOrDApostrophe(label: string): string {
  const first = label.trim().charAt(0).toLowerCase();
  return "aàâäeéèêëiîïoôöuùûüyh".includes(first) ? `d'${label}` : `de ${label}`;
}

/**
 * Section "Quel est votre projet de [metier] a [ville] ?"
 *
 * Pattern Travaux.com / Habitatpresto : on capte le lead AVANT que
 * l'user voit la liste. Le visiteur arrive avec une intention precise
 * (ex. "adoucisseur d'eau Poitiers") -> il clique sur le bouton
 * correspondant -> hop, funnel /deposer-projet pre-rempli avec
 * categorie + ville + specialite.
 *
 * Le composant utilise SPECIALTIES (lib/specialties.ts) pour les
 * boutons rapides quand la categorie en a. Sinon fallback : juste
 * le CTA principal.
 */
export default function ProjectIntentSection({
  categorySlug,
  categoryName,
  citySlug,
  locationName,
  currentSpecialty,
}: {
  categorySlug: string;
  categoryName: string;
  citySlug: string | null;
  locationName: string;
  /** Si on est sur /[metier]/[specialite]/[ville], slug de la specialty
   *  active : la pill correspondante est mise en evidence et le CTA
   *  principal pre-fill la specialty en query param. */
  currentSpecialty?: string | null;
}) {
  const specialties = SPECIALTIES[categorySlug] ?? [];

  // Lien CTA principal : inclut la specialty si on est sur une sous-page
  const baseParams = new URLSearchParams();
  baseParams.set("categorie", categorySlug);
  if (citySlug) baseParams.set("ville", citySlug);
  if (currentSpecialty) baseParams.set("specialite", currentSpecialty);
  const baseHref = `/deposer-projet?${baseParams.toString()}`;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)] p-5 sm:p-7 mb-8"
      aria-labelledby="project-intent-title"
      style={{
        boxShadow:
          "0 4px 12px -4px rgba(15, 23, 42, 0.06), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
      }}
    >
      {/* Liseré coral discret en haut */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #FF5A36 25%, #FF7A5C 50%, #FF5A36 75%, transparent 100%)",
        }}
      />

      <h2
        id="project-intent-title"
        className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--text-primary)] mb-1"
      >
        Quel est votre projet {deOrDApostrophe(getCategoryServiceLabel(categorySlug, categoryName))} à {locationName} ?
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-5">
        Décrivez votre besoin en 30 secondes — nous transmettons votre demande à 3 artisans qualifiés. Gratuit, sans engagement.
      </p>

      {/* Boutons rapides par specialite (si la categorie en a) */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {specialties.slice(0, 8).map((spec) => {
            const isActive = currentSpecialty === spec.slug;
            const href = citySlug
              ? `/deposer-projet?categorie=${categorySlug}&ville=${citySlug}&specialite=${spec.slug}`
              : `/deposer-projet?categorie=${categorySlug}&specialite=${spec.slug}`;
            return (
              <Link
                key={spec.slug}
                href={href}
                className={`inline-flex items-center px-3.5 py-2 text-[13px] font-medium rounded-full transition-all duration-200 hover:-translate-y-0.5 ${
                  isActive
                    ? "text-white bg-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent-hover)]"
                    : "text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-white dark:hover:bg-[#1A1A1A] border border-[var(--card-border)] hover:border-[var(--accent)]"
                }`}
              >
                {spec.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* CTA principal */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Link
          href={baseHref}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-semibold transition-all duration-200 hover:scale-[1.02]"
          style={{ boxShadow: "0 4px 14px -2px rgba(255, 90, 54, 0.45)" }}
        >
          Décrire mon projet
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <p className="text-[12px] text-[var(--text-tertiary)] sm:ml-1">
          Réponse sous 24h · 100% gratuit · Sans compte
        </p>
      </div>
    </section>
  );
}
