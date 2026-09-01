import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import ChantiersSections from "@/components/chantiers/ChantiersSections";
import {
  getChantiersFaqSchema,
  getChantiersServiceSchema,
} from "@/lib/data/chantiers";
import {
  getAllCategoriesPublic,
  getAllDepartmentsPublic,
  getCategoryBySlugPublic,
} from "@/lib/queries/home-public";
import { generateDepartmentSlug, formatDepartmentLabel } from "@/lib/utils/slugs";
import { METIER_STATS } from "@/lib/data/metier-stats";
import { SOURCED_PRICES } from "@/lib/data/sourced-prices";
import { CHANTIERS_PRO_CONTENT } from "@/lib/data/chantiers-pro-content";
import { DEPARTMENT_MARKET } from "@/lib/data/department-market";
import type { Category, Department } from "@/lib/types/database";

// ISR : revalide chaque jour → nouvelles catégories sans rebuild + purge d'un
// éventuel cache "non trouvé" servi pendant un déploiement. 1j (30/06) au lieu
// de 1h pour réduire l'egress sous crawl (0 impact SEO, données quasi-statiques).
export const revalidate = 86400;

// Machine à attraction pro (refonte 01/09/2026, maquette validée par Willy).
// La v1 était un gabarit : même phrase sur les 132 pages, seul le nom changeait.
// Cette version rend chaque page FACTUELLEMENT unique sans rien inventer :
//   - compteur réel de pros du métier (lib/data/metier-stats.ts, base, daté) ;
//   - prix sourcés du métier (lib/data/sourced-prices.ts, Perplexity cité) ;
//   - contenu marché pro par métier (lib/data/chantiers-pro-content.ts, sourcé,
//     affiché SEULEMENT si généré : rien ne casse pour un métier manquant) ;
//   - données marché par département (lib/data/department-market.ts, INSEE/DVF).
// Aucune requête base au rendu : tout est statique, ISR-safe.

const BASE_URL = "https://workwave.fr";

// Chiffres transverses AFFICHÉS, avec leur date de mesure. Règle du projet :
// un chiffre écrit est daté et mesuré, et il vaut mieux le re-vérifier à chaque
// gros scrape (cf. leçon des compteurs home du 08/06).
const IMPRESSIONS_28J = "402 000"; // GSC, fenêtre 28 j, mesuré le 29/08/2026
const COMMUNES = "35 163"; // count cities, mesuré le 08/08/2026
const PROS_TOTAL = "2,4 millions"; // count pros actifs, mesuré le 31/08/2026

// Comparatif concurrent : chiffre SOURCÉ uniquement (leçon pub comparative du
// 07/06, L121-8 C. conso). 220 €/mois HT = borne haute de Habitatpresto dans
// lib/data/competitor-offers.ts (price_text "70 € à 220 € / mois HT", sourcé).
const CONCURRENT_MENSUEL_MAX = "220 €";
const CONCURRENT_ANNUEL = "2 640 €"; // 220 x 12, dérivé du chiffre sourcé

function formatCount(n: number): string {
  return n.toLocaleString("fr-FR");
}

type Resolved =
  | { type: "metier"; cat: Category }
  | { type: "dept"; dept: Department }
  | null;

async function resolveSlug(slug: string): Promise<Resolved> {
  // Lookup ciblé par slug (pas la liste complète en cache) → une nouvelle
  // catégorie BTP est résolue immédiatement. Cf. bug Vague 3.
  const cat = await getCategoryBySlugPublic(slug);
  if (cat && cat.vertical === "btp") return { type: "metier", cat };
  // Département : la liste est stable (pas de nouveaux dépts à la volée).
  const depts = await getAllDepartmentsPublic();
  const dept = depts.find((d) => generateDepartmentSlug(d) === slug);
  if (dept) return { type: "dept", dept };
  return null;
}

export async function generateStaticParams() {
  const [cats, depts] = await Promise.all([
    getAllCategoriesPublic(),
    getAllDepartmentsPublic(),
  ]);
  const metiers = cats
    .filter((c) => c.vertical === "btp")
    .map((c) => ({ slug: c.slug }));
  const departements = depts.map((d) => ({ slug: generateDepartmentSlug(d) }));
  return [...metiers, ...departements];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveSlug(slug);
  if (!r) return { title: "Trouver des chantiers", robots: { index: false } };

  if (r.type === "metier") {
    const name = r.cat.name.toLowerCase();
    return {
      title: `Trouver des chantiers ${name} : 9,90 €/lead, sans abonnement`,
      description: `Vous êtes ${r.cat.name.toLowerCase()} ? Recevez les demandes de votre zone et payez 9,90 € pour débloquer un contact. Sans abonnement, sans commission.`,
      alternates: { canonical: `${BASE_URL}/trouver-des-chantiers/${slug}` },
    };
  }
  return {
    title: `Trouver des chantiers en ${formatDepartmentLabel(r.dept)} · 9,90 €/lead`,
    description: `Artisans du ${formatDepartmentLabel(r.dept)} : recevez les demandes de chantiers de votre département et payez 9,90 € pour débloquer un contact. Sans abonnement.`,
    alternates: { canonical: `${BASE_URL}/trouver-des-chantiers/${slug}` },
  };
}

