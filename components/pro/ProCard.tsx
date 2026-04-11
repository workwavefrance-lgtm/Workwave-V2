import Link from "next/link";
import type { ProWithRelations } from "@/lib/types/database";

export default function ProCard({ pro }: { pro: ProWithRelations }) {
  const initial = pro.name.charAt(0).toUpperCase();

  return (
    <article className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]">
      <Link href={`/artisan/${pro.slug}`} className="flex gap-4">
        {/* Logo ou initiale */}
        {pro.logo_url ? (
          <img
            src={pro.logo_url}
            alt={`Logo ${pro.name}`}
            className="w-12 h-12 rounded-full object-cover border border-[var(--card-border)] shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-muted)" }}>
            <span className="text-[var(--accent)] font-bold text-lg">
              {initial}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg text-[var(--text-primary)] leading-tight mb-1">
            {pro.name}
          </h3>

          {pro.category?.name && (
            <span className="inline-block text-[var(--accent-badge-text)] text-xs font-medium px-2.5 py-0.5 rounded-full mb-2" style={{ backgroundColor: "var(--accent-muted)" }}>
              {pro.category.name}
            </span>
          )}

          {pro.city && (
            <p className="text-sm text-[var(--text-secondary)]">
              {pro.city.name}
              {pro.postal_code && ` (${pro.postal_code})`}
            </p>
          )}

          {pro.description && (
            <p className="text-sm text-[var(--text-tertiary)] mt-2 line-clamp-2">
              {pro.description}
            </p>
          )}

          {pro.phone && (
            <p className="text-sm font-medium text-[var(--text-primary)] mt-2">
              {pro.phone}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
