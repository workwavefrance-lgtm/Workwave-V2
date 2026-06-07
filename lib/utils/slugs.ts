import type { Department } from "@/lib/types/database";

export function generateDepartmentSlug(dept: Department): string {
  const name = dept.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // .toLowerCase() sur le code : num\u00e9rique inchang\u00e9 ("86" -> "86"), Corse
  // normalis\u00e9e ("2A" -> "2a") pour un slug propre + coh\u00e9rent (corse-du-sud-2a).
  return `${name}-${dept.code.toLowerCase()}`;
}

export function parseDepartmentSlug(
  slug: string
): { name: string; code: string } | null {
  // Accepte les codes num\u00e9riques (2-3 chiffres : 86, 971) ET les codes Corse
  // alphanum\u00e9riques (2a / 2b). Code retourn\u00e9 en minuscules (le lookup
  // getDepartmentBySlug le re-majuscule pour matcher la BDD "2A"/"2B").
  const match = slug.match(/^(.+)-(\d{2,3}|2[ab])$/i);
  if (!match) return null;
  return { name: match[1], code: match[2].toLowerCase() };
}
