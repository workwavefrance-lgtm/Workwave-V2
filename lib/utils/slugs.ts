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
  // Accepte les codes num\u00e9riques (2-3 chiffres : 86, 971), les codes Corse
  // alphanum\u00e9riques (2a / 2b) ET les 6 provinces belges (wht/wlg/wna/wbr/
  // wlx/bru, stock\u00e9es en MAJUSCULES en BDD comme la Corse). Code retourn\u00e9 en
  // minuscules (le lookup getDepartmentBySlug le re-majuscule pour la BDD).
  // \u26a0\ufe0f Les codes belges sont une WHITELIST explicite, JAMAIS un pattern
  // g\u00e9n\u00e9rique [a-z]{3} : un pattern g\u00e9n\u00e9rique matcherait des slugs de villes
  // fran\u00e7aises ("saint-malo" \u2192 code "alo") et enverrait chaque r\u00e9solution de
  // ville dans un lookup d\u00e9partement inutile, voire un faux match.
  const match = slug.match(/^(.+)-(\d{2,3}|2[ab]|wht|wlg|wna|wbr|wlx|bru)$/i);
  if (!match) return null;
  return { name: match[1], code: match[2].toLowerCase() };
}
