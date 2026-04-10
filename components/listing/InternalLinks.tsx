import Link from "next/link";
import type { Category, City } from "@/lib/types/database";

type InternalLinksProps = {
  relatedCategories: Category[];
  nearbyCities: City[];
  currentCategorySlug: string;
  locationSlug: string;
};

export default function InternalLinks({
  relatedCategories,
  nearbyCities,
  currentCategorySlug,
  locationSlug,
}: InternalLinksProps) {
  return (
    <div className="mt-16 pt-10 border-t border-[var(--border-color)]">
      {relatedCategories.length > 0 && (
        <div className="mb-10">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Autres metiers dans cette zone
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
      {nearbyCities.length > 0 && (
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">
            Villes proches
          </h3>
          <div className="flex flex-wrap gap-3">
            {nearbyCities.map((city) => (
              <Link
                key={city.id}
                href={`/${currentCategorySlug}/${city.slug}`}
                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
