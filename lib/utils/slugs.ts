import type { Department } from "@/lib/types/database";

export function generateDepartmentSlug(dept: Department): string {
  const name = dept.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${name}-${dept.code}`;
}

export function parseDepartmentSlug(
  slug: string
): { name: string; code: string } | null {
  const match = slug.match(/^(.+)-(\d{2,3})$/);
  if (!match) return null;
  return { name: match[1], code: match[2] };
}
