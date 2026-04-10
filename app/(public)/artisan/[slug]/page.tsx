import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { getProBySlug } from "@/lib/queries/pros";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { truncateDescription } from "@/lib/utils/seo";
import { BASE_URL } from "@/lib/constants";

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

  return {
    title: `${pro.name} — ${pro.category.name} à ${cityName}`,
    description: desc,
    alternates: {
      canonical: `${BASE_URL}/artisan/${slug}`,
    },
  };
}

export default async function ProPage({ params }: Props) {
  const { slug } = await params;
  const pro = await getProBySlug(slug);
  if (!pro) notFound();

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: pro.name,
    ...(pro.description ? { description: pro.description } : {}),
    ...(pro.phone ? { telephone: pro.phone } : {}),
    ...(pro.website ? { url: pro.website } : {}),
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
  };

  const initial = pro.name.charAt(0).toUpperCase();

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Colonne gauche — Infos principales */}
        <div className="lg:col-span-2 space-y-8">
          {/* En-tete */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center shrink-0">
              <span className="text-[var(--accent)] font-bold text-2xl">
                {initial}
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                {pro.name}
              </h1>
              <span className="inline-block bg-[var(--accent-muted)] text-[var(--accent-badge-text)] text-sm font-medium px-3 py-1 rounded-full">
                {pro.category.name}
              </span>
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
                  href={pro.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] text-sm hover:underline break-all"
                >
                  {pro.website}
                </a>
              </div>
            )}
          </div>

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

          {/* Réclamer cette fiche */}
          {!pro.claimed_by_user_id && pro.siret && (
            <Link
              href={`/pro/reclamer/${slug}`}
              className="block border border-[var(--border-color)] text-[var(--text-primary)] text-center px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              C&apos;est mon entreprise — Réclamer cette fiche
            </Link>
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
          </div>
        </div>
      </div>

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
