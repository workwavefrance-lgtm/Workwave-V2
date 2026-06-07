import Link from "next/link";
import type { PriceGuide } from "@/lib/queries/price-guides";

/**
 * Bloc "Projets populaires" : maillage interne par PRESTATION (vs par ville).
 * Reprend la mecanique de travaux.com (grille de liens prestation) mais
 * alimente par nos guides de prix BTP (scope='prestation').
 *
 * Benefice : (a) capte la longue traine transactionnelle ("prix mise aux
 * normes electriques"), (b) distribue le link juice vers les guides de prix,
 * (c) signal de richesse thematique pour Google + LLMs.
 *
 * Composant pur visuel : la query (getPriceGuidesByMetier) est faite cote page.
 */
export default function PopularProjectsBlock({
  guides,
  metierName,
}: {
  guides: Pick<PriceGuide, "slug" | "h1" | "title">[];
  metierName: string;
}) {
  if (!guides.length) return null;

  return (
    <section className="mt-12 pt-10 border-t border-[var(--card-border)]">
      <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[var(--text-primary)] mb-1.5">
        Projets {metierName.toLowerCase()} populaires
      </h2>
      <p className="text-[14px] text-[var(--text-secondary)] mb-7">
        Découvrez les prix et conseils pour les travaux les plus demandés.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/guide-des-prix/${g.slug}`}
            className="group text-[14px] leading-snug text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors border-b border-transparent"
          >
            <span className="border-b border-[var(--card-border)] group-hover:border-[var(--accent)] pb-2 block transition-colors">
              {g.h1 || g.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
