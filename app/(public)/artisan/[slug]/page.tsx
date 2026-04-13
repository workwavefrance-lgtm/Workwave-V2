import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { getProBySlug, getSimilarPros } from "@/lib/queries/pros";
import { getNearbyCities } from "@/lib/queries/cities";
import ProCard from "@/components/pro/ProCard";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { truncateDescription } from "@/lib/utils/seo";
import { BASE_URL } from "@/lib/constants";
import { toOpeningHoursSpecification, toBreadcrumbSchema } from "@/lib/utils/schema";
import type { OpeningHours, DaySchedule } from "@/lib/types/database";

export const revalidate = 86400;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pro = await getProBySlug(slug);
  if (!pro) return {};

  const cityName = pro.city?.name || "";
  const desc =
    truncateDescription(pro.description) ||
    `${pro.name}, ${pro.category.name} à ${cityName}. Contactez ce professionnel gratuitement.`;

  // noindex si fiche vide (pas reclamee, pas de description, pas de telephone)
  const hasContent = !!(pro.claimed_by_user_id || pro.description || pro.phone);

  return {
    title: `${pro.name} - ${pro.category.name} à ${cityName}`,
    description: desc,
    alternates: {
      canonical: `${BASE_URL}/artisan/${slug}`,
    },
    openGraph: {
      type: "profile",
      title: `${pro.name} - ${pro.category.name} à ${cityName}`,
      description: desc,
      url: `${BASE_URL}/artisan/${slug}`,
    },
    twitter: {
      card: "summary",
      title: `${pro.name} - ${pro.category.name} à ${cityName}`,
      description: desc,
    },
    ...(hasContent ? {} : { robots: { index: false, follow: true } }),
  };
}

const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

const PAYMENT_LABELS: Record<string, string> = {
  CB: "Carte bancaire",
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
};

