import Link from "next/link";

type Cat = { slug: string; name: string };

/**
 * Bloc « Trouvez un artisan près de chez vous » — maillage interne des pages
 * baromètre (observatoire) vers les pages racine métier /[metier] qui ciblent
 * « métier autour de moi ». Transmet l'autorité du linkbait aux pages qui
 * convertissent, et renforce l'angle proximité pour Google.
 */
export default function ProximityLinks({ categories }: { categories: Cat[] }) {
  if (!categories.length) return null;
  return (
    <section className="mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
        Trouvez un artisan près de chez vous
      </h2>
      <p className="text-[var(--text-secondary)] mb-6">
        Choisissez votre métier : nous vous montrons les professionnels de votre secteur.
      </p>
      <div className="flex flex-wrap gap-2.5">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
          >
            {c.name} autour de moi
          </Link>
        ))}
      </div>
    </section>
  );
}
