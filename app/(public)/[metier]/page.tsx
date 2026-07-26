import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import GeolocSearch from "@/components/search/GeolocSearch";
import {
  getCategoryBySlug,
  getAllCategories,
} from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getCitiesByDepartment, getTotalCitiesCount } from "@/lib/queries/cities";
import {
  generateDepartmentSlug,
  formatDepartmentLabel,
  departmentCountryName,
} from "@/lib/utils/slugs";
import { SOURCED_PRICES } from "@/lib/data/sourced-prices";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 2592000; // 30j (15/06) : egress Supabase 313% sous crawl ; donnees Sirene statiques, 0 impact SEO ; deploiement reset le cache ISR. // 7j (13/06)

type Props = {
  params: Promise<{ metier: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  const category = await getCategoryBySlug(metier);
  if (!category) return {};

  const lower = category.name.toLowerCase();
  // « autour de moi » = la requête EXACTE tapée par les internautes (201 requêtes
  // dans la GSC, positions 8-12). On la met en tête du title (Google la pèse
  // fort). PAS de « | Workwave » ici : le layout l'ajoute déjà via
  // title.template (sinon on l'avait 2 fois).
  const title = `${category.name} autour de moi — devis gratuits près de chez vous`;
  const description = `Un ${lower} autour de moi ? Géolocalisez-vous ou choisissez votre ville pour voir les ${lower}s disponibles à proximité. Prix indicatifs, devis gratuits, service 100% gratuit.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${metier}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE_URL}/${metier}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Bandeau « Déposer votre projet » — la conversion monétisable de Workwave.
 *
 * Répété tout au long de la page (page longue → une dizaine de rappels, choix
 * Willy 26/07). Pousse vers le tunnel de dépôt PLUTÔT que vers « appeler un
 * pro » : c'est le chemin qui rapporte (le pro paie 9,90 € le lead) et ça évite
 * que le particulier appelle un numéro en clair sans passer par nous.
 *
 * `variant="primary"` = gros bloc du hero ; `variant="band"` = bandeau slim
 * entre deux sections.
 */
function DeposerCta({
  metierSlug,
  lower,
  variant = "band",
}: {
  metierSlug: string;
  lower: string;
  variant?: "primary" | "band";
}) {
  const href = `/deposer-projet?categorie=${metierSlug}`;
  if (variant === "primary") {
    return (
      <div>
        <Link
          href={href}
          className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-lg sm:text-xl px-10 sm:px-14 py-5 sm:py-6 rounded-full transition-all duration-250 hover:-translate-y-0.5 shadow-md"
        >
          Déposer votre projet — gratuit
          <span aria-hidden className="transition-transform duration-250 group-hover:translate-x-1">
            →
          </span>
        </Link>

        {/* Réassurance : lever le doute juste avant le clic (points vrais). */}
        <p className="mt-4 text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
          Décrivez votre besoin en 2 minutes. Les {lower}s qualifiés de votre
          zone vous recontactent avec leur devis — vous comparez, vous choisissez,
          sans aucune obligation.
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[var(--text-tertiary)]">
          {[
            "100% gratuit",
            "Artisans vérifiés au registre officiel",
            "Sans inscription, sans engagement",
          ].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <span className="text-[var(--accent)] font-bold" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="my-12 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="font-semibold text-[var(--text-primary)] text-lg">
          Un projet de {lower} ?
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          Décrivez-le en 2 minutes, recevez plusieurs devis gratuits — sans
          appeler les artisans un par un.
        </p>
      </div>
      <Link
        href={href}
        className="shrink-0 inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full transition-all duration-250 hover:-translate-y-0.5"
      >
        Déposer votre projet
      </Link>
    </div>
  );
}

export default async function MetierProximityPage({ params }: Props) {
  const { metier } = await params;
  const category = await getCategoryBySlug(metier);
  if (!category) notFound();

  // Anti-fuite vertical : AUCUNE catégorie tech ne doit s'afficher sur une route
  // BTP. On teste le VERTICAL (pas une liste d'ids) → couvre les 145 catégories
  // tech, pas seulement les 14 d'AI_CATEGORY_IDS (sinon les 131 sous-catégories
  // tech orphelines — react, python, prompt-engineering, ux-designer… — fuyaient
  // sur /[slug]/[ville] côté BTP). Redirect 308 vers /ai/[slug] (bon vertical).
  if (category.vertical === "tech") {
    permanentRedirect(`/ai/${category.slug}`);
  }

  // Charger tous les départements + leurs villes (parallèle). On limite à 15
  // villes/dept (top population) : la page n'affiche que 10/dept + 12 géoloc.
  // Avant : ~34 000 communes chargées → timeout + egress (16/06).
  const departments = await getAllDepartments();
  const [deptsWithCities, totalCities] = await Promise.all([
    Promise.all(
      departments.map(async (dept) => ({
        dept,
        cities: await getCitiesByDepartment(dept.id, 15),
      }))
    ),
    getTotalCitiesCount(), // vrai total "X villes couvertes" sans charger les lignes
  ]);

  // Liste plate des villes (avec lat/lng) pour la géoloc client
  const allCitiesForGeoloc = deptsWithCities.flatMap((d) =>
    d.cities
      .filter(
        (c) => typeof c.latitude === "number" && typeof c.longitude === "number"
      )
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        lat: c.latitude as number,
        lng: c.longitude as number,
      }))
  );

  // Métiers similaires (même vertical)
  const allCategories = await getAllCategories();
  const relatedCategories = allCategories
    .filter((c) => c.vertical === category.vertical && c.id !== category.id)
    .slice(0, 12);

  const lower = category.name.toLowerCase();

  // Prix sourcés (Perplexity, cités, zéro invention). Présents pour une partie
  // des métiers seulement → le bloc se cache proprement si absent (pas de trou).
  const priceEntry = SOURCED_PRICES[category.slug];

  // Breadcrumb
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: category.name },
  ];
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  // FAQ proximity-focused
  const faqs = [
    {
      question: `Comment trouver un ${lower} autour de moi ?`,
      answer: `Cliquez sur "Trouver un ${lower} près de moi" pour vous géolocaliser, ou tapez le nom de votre ville. Vous pouvez aussi déposer votre projet en 2 minutes : nous transmettons votre demande aux ${lower}s de votre zone, qui vous envoient leurs devis directement.`,
    },
    ...(priceEntry
      ? [
          {
            question: `Combien coûte un ${lower} ?`,
            answer: `À titre indicatif : ${priceEntry.ranges
              .slice(0, 4)
              .map((r) => `${r.label.toLowerCase()} ${r.range}`)
              .join(", ")}. Ces fourchettes varient selon les travaux, la région et l'urgence — seul un devis personnalisé donne un tarif précis. Déposez votre projet pour recevoir plusieurs devis gratuits et comparer.`,
          },
        ]
      : [
          {
            question: `Combien coûte un ${lower} en moyenne ?`,
            answer: `Les tarifs varient selon la nature des travaux, la zone géographique et l'urgence. Workwave vous permet de demander des devis gratuits à plusieurs ${lower}s pour comparer en toute transparence avant de vous engager.`,
          },
        ]),
    {
      question: `Puis-je trouver un ${lower} disponible le week-end ou en urgence ?`,
      answer: `Oui. De nombreux ${lower}s référencés sur Workwave interviennent en urgence et certains sont disponibles 7j/7. Indiquez l'urgence dans votre demande de devis pour être contacté rapidement.`,
    },
    {
      question: `Workwave est-il vraiment gratuit pour les particuliers ?`,
      answer: `100% gratuit, toujours. Aucune carte bancaire demandée, aucun frais caché. Les ${lower}s reçoivent gratuitement vos demandes de devis et paient seulement 9,90 € pour débloquer les coordonnées d'un client qui les intéresse — sans abonnement ni commission.`,
    },
    {
      question: `Comment vérifier qu'un ${lower} est sérieux ?`,
      answer: `Chaque fiche pro affiche le SIRET officiel, l'année de création, les certifications (RGE, Qualibat, assurance décennale) et les moyens de paiement acceptés. Vous pouvez tout vérifier sur le registre Sirene avant de prendre contact.`,
    },
  ];

  // Schema.org Service
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${category.name} en France et en Belgique`,
    serviceType: category.name,
    description:
      category.description ||
      `Trouvez un ${lower} près de chez vous avec Workwave.`,
    provider: {
      "@type": "Organization",
      name: "Workwave",
      url: BASE_URL,
    },
    areaServed: deptsWithCities.map(({ dept }) => ({
      "@type": "AdministrativeArea",
      name: formatDepartmentLabel(dept),
      containedInPlace: {
        "@type": "Country",
        name: departmentCountryName(dept),
      },
    })),
  };

  // Schema.org FAQPage
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <main>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={faqJsonLd} />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero proximity — CTA dépôt en PRINCIPAL, géoloc en secondaire */}
        <section className="mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] mb-4 leading-[1.1]">
            Trouvez votre {lower}{" "}
            <span className="text-[var(--accent)]">autour de vous</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mb-8">
            {totalCities > 0
              ? `${totalCities} villes couvertes`
              : "Service gratuit"}{" "}
            — devis gratuits, intervention rapide, sans intermédiaire commercial.
          </p>

          {/* CTA principal : déposer un projet */}
          <DeposerCta metierSlug={category.slug} lower={lower} variant="primary" />

          {/* Alternative discrète : trouver un pro par ville / géoloc */}
          <div className="mt-10 pt-6 border-t border-[var(--card-border)]">
            <p className="text-xs text-[var(--text-tertiary)] mb-2">
              Ou parcourez les {lower}s d&apos;une ville :
            </p>
            <GeolocSearch
              metierSlug={category.slug}
              metierName={category.name}
              cities={allCitiesForGeoloc}
              compact
            />
          </div>
        </section>

        {/* Prix sourcés (uniquement si dispo pour ce métier) */}
        {priceEntry && (
          <section className="mb-16 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
              Combien coûte un {lower} ? Prix indicatifs
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Voici des fourchettes de prix couramment constatées pour un {lower}.
              Elles dépendent des travaux, de la région et de l&apos;urgence :
              seul un devis personnalisé donne un tarif exact. Le meilleur moyen
              de comparer reste de{" "}
              <Link
                href={`/deposer-projet?categorie=${category.slug}`}
                className="text-[var(--accent)] underline hover:no-underline"
              >
                décrire votre projet pour recevoir plusieurs devis gratuits
              </Link>
              .
            </p>
            <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden">
              {priceEntry.ranges.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-4 px-5 py-4 ${
                    i % 2 === 0 ? "bg-[var(--bg-secondary)]" : "bg-[var(--card-bg)]"
                  }`}
                >
                  <span className="text-sm text-[var(--text-primary)]">
                    {r.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {r.range}
                  </span>
                </div>
              ))}
            </div>
            {priceEntry.sources?.length > 0 && (
              <p className="text-xs text-[var(--text-tertiary)] mt-3">
                Sources :{" "}
                {priceEntry.sources.map((src, i) => {
                  let host = src;
                  try {
                    host = new URL(src).hostname.replace(/^www\./, "");
                  } catch {
                    /* garde src brut si URL invalide */
                  }
                  return (
                    <span key={i}>
                      {i > 0 && ", "}
                      <a
                        href={src}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        {host}
                      </a>
                    </span>
                  );
                })}
                {priceEntry.retrievedAt ? ` · relevé ${priceEntry.retrievedAt}` : ""}
              </p>
            )}
          </section>
        )}

        {/* Carte des départements actifs */}
        {deptsWithCities.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
              Choisissez votre département
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {deptsWithCities.map(({ dept, cities }) => {
                const slug = generateDepartmentSlug(dept);
                return (
                  <Link
                    key={dept.id}
                    href={`/${category.slug}/${slug}`}
                    className="group bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
                  >
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">
                      Département {dept.code}
                    </div>
                    <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-250 mb-2">
                      {dept.name}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {cities.length} villes · {dept.region}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA intermédiaire */}
        <DeposerCta metierSlug={category.slug} lower={lower} />

        {/* Pourquoi déposer un projet plutôt qu'appeler */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Déposer un projet ou appeler un {lower} ?
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
            <p>
              Vous pouvez contacter un {lower} directement depuis sa fiche. Mais
              si vous voulez <strong>comparer plusieurs devis</strong> sans passer
              votre après-midi au téléphone, décrire votre projet une seule fois
              est bien plus rapide : nous le transmettons aux {lower}s de votre
              zone, et <strong>ceux que ça intéresse vous recontactent</strong>.
            </p>
            <p>
              C&apos;est <strong>100% gratuit</strong> pour vous, sans création de
              compte et sans engagement. Vous ne subissez aucun démarchage : ce
              sont les artisans qui viennent à vous, avec leur proposition.
            </p>
          </div>
          <div className="mt-6">
            <DeposerCta metierSlug={category.slug} lower={lower} variant="primary" />
          </div>
        </section>

        {/* Top villes par département (max 10 par dept) */}
        {deptsWithCities.map(({ dept, cities }) => (
          <section key={dept.id} className="mb-16">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
              {category.name} dans les principales villes — {dept.name} (
              {dept.code})
            </h2>
            <div className="flex flex-wrap gap-3">
              {cities.slice(0, 10).map((city) => (
                <Link
                  key={city.id}
                  href={`/${category.slug}/${city.slug}`}
                  className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
                >
                  {city.name}
                </Link>
              ))}
              {cities.length > 10 && (
                <Link
                  href={`/${category.slug}/${generateDepartmentSlug(dept)}`}
                  className="px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] rounded-full text-sm font-medium hover:bg-[var(--accent)]/20 transition-all duration-250"
                >
                  + {cities.length - 10} autres villes
                </Link>
              )}
            </div>
          </section>
        ))}

        {/* CTA intermédiaire */}
        <DeposerCta metierSlug={category.slug} lower={lower} />

        {/* Intro SEO long-form (proximity-focused) */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Comment trouver un {lower} autour de moi ?
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
            <p>
              Que vous cherchiez un {lower} pour un dépannage urgent, des
              travaux planifiés ou un projet de rénovation, Workwave référence
              des centaines d&apos;artisans qualifiés autour de vous. Géolocalisez-vous
              pour voir directement les {lower}s les plus proches, ou choisissez
              votre ville dans la liste des départements couverts.
            </p>
            <p>
              Tous les {lower}s référencés sur Workwave sont des entreprises
              immatriculées au registre Sirene. Vous pouvez consulter leur
              SIRET, leur année de création, leurs certifications (RGE,
              Qualibat, assurance décennale, garantie décennale) et leur zone
              d&apos;intervention avant de les contacter. Workwave est et reste
              100% gratuit pour les particuliers, sans frais cachés ni
              commission sur vos devis.
            </p>
            <p>
              Pour aller plus vite, vous pouvez{" "}
              <Link
                href={`/deposer-projet?categorie=${category.slug}`}
                className="text-[var(--accent)] underline hover:no-underline"
              >
                déposer votre projet en quelques minutes
              </Link>{" "}
              : nous transmettons votre demande à plusieurs {lower}s pertinents
              dans votre zone. Vous recevez ensuite leurs devis directement,
              sans perdre de temps à les contacter un par un.
            </p>
          </div>
        </section>

        {/* FAQ accordéon (le composant inclut son propre H2) */}
        <FaqAccordion faqs={faqs} />

        {/* CTA après FAQ */}
        <DeposerCta metierSlug={category.slug} lower={lower} />

        {/* Métiers similaires */}
        {relatedCategories.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
              Autres métiers similaires
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
