import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import ClientsSections from "@/components/clients/ClientsSections";
import {
  getClientsFaqSchema,
  getClientsServiceSchema,
} from "@/lib/data/clients";
import { getAllCategoriesPublic } from "@/lib/queries/home-public";
import type { Category } from "@/lib/types/database";

// ISR : revalide chaque heure → les nouvelles catégories (Vague 3 et au-delà)
// apparaissent sans rebuild, et un éventuel cache "non trouvé" servi pendant un
// déploiement se purge tout seul.
export const revalidate = 3600;

// Programmatique pro-acquisition services : décline /trouver-des-clients sur
// chaque métier domicile + personne ("trouver des clients ménage", "trouver
// des clients garde d'enfants"). Les nouvelles catégories de la Vague 3
// (bricoleur, multiservice…) s'y brancheront automatiquement (vertical domicile).

const BASE_URL = "https://workwave.fr";
const SERVICE_VERTICALS = ["domicile", "personne"] as const;

async function resolveSlug(slug: string): Promise<Category | null> {
  const cats = await getAllCategoriesPublic();
  return (
    cats.find(
      (c) =>
        c.slug === slug &&
        (SERVICE_VERTICALS as readonly string[]).includes(c.vertical)
    ) ?? null
  );
}

export async function generateStaticParams() {
  const cats = await getAllCategoriesPublic();
  return cats
    .filter((c) => (SERVICE_VERTICALS as readonly string[]).includes(c.vertical))
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await resolveSlug(slug);
  if (!cat) return { title: "Trouver des clients", robots: { index: false } };
  const name = cat.name.toLowerCase();
  return {
    title: `Trouver des clients ${name} : 9,90 €/contact, sans abonnement`,
    description: `Vous proposez un service de ${name} ? Recevez les demandes des particuliers près de chez vous et payez 9,90 € seulement pour débloquer les contacts qui vous intéressent. Sans abonnement, sans commission.`,
    alternates: { canonical: `${BASE_URL}/trouver-des-clients/${slug}` },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await resolveSlug(slug);
  if (!cat) notFound();

  const name = cat.name;
  const nameLower = cat.name.toLowerCase();

  return (
    <main>
      <JsonLd
        data={getClientsServiceSchema({
          name: `Trouver des clients ${name} — Workwave`,
          description: `Recevez des demandes de clients en ${nameLower} près de chez vous. 9,90 € le contact, sans abonnement ni commission.`,
        })}
      />
      <JsonLd data={getClientsFaqSchema()} />

      {/* ===================== HERO (dynamique) ===================== */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-semibold text-[var(--accent)] mb-4 tracking-wide uppercase">
            Pour les professionnels · {name}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
            {name} : trouvez des clients près de chez vous.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-10 max-w-2xl mx-auto">
            Recevez les demandes des particuliers qui cherchent un service de{" "}
            {nameLower} près de chez eux. Vous ne payez 9,90 € que pour débloquer
            un contact qui vous intéresse — pas d&apos;abonnement, pas de
            commission sur vos prestations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/pro/creer-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Créer ma fiche gratuitement
            </Link>
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              J&apos;ai déjà un SIRET
            </Link>
          </div>
          <p className="mt-5 text-sm text-[var(--text-tertiary)]">
            Inscription gratuite · 9,90 € le contact, sans abonnement
          </p>
        </div>
      </section>

      <ClientsSections contextLabel={`de ${nameLower}`} />

      {/* ===================== MAILLAGE ===================== */}
      <section className="px-4 pb-16 -mt-8">
        <div className="max-w-3xl mx-auto text-center text-sm text-[var(--text-secondary)] space-x-4">
          <Link
            href="/trouver-des-clients"
            className="hover:text-[var(--accent)] transition-colors duration-250"
          >
            ← Trouver des clients (tous services)
          </Link>
          <Link
            href={`/${cat.slug}`}
            className="hover:text-[var(--accent)] transition-colors duration-250"
          >
            Voir les pros en {nameLower} →
          </Link>
        </div>
      </section>
    </main>
  );
}
