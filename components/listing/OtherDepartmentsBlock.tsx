import Link from "next/link";
import type { Department } from "@/lib/types/database";
import { generateDepartmentSlug } from "@/lib/utils/slugs";

type Props = {
  currentCategorySlug: string;
  currentCategoryName: string;
  currentDepartmentCode: string;
  allDepartments: Department[];
};

/**
 * Bloc "Voir aussi dans les autres departements" affiche en bas des pages
 * /[metier]/[dept]. Pousse le link juice vers les 11 autres pages dept du
 * meme metier, ce qui aide Google a decouvrir et indexer ces pages
 * (audit 2026-05-03 : 226k pros / 29k indexes = pages dept hors-Vienne
 * sous-explorees par Google).
 */
export default function OtherDepartmentsBlock({
  currentCategorySlug,
  currentCategoryName,
  currentDepartmentCode,
  allDepartments,
}: Props) {
  const others = allDepartments.filter(
    (d) => d.code !== currentDepartmentCode
  );

  if (others.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-[var(--border-color)]">
      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {currentCategoryName} dans les autres départements de Nouvelle-Aquitaine
      </h2>
      <div className="flex flex-wrap gap-3">
        {others.map((dept) => (
          <Link
            key={dept.id}
            href={`/${currentCategorySlug}/${generateDepartmentSlug(dept)}`}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
          >
            {currentCategoryName} en {dept.name}{" "}
            <span className="text-[var(--text-tertiary)]">({dept.code})</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
