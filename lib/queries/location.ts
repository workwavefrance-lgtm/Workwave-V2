import { cache } from "react";
import type { ResolvedLocation } from "@/lib/types/database";
import { getDepartmentBySlug } from "./departments";
import { getCityBySlug } from "./cities";

// Regroupe les appels IDENTIQUES faits pendant le rendu d'une meme page
// (`generateMetadata` et la page appellent souvent la meme requete). Next le
// faisait deja, mais en dedoublant la REPONSE HTTP et en gardant la branche non
// lue jusqu'au ramasse-miettes : 512 Mo retenus en production le 09/08/2026.
// Cf. lib/supabase/fetch-supabase.ts. Regrouper le RESULTAT ne coute rien.
export const resolveLocation = cache(async function resolveLocation(
  slug: string
): Promise<ResolvedLocation | null> {
  // 1. Essayer comme département (format "vienne-86")
  const department = await getDepartmentBySlug(slug);
  if (department) {
    return { type: "department", department };
  }

  // 2. Essayer comme ville
  const city = await getCityBySlug(slug);
  if (city) {
    return { type: "city", city };
  }

  return null;
})
