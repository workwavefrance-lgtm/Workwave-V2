import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { getAllDepartmentsPublic } from "@/lib/queries/home-public";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

// Page hub : liste les 107 departements et provinces couverts (France + Belgique francophone) avec liens vers
// les categories vedettes par dept. Cree en commit B de l'audit 2026-05-03
// pour booster la decouverte des pages /[metier]/[dept] hors-Vienne par Google
// (gap d'indexation 226k -> 29k a cause d'un maillage interne trop focalise).
//
// Cible : transmettre du link juice depuis cette page hub (haute autorite,
// linkee par le footer + nav) vers 12 dept x 6 cat vedettes = 72 pages dept.
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

const FEATURED_CATEGORIES: { slug: string; name: string }[] = [
  { slug: "plombier", name: "Plombier" },
  { slug: "electricien", name: "Électricien" },
  { slug: "macon", name: "Maçon" },
  { slug: "peintre", name: "Peintre" },
  { slug: "menuisier", name: "Menuisier" },
  { slug: "menage", name: "Ménage" },
];

export const metadata: Metadata = {
  title: "Professionnels par département en France et en Belgique - Workwave",
  description:
    "Annuaire des artisans et professionnels par département en France et en Belgique francophone. Plus de 2,5 millions de pros référencés dans 107 départements et provinces et 35 163 communes (France métropole et outre-mer + Wallonie et Bruxelles).",
  alternates: {
    canonical: `${BASE_URL}/departements`,
  },
  openGraph: {
    type: "website",
    title: "Professionnels par département en France et en Belgique",
    description:
      "Annuaire des artisans par département en France et en Belgique francophone. 2 500 000+ pros référencés dans 107 départements et provinces.",
    url: `${BASE_URL}/departements`,
  },
};

export default async function DepartmentsHubPage() {
  const supabase = getAdminServiceClient();
  const departments = await getAllDepartmentsPublic();

  // Compter les pros actifs par dept (count estimated rapide).
  // On fait les N queries en parallele.
  const counts = await Promise.all(
    departments.map(async (dept) => {
      const { count } = await supabase
        .from("pros")
        .select("id, city:cities!inner(department_id)", {
          count: "exact",
          head: true,
        })
        .eq("is_active", true)
        .is("deleted_at", null)
        .eq("cities.department_id", dept.id);
      return { deptId: dept.id, count: count || 0 };
    })
  );
  const countByDeptId = new Map(counts.map((c) => [c.deptId, c.count]));

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Départements" },
  ];
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Professionnels par département
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-3xl">
          Plus de 2,5 millions d&apos;artisans et professionnels référencés dans les 101
          départements français et les 6 provinces belges. Choisissez votre territoire pour
          découvrir les pros près de chez vous.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const deptSlug = generateDepartmentSlug(dept);
          const count = countByDeptId.get(dept.id) || 0;
          // Lien principal de la carte : page departement avec la categorie
          // la plus generique (plombier, presente partout). Permet a l'user
          // d'arriver sur une page liste riche, pas juste sur l'index dept.
          const mainHref = `/plombier/${deptSlug}`;

          return (
            <article
              key={dept.id}
              className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {dept.name}
                  </h2>
                  <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                    Département {dept.code}
                  </p>
                </div>
                <span
                  className="inline-block text-[var(--accent-badge-text)] text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: "var(--accent-muted)" }}
                >
                  {count.toLocaleString("fr-FR")} pros
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {FEATURED_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}/${deptSlug}`}
                    className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <Link
                href={mainHref}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Voir tous les artisans en {dept.name}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </article>
          );
        })}
      </div>

      <section className="mt-16 pt-8 border-t border-[var(--border-color)]">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Pourquoi Workwave ?
        </h2>
        <p className="text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Workwave référence gratuitement plus de 2,5 millions de professionnels
          en France et en Belgique francophone, issus des registres SIRENE (France) et BCE (Belgique). Notre annuaire
          couvre les 101 départements français et les 6 provinces belges avec les principaux corps de métier
          du BTP, des services à domicile et de l&apos;aide à la personne. Les
          fiches sont enrichies au fil de l&apos;eau et chaque artisan peut
          réclamer la sienne gratuitement pour la compléter.
        </p>
      </section>
    </main>
  );
}
