import Link from "next/link";
import type { ReperesFiche } from "@/lib/queries/pros";
import type { CategoryListing } from "@/lib/utils/category-grammar";
import { formatDistanceKm, ordinalFr } from "@/lib/seo/pro-registre";

/**
 * Repères CALCULÉS d'une fiche enrichie : rang d'ancienneté dans sa commune,
 * confrères en activité à moins de 10 km (avec les adresses géolocalisées les
 * plus proches), distance au centre de la commune.
 *
 * Unique par construction : deux fiches voisines n'ont jamais le même rang ni
 * les mêmes plus proches. Chaque ligne n'existe que si son calcul a une base
 * suffisante (lib/queries/pros.ts, getReperesFiche). Rien d'estimé.
 *
 * Composant serveur, aucune requête ici : tout arrive calculé.
 */
export default function ProReperes({
  reperes,
  listing,
  cityName,
}: {
  reperes: ReperesFiche;
  listing: CategoryListing;
  cityName: string;
}) {
  const feminin = listing.article === "une";
  const rang = reperes.rangAnciennete;
  const confreres = reperes.confreres;
  const distance = reperes.distanceCentreKm;

  // Phrases construites en STRING, jamais en JSX interpolé : le compilateur
  // avale les espaces aux frontières {expr}/saut de ligne (bug du 12/08,
  // « Poitierspartent »).
  // Quand toutes les fiches de la commune n'ont pas de date connue (entre
  // 80 et 99 %), la phrase le dit : le rang porte sur les fiches datées.
  const exact = !!rang && rang.total === rang.totalCommune;
  const phraseRang = rang
    ? rang.rang === 1
      ? exact
        ? `${feminin ? "La plus ancienne" : "Le plus ancien"} des ${rang.total} ${listing.plural} en activité de ${cityName}, par date de création.`
        : `${feminin ? "La plus ancienne" : "Le plus ancien"} des ${rang.total} ${listing.plural} de ${cityName} dont la date de création est connue (sur ${rang.totalCommune} en activité).`
      : exact
        ? `${ordinalFr(rang.rang, feminin)} sur ${rang.total} ${listing.plural} en activité de ${cityName}, du plus ancien au plus récent (date de création).`
        : `${ordinalFr(rang.rang, feminin)} sur les ${rang.total} ${listing.plural} de ${cityName} dont la date de création est connue (sur ${rang.totalCommune} en activité), du plus ancien au plus récent.`
    : null;

  let phraseConfreres: string | null = null;
  if (confreres) {
    const n = confreres.total;
    if (n === 0) {
      phraseConfreres = `Aucun${feminin ? "e" : ""} autre ${listing.singular} en activité référencé${feminin ? "e" : ""} dans les communes à moins de 10 km.`;
    } else {
      phraseConfreres = `${n} autre${n > 1 ? "s" : ""} ${n > 1 ? listing.plural : listing.singular} en activité dans les communes à moins de 10 km.`;
    }
  }
  const proches = confreres?.plusProches ?? [];

  const phraseDistance =
    distance != null ? `Adresse à ${formatDistanceKm(distance)} du centre de ${cityName}.` : null;

  if (!phraseRang && !phraseConfreres && !phraseDistance) return null;

  return (
    <section aria-labelledby="titre-reperes">
      <h2
        id="titre-reperes"
        className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3"
      >
        Repères à {cityName}
      </h2>
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 space-y-3">
        {phraseRang && (
          <p className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
            </svg>
            <span>{phraseRang}</span>
          </p>
        )}
        {phraseConfreres && (
          <div className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <div>
              <p>{phraseConfreres}</p>
              {proches.length > 0 && (
                <p className="mt-1 text-[var(--text-secondary)]">
                  {proches.length > 1
                    ? "Les plus proches, parmi les adresses géolocalisées : "
                    : "La plus proche, parmi les adresses géolocalisées : "}
                  {proches.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 ? ", " : ""}
                      <Link href={`/artisan/${p.slug}`} className="text-[var(--accent)] hover:underline">
                        {p.name}
                      </Link>
                      {` (${formatDistanceKm(p.distanceKm)})`}
                    </span>
                  ))}
                  .
                </p>
              )}
            </div>
          </div>
        )}
        {phraseDistance && (
          <p className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="2" />
              <path strokeLinecap="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            </svg>
            <span>{phraseDistance}</span>
          </p>
        )}
        <p className="text-[12px] text-[var(--text-tertiary)] pt-1">
          Calculé sur les fiches en activité référencées sur Workwave, d&apos;après les dates de création et les adresses du registre Sirene.
        </p>
      </div>
    </section>
  );
}
