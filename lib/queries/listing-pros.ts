import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getProsByCategoryAndCityIds } from "@/lib/queries/pros";
import { getTopProsByCategoryAndCityIds } from "@/lib/queries/top-pros";

/**
 * Page 1 : sélection existante. Pages 2+ : lots de vingt parmi les autres.
 * La sélection n'est lue qu'une fois par rendu (cache React dans top-pros).
 * On ne charge jamais toute une ville ou un département pour paginer.
 */
export async function getListingPros(
  categoryId: number,
  cityIds: number[],
  page: number,
  topLimit = 10
) {
  const { tops, total } = await getTopProsByCategoryAndCityIds(categoryId, cityIds, topLimit);
  if (page === 1) return { tops, total, pagination: null };

  const remainder = await getProsByCategoryAndCityIds(categoryId, cityIds, {
    page: page - 1,
    pageSize: DEFAULT_PAGE_SIZE,
    excludeIds: tops.map((pro) => pro.id),
  });
  return {
    tops,
    total: tops.length + remainder.count,
    pagination: {
      ...remainder,
      page,
      totalPages: 1 + remainder.totalPages,
    },
  };
}

/** Refuse aussi 2abc, 2.5 et 02 : une seule URL par numéro de page. */
export function parseListingPage(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 2 && page <= 500 ? page : null;
}