/** Carte de statistique du bandeau héro. */
function Stat({ valeur, legende }: { valeur: string; legende: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 text-left">
      <span className="block text-2xl font-extrabold tracking-tight text-[var(--text-primary)] tabular-nums">
        {valeur}
      </span>
      <span className="text-sm text-[var(--text-secondary)]">{legende}</span>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = await resolveSlug(slug);
  if (!r) notFound();

  const isMetier = r.type === "metier";
  const name = isMetier ? r.cat.name : formatDepartmentLabel(r.dept);
  const nameLower = isMetier ? r.cat.name.toLowerCase() : r.dept.name;

  // ── Données uniques du métier (toutes réelles, toutes optionnelles) ──
  const count = isMetier ? METIER_STATS[r.cat.slug] : undefined;
  const hasCount = typeof count === "number" && count > 0;
  const prices = isMetier ? SOURCED_PRICES[r.cat.slug] : undefined;
  const proContent = isMetier ? CHANTIERS_PRO_CONTENT[r.cat.slug] : undefined;
  // Le chantier le plus cher du métier : c'est lui qui porte l'argument
  // « un seul chantier rembourse des centaines de contacts à 9,90 € ».
  const topPrice = prices?.ranges?.length
    ? prices.ranges[prices.ranges.length - 1]
    : null;

  // ── Données uniques du département (gate de couverture, leçon du 07/06 :
  // n'afficher une stat que si elle existe, jamais de repli inventé) ──
  const market = !isMetier ? DEPARTMENT_MARKET[r.dept.code] : undefined;

  // L'accroche « votre fiche existe déjà » (effet propriétaire, maquette
  // validée) n'est servie que si on peut l'appuyer d'un compteur réel.
  const h1 = isMetier
    ? hasCount
      ? `Votre fiche ${nameLower} existe déjà. Réclamez-la, les clients arrivent.`
      : `Vous êtes ${r.cat.name} ? Trouvez des chantiers près de chez vous.`
    : `Trouvez des chantiers en ${r.dept.name}.`;

  const intro = isMetier
    ? hasCount
      ? `Workwave référence déjà ${formatCount(count)} ${nameLower}s en France et en Belgique, à partir des registres officiels. La vôtre en fait sûrement partie : la réclamer est gratuit, prend 3 minutes, et vos 2 premiers contacts clients sont offerts.`
      : `Recevez les demandes des particuliers qui cherchent un ${nameLower} près de chez eux. Vous ne payez 9,90 € que pour débloquer un contact qui vous intéresse : pas d'abonnement, pas de commission sur vos chantiers.`
    : `Recevez les demandes de chantiers des particuliers du ${formatDepartmentLabel(r.dept)}, tous métiers du bâtiment. Vous ne payez 9,90 € que pour débloquer un contact qui vous intéresse, sans abonnement ni engagement.`;

  const listingHref = isMetier ? `/${r.cat.slug}` : "/departements";
  const listingLabel = isMetier
    ? `Voir les ${nameLower}s sur Workwave`
    : `Voir tous les départements`;
  const ctaLabel = isMetier ? `de ${nameLower}` : `en ${r.dept.name}`;

  return (
    <main>
      <JsonLd
        data={getChantiersServiceSchema({
          name: `Trouver des chantiers ${name} · Workwave`,
          areaServed: isMetier ? "France" : r.dept.name,
          description: intro,
        })}
      />
      <JsonLd data={getChantiersFaqSchema()} />

      {/* ===================== HERO ===================== */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-semibold text-[var(--accent)] mb-4 tracking-wide uppercase">
            Pour les artisans · {name}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
            {h1}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-10 max-w-2xl mx-auto">
            {intro}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              {hasCount ? "Retrouver ma fiche avec mon SIRET" : "Trouver ma fiche avec mon SIRET"}
            </Link>
            <Link
              href="/pro/creer-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Créer ma fiche
            </Link>
          </div>
          <p className="mt-5 text-sm text-[var(--text-tertiary)]">
            Inscription gratuite · 9,90 € le contact, les 2 premiers offerts · zéro abonnement
          </p>

          {/* Bandeau de stats : chaque valeur est réelle, mesurée et datée dans
              les constantes en tête de fichier. Le compteur métier vient de la
              base (metier-stats). */}
          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            {isMetier && hasCount ? (
              <Stat valeur={formatCount(count)} legende={`${nameLower}s référencés sur Workwave`} />
            ) : (
              <Stat valeur={PROS_TOTAL} legende="professionnels référencés" />
            )}
            <Stat valeur={IMPRESSIONS_28J} legende="affichages Google en 28 jours" />
            <Stat valeur={COMMUNES} legende="communes couvertes, France et Belgique" />
          </div>
        </div>
      </section>

      {/* ===================== MARCHÉ DU MÉTIER (sourcé, conditionnel) ===================== */}
      {isMetier && proContent && (
        <section className="px-4 py-14 bg-[var(--bg-secondary)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              La demande en {nameLower} aujourd&apos;hui
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">{proContent.marche}</p>
            {proContent.chantiersDemandes.length > 0 && (
              <>
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                  Les chantiers les plus demandés
                </h3>
                <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                  {proContent.chantiersDemandes.map((c) => (
                    <li
                      key={c}
                      className="text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {proContent.saisonnalite && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                {proContent.saisonnalite}
              </p>
            )}
            {proContent.conseils.length > 0 && (
              <>
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                  Décrocher plus de chantiers
                </h3>
                <ol className="space-y-2 mb-6">
                  {proContent.conseils.map((c, i) => (
                    <li key={c} className="text-sm text-[var(--text-secondary)] leading-relaxed flex gap-3">
                      <span className="text-[var(--accent)] font-bold shrink-0">{i + 1}.</span>
                      {c}
                    </li>
                  ))}
                </ol>
              </>
            )}
            {proContent.sources.length > 0 && (
              <p className="text-xs text-[var(--text-tertiary)]">
                Sources ({proContent.retrievedAt}) :{" "}
                {proContent.sources.slice(0, 3).map((s, i) => (
                  <span key={s}>
                    {i > 0 && " · "}
                    <a href={s} rel="nofollow noopener" target="_blank" className="underline hover:text-[var(--accent)]">
                      {new URL(s).hostname.replace("www.", "")}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ===================== CE QUE RAPPORTE UN CHANTIER (prix sourcés) ===================== */}
      {isMetier && topPrice && (
        <section className="px-4 py-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              Un seul chantier rembourse des dizaines de contacts
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              En France, « {topPrice.label.toLowerCase()} » se facture{" "}
              <strong className="text-[var(--text-primary)]">{topPrice.range}</strong> (prix
              sourcés, {prices!.retrievedAt.slice(0, 4)}). Un contact Workwave coûte 9,90 €,
              et vous lisez le détail du projet avant de décider de le débloquer.
            </p>
            <div className="flex flex-wrap items-center gap-4 bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] rounded-2xl px-6 py-5">
              <span className="text-2xl font-extrabold text-[var(--text-primary)]">9,90 €</span>
              <span className="text-sm text-[var(--text-secondary)]">
                par contact débloqué · les 2 premiers offerts · zéro abonnement
              </span>
              <span className="text-sm text-[var(--text-tertiary)] line-through">
                jusqu&apos;à {CONCURRENT_MENSUEL_MAX}/mois HT ailleurs, soit {CONCURRENT_ANNUEL}/an
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ===================== MARCHÉ DU DÉPARTEMENT (INSEE/DVF, conditionnel) ===================== */}
      {!isMetier && market && (market.logements_vacants || market.prix_m2_moyen) && (
        <section className="px-4 py-14 bg-[var(--bg-secondary)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              Le gisement de chantiers en {r.dept.name}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              {market.logements_vacants && (
                <Stat
                  valeur={formatCount(market.logements_vacants)}
                  legende={`logements vacants (LOVAC ${market.lovac_annee}) : autant de rénovations potentielles`}
                />
              )}
              {market.prix_m2_moyen && (
                <Stat
                  valeur={`${formatCount(market.prix_m2_moyen)} €/m²`}
                  legende={`prix immobilier moyen (DVF ${market.dvf_annee})`}
                />
              )}
              {market.revenu_median && (
                <Stat
                  valeur={`${formatCount(market.revenu_median)} €`}
                  legende={`revenu médian des ménages (INSEE ${market.filosofi_annee})`}
                />
              )}
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              Données publiques officielles, agrégées sur les {market.nb_communes} communes du
              département.
            </p>
          </div>
        </section>
      )}

      <ChantiersSections contextLabel={ctaLabel} />

      {/* ===================== MAILLAGE ===================== */}
      <section className="px-4 pb-16 -mt-8">
        <div className="max-w-3xl mx-auto text-center text-sm text-[var(--text-secondary)] space-x-4">
          <Link
            href="/trouver-des-chantiers"
            className="hover:text-[var(--accent)] transition-colors duration-250"
          >
            ← Trouver des chantiers (tous métiers)
          </Link>
          <Link
            href={listingHref}
            className="hover:text-[var(--accent)] transition-colors duration-250"
          >
            {listingLabel} →
          </Link>
        </div>
      </section>
    </main>
  );
}
