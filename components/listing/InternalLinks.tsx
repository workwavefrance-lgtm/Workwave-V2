import Link from "next/link";
import type { Category, City } from "@/lib/types/database";

type InternalLinksProps = {
  relatedCategories: Category[];
  nearbyCities: City[];
  currentCategorySlug: string;
  currentCategoryName: string;
  locationSlug: string;
  locationName: string;
  popularCategories?: { category: Category; count: number }[];
};

export default function InternalLinks({
  relatedCategories,
  nearbyCities,
  currentCategorySlug,
  currentCategoryName,
  locationSlug,
  locationName,
  popularCategories,
}: InternalLinksProps) {
  return (
    <div className="mt-16 pt-10 border-t border-[var(--border-color)] space-y-10">
      {/* Services populaires dans cette ville */}
      {popularCategories && popularCategories.length > 0 && (
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Autres services populaires a {locationName}
          </h3>
          <div className="flex flex-wrap gap-3">
            {popularCategories.map(({ category, count }) => (
              <Link
                key={category.id}
                href={`/${category.slug}/${locationSlug}`}
                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {category.name} ({count})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Metiers connexes */}
      {relatedCategories.length > 0 && (
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Metiers connexes
          </h3>
          <div className="flex flex-wrap gap-3">
            {relatedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${cat.slug}/${locationSlug}`}
                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Communes voisines */}
      {nearbyCities.length > 0 && (
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            {currentCategoryName} dans les communes voisines
          </h3>
          <div className="flex flex-wrap gap-3">
            {nearbyCities.map((city) => (
              <Link
                key={city.id}
                href={`/${currentCategorySlug}/${city.slug}`}
                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {currentCategoryName} a {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
