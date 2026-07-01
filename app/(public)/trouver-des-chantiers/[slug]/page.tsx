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
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import type { Category, Department } from "@/lib/types/database";

// ISR : revalide chaque jour → nouvelles catégories sans rebuild + purge d'un
// éventuel cache "non trouvé" servi pendant un déploiement. 1j (30/06) au lieu
// de 1h pour réduire l'egress sous crawl (0 impact SEO, données quasi-statiques).
export const revalidate = 86400;

// Programmatique pro-acquisition : décline /trouver-des-chantiers sur chaque
// métier BTP (« trouver des chantiers plombier ») et chaque département
// (« trouver des chantiers en Vienne »). Un SEUL param dynamique [slug] pour
// éviter le conflit de noms de slug Next.js (leçon CLAUDE.md). Statique (SSG).

const BASE_URL = "https://workwave.fr";

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
    title: `Trouver des chantiers en ${r.dept.name} (${r.dept.code}) — 9,90 €/lead`,
    description: `Artisans du ${r.dept.name} (${r.dept.code}) : recevez les demandes de chantiers de votre département et payez 9,90 € pour débloquer un contact. Sans abonnement.`,
    alternates: { canonical: `${BASE_URL}/trouver-des-chantiers/${slug}` },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = await resolveSlug(slug);
  if (!r) notFound();

  // Variables d'affichage selon métier ou département
  const isMetier = r.type === "metier";
  const name = isMetier ? r.cat.name : `${r.dept.name} (${r.dept.code})`;
  const nameLower = isMetier ? r.cat.name.toLowerCase() : r.dept.name;

  const h1 = isMetier
    ? `Vous êtes ${r.cat.name} ? Trouvez des chantiers près de chez vous.`
    : `Trouvez des chantiers en ${r.dept.name}.`;

  const intro = isMetier
    ? `Recevez les demandes des particuliers qui cherchent un ${nameLower} près de chez eux. Vous ne payez 9,90 € que pour débloquer un contact qui vous intéresse — pas d'abonnement, pas de commission sur vos chantiers.`
    : `Recevez les demandes de chantiers des particuliers du ${r.dept.name} (${r.dept.code}), tous métiers du bâtiment. Vous ne payez 9,90 € que pour débloquer un contact qui vous intéresse — sans abonnement ni engagement.`;

  // Maillage interne : vers la page listing correspondante + le hub
  const listingHref = isMetier ? `/${r.cat.slug}` : "/departements";
  const listingLabel = isMetier
    ? `Voir les ${r.cat.name.toLowerCase()}s sur Workwave`
    : `Voir tous les départements`;

  const ctaLabel = isMetier ? `de ${nameLower}` : `en ${r.dept.name}`;

  return (
    <main>
      <JsonLd
        data={getChantiersServiceSchema({
          name: `Trouver des chantiers ${name} — Workwave`,
          areaServed: isMetier ? "France" : r.dept.name,
          description: intro,
        })}
      />
      <JsonLd data={getChantiersFaqSchema()} />

      {/* ===================== HERO (dynamique) ===================== */}
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
              Trouver ma fiche avec mon SIRET
            </Link>
            <Link
              href="/pro/creer-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Créer ma fiche
            </Link>
          </div>
          <p className="mt-5 text-sm text-[var(--text-tertiary)]">
            Inscription gratuite · 9,90 € le lead, sans abonnement
          </p>
        </div>
      </section>

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
