import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getSpecialtiesForMetier } from "@/lib/specialties";

export type PublicListingRefresh = {
  categorySlug: string;
  locationSlug: string;
  count: number;
  /** Les sous-spécialités comptent la commune seule, sans ses arrondissements. */
  specialtyCount?: number;
};

/** Plan littéral, borné aux zones concernées : aucun pattern global de routes. */
export function getProPublicPagePaths(slug: string, listings: PublicListingRefresh[]): string[] {
  const paths = new Set([`/artisan/${slug}`, `/ai/freelance/${slug}`]);
  const addListing = (base: string, count: number) => {
    paths.add(base);
    const lastPage = Math.min(500, 1 + Math.ceil(Math.max(0, count - 10) / DEFAULT_PAGE_SIZE));
    for (let page = 2; page <= lastPage; page++) paths.add(`${base}/page/${page}`);
  };
  for (const listing of listings) {
    addListing(`/${listing.categorySlug}/${listing.locationSlug}`, listing.count);
    if (listing.specialtyCount !== undefined) {
      for (const specialty of getSpecialtiesForMetier(listing.categorySlug)) {
        addListing(`/${listing.categorySlug}/${specialty.slug}/${listing.locationSlug}`, listing.specialtyCount);
      }
    }
  }
  return [...paths];
}