export default async function ProPage({ params }: Props) {
  const { slug } = await params;
  const pro = await getProBySlug(slug);
  if (!pro) notFound();

  // Charger les pros similaires et villes voisines en parallele
  const [similarPros, nearbyCities] = await Promise.all([
    pro.city ? getSimilarPros(pro.category_id, pro.city.id, slug, 5) : Promise.resolve([]),
    pro.city ? getNearbyCities(pro.city.id, 5) : Promise.resolve([]),
  ]);

  const cityName = pro.city?.name || "";
  const deptSlug = pro.city?.department
    ? generateDepartmentSlug(pro.city.department)
    : "vienne-86";

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: pro.category.name, href: `/${pro.category.slug}/${deptSlug}` },
    ...(pro.city
      ? [
          {
            label: pro.city.name,
            href: `/${pro.category.slug}/${pro.city.slug}`,
          },
        ]
      : []),
    { label: pro.name },
  ];

  const isClaimed = !!pro.claimed_by_user_id;
  const openingHours = pro.opening_hours as OpeningHours | null;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: pro.name,
    url: `${BASE_URL}/artisan/${slug}`,
    ...(pro.description ? { description: pro.description } : {}),
    ...(pro.phone ? { telephone: pro.phone } : {}),
    ...(pro.email ? { email: pro.email } : {}),
    ...(pro.logo_url ? { image: pro.logo_url } : {}),
    address: {
      "@type": "PostalAddress",
      ...(pro.address ? { streetAddress: pro.address } : {}),
      ...(cityName ? { addressLocality: cityName } : {}),
      ...(pro.postal_code ? { postalCode: pro.postal_code } : {}),
      ...(pro.city?.department
        ? { addressRegion: pro.city.department.name }
        : {}),
      addressCountry: "FR",
    },
    ...(pro.city?.latitude && pro.city?.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: pro.city.latitude,
            longitude: pro.city.longitude,
          },
        }
      : {}),
    ...(pro.hourly_rate ? { priceRange: `${pro.hourly_rate} EUR/h` } : {}),
  };

  // OpeningHours (fiches reclamees uniquement)
  if (isClaimed && openingHours) {
    const specs = toOpeningHoursSpecification(openingHours as OpeningHours);
    if (specs.length > 0) {
      jsonLd.openingHoursSpecification = specs;
    }
  }

  // Zone d'intervention
  if (isClaimed && pro.intervention_radius_km && pro.city?.latitude && pro.city?.longitude) {
    jsonLd.areaServed = {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: pro.city.latitude,
        longitude: pro.city.longitude,
      },
      geoRadius: `${pro.intervention_radius_km * 1000}`,
    };
  }

  // BreadcrumbList schema
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const initial = (pro.name || "?").charAt(0).toUpperCase();
  const photos = Array.isArray(pro.photos) ? pro.photos.filter((url): url is string => typeof url === "string" && url.startsWith("http")) : [];
  const certifications = Array.isArray(pro.certifications) ? pro.certifications : [];
  const paymentMethods = Array.isArray(pro.payment_methods) ? pro.payment_methods : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-8">
          {/* En-tete */}
          <div className="flex items-start gap-4">
            {pro.logo_url && pro.logo_url.startsWith("http") ? (
              <img
                src={pro.logo_url}
                alt={`Logo ${pro.name}`}
                className="w-16 h-16 rounded-full object-cover border border-[var(--card-border)] shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--accent-muted)" }}
              >
                <span className="text-[var(--accent)] font-bold text-2xl">
                  {initial}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                {pro.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-block text-[var(--accent-badge-text)] text-sm font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: "var(--accent-muted)" }}
                >
                  {pro.category.name}
                </span>
                {pro.free_quote && isClaimed && (
                  <span className="inline-block bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1 rounded-full">
                    Devis gratuit
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {pro.description && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Description
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {pro.description}
              </p>
            </div>
          )}

          {/* Coordonnees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Adresse */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Adresse
              </h2>
              <p className="text-[var(--text-primary)] text-sm">
                {pro.address || "Non renseignée"}
                {pro.city && (
                  <>
                    <br />
                    {pro.postal_code} {pro.city.name}
                  </>
                )}
              </p>
            </div>

            {/* Telephone */}
            {pro.phone && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                  Téléphone
                </h2>
                <a
                  href={`tel:${pro.phone}`}
                  className="text-[var(--text-primary)] text-sm hover:text-[var(--accent)] transition-colors duration-250"
                >
                  {pro.phone}
                </a>
              </div>
            )}

            {/* Email */}
            {pro.email && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                  Email
                </h2>
                <a
                  href={`mailto:${pro.email}`}
                  className="text-[var(--accent)] text-sm hover:underline"
                >
                  {pro.email}
                </a>
              </div>
            )}

            {/* Site web */}
            {pro.website && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                  Site web
                </h2>
                <a
                  href={pro.website.startsWith("http") ? pro.website : `https://${pro.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] text-sm hover:underline break-all"
                >
                  {pro.website}
                </a>
              </div>
            )}
          </div>

          {/* Certifications (fiches réclamées) */}
          {isClaimed && certifications.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Certifications et labels
              </h2>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-block text-[var(--accent-badge-text)] text-sm font-medium px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-muted)" }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
              {pro.rge_number && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  N° RGE : {pro.rge_number}
                </p>
              )}
            </div>
          )}

          {/* Tarifs (fiches réclamées) */}
          {isClaimed && (pro.hourly_rate || pro.travel_fee) && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Tarifs indicatifs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pro.hourly_rate && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Tarif horaire</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{pro.hourly_rate} &euro;/h</p>
                  </div>
                )}
                {pro.travel_fee && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Frais de déplacement</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{pro.travel_fee} &euro;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modes de paiement (fiches réclamées) */}
          {isClaimed && paymentMethods.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Moyens de paiement
              </h2>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="inline-block bg-[var(--bg-secondary)] border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium px-3 py-1.5 rounded-full"
                  >
                    {PAYMENT_LABELS[method] || method}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Horaires d'ouverture (fiches réclamées) */}
          {isClaimed && openingHours && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Horaires d&apos;ouverture
              </h2>
              <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 space-y-2">
                {Object.entries(DAY_LABELS).map(([key, label]) => {
                  const day = (openingHours as Record<string, DaySchedule>)[key];
                  if (!day) return null;
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className={day.open ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>
                        {label}
                      </span>
                      <span className={day.open ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-tertiary)]"}>
                        {day.open ? `${day.from} — ${day.to}` : "Fermé"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Galerie photos */}
          {photos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Réalisations
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Réalisation ${pro.name} ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-2xl border border-[var(--card-border)]"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Garanties (fiches réclamées) */}
          {isClaimed && (pro.has_rc_pro || pro.has_decennale) && (
            <div className="flex flex-wrap gap-3">
              {pro.has_rc_pro && (
                <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  RC Professionnelle
                </span>
              )}
              {pro.has_decennale && (
                <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Garantie décennale
                </span>
              )}
            </div>
          )}

          {/* Liens retour */}
          <div className="pt-8 border-t border-[var(--border-color)] flex flex-wrap gap-4">
            <Link
              href={`/${pro.category.slug}/${deptSlug}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Tous les {pro.category.name.toLowerCase()}s en{" "}
              {pro.city?.department?.name || "Vienne"}
            </Link>
            {pro.city && (
              <Link
                href={`/${pro.category.slug}/${pro.city.slug}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                {pro.category.name} à {pro.city.name}
              </Link>
            )}
          </div>
        </div>

        {/* Colonne droite — Sidebar sticky */}
        <div className="lg:sticky lg:top-[96px] lg:self-start space-y-6">
          {/* CTA */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">
              Besoin de ce professionnel ?
            </h3>
            {pro.phone ? (
              <a
                href={`tel:${pro.phone}`}
                className="block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
              >
                Contacter ce pro
              </a>
            ) : (
              <Link
                href="/deposer-projet"
                className="block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
              >
                Déposer un projet
              </Link>
            )}
          </div>

          {/* Encart réclamation (fiche non réclamée) */}
          {!isClaimed && pro.siret && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Vous êtes <span className="font-semibold text-[var(--text-primary)]">{pro.name}</span> ?
                Réclamez votre fiche gratuitement pour la compléter et recevoir des clients.
              </p>
              <Link
                href={`/pro/reclamer/${slug}`}
                className="block text-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
              >
                Réclamer cette fiche
              </Link>
            </div>
          )}

          {/* Infos complementaires */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 space-y-4">
            {pro.siret && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                  SIRET
                </h4>
                <p className="text-sm text-[var(--text-secondary)] font-mono">
                  {pro.siret}
                </p>
              </div>
            )}
            {pro.city?.department && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                  Département
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {pro.city.department.name} ({pro.city.department.code})
                </p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                Catégorie
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {pro.category.name}
              </p>
            </div>
            {isClaimed && pro.intervention_radius_km && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                  Zone d&apos;intervention
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {pro.intervention_radius_km} km autour de {cityName || "son adresse"}
                </p>
              </div>
            )}
            {isClaimed && pro.urgency_available && (
              <div>
                <span className="inline-flex items-center gap-1.5 text-[var(--accent)] text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Disponible en urgence
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pros similaires */}
      {similarPros.length > 0 && (
        <div className="mt-16 pt-8 border-t border-[var(--border-color)]">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Autres {pro.category.name.toLowerCase()}s à {cityName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarPros.map((p) => (
              <ProCard key={p.id} pro={p} />
            ))}
          </div>
        </div>
      )}

      {/* Communes voisines */}
      {nearbyCities.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            {pro.category.name} dans les communes voisines
          </h2>
          <div className="flex flex-wrap gap-3">
            {nearbyCities.map((city) => (
              <Link
                key={city.id}
                href={`/${pro.category.slug}/${city.slug}`}
                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {pro.category.name} à {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* RGPD */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)] text-xs text-[var(--text-tertiary)]">
        <p>
          Les informations affichées proviennent de sources publiques (registre
          Sirene).{" "}
          <a
            href={`/artisan/${slug}/supprimer`}
            className="underline hover:text-[var(--accent)] transition-colors duration-250"
          >
            Demander la suppression de cette fiche
          </a>
        </p>
      </div>
    </main>
  );
}
