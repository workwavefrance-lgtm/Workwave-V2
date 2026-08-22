import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import ProximityLinks from "@/components/barometre/ProximityLinks";
import ObservatoireNav from "@/components/barometre/ObservatoireNav";
import { getAllCategories } from "@/lib/queries/categories";
import { METIER_STATS } from "@/lib/data/metier-stats";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 2592000;
const PATH = "/barometre-metiers-artisans";
const YEAR = 2026;

export const metadata: Metadata = {
  title: `Les métiers artisanaux les plus répandus en France ${YEAR}`,
  description: `Quel est le métier artisanal le plus répandu en France ? Classement des métiers du bâtiment, des services à domicile et de l'aide à la personne par nombre d'entreprises. Données SIRENE.`,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    type: "article",
    title: `Les métiers artisanaux les plus répandus en France ${YEAR}`,
    description: `Classement des métiers artisanaux par nombre d'entreprises. Données SIRENE.`,
    url: `${BASE_URL}${PATH}`,
  },
};

const grp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const VLAB: Record<string, string> = { btp: "Bâtiment", domicile: "Services à domicile", personne: "Aide à la personne" };

export default async function BarometreMetiersPage() {
  const cats = await getAllCategories();
  const ranked = cats
    .filter((c) => ["btp", "domicile", "personne"].includes(c.vertical))
    .map((c) => ({ slug: c.slug, name: c.name, vertical: c.vertical, pros: METIER_STATS[c.slug] || 0 }))
    .filter((c) => c.pros >= 100) // exclut les métiers non encore référencés (0 fiche)
    .sort((a, b) => b.pros - a.pros)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const total = ranked.reduce((a, b) => a + b.pros, 0);
  const top = ranked[0];
  const maxP = top.pros;
  const top20 = ranked.slice(0, 20);
  const rarest = ranked.slice(-5).reverse();
  const proximityCats = ranked.map((c) => ({ slug: c.slug, name: c.name }));

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Les métiers les plus répandus" },
  ];

  const faq = [
    { q: `Quel est le métier artisanal le plus répandu en France ?`, a: `${top.name} arrive en tête avec ${grp(top.pros)} entreprises référencées, devant ${ranked[1].name} (${grp(ranked[1].pros)}) et ${ranked[2].name} (${grp(ranked[2].pros)}).` },
    { q: `Combien de métiers artisanaux sont référencés ?`, a: `Ce classement couvre ${ranked.length} métiers du bâtiment, des services à domicile et de l'aide à la personne, soit ${grp(total)} entreprises au total (source : répertoire SIRENE de l'INSEE).` },
    { q: `Comment ce classement est-il établi ?`, a: `Il compte le nombre d'entreprises actives par métier, référencées par Workwave depuis le répertoire SIRENE (INSEE). Il s'agit d'entreprises immatriculées, pas nécessairement toutes en activité à temps plein.` },
  ];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Les métiers artisanaux les plus répandus en France ${YEAR}`,
    description: `Classement de ${ranked.length} métiers artisanaux par nombre d'entreprises actives en France (${grp(total)} entreprises).`,
    creator: { "@type": "Organization", name: "Workwave", url: BASE_URL },
    // Google reclame le champ "license" sur tout Dataset (avertissement dans
    // la Search Console). CC BY 4.0 : reutilisation libre, y compris
    // commerciale, a condition de citer Workwave.fr. Compatible avec la
    // Licence Ouverte 2.0 d'Etalab qui couvre nos sources INSEE, et invite
    // les reprises a nous citer, donc a nous lier.
    license: "https://creativecommons.org/licenses/by/4.0/",
    temporalCoverage: String(YEAR),
    url: `${BASE_URL}${PATH}`,
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <main>
      <JsonLd data={toBreadcrumbSchema(breadcrumbItems, BASE_URL)} />
      <JsonLd data={datasetSchema} />
      <JsonLd data={faqSchema} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <Breadcrumb items={breadcrumbItems} />

        <section className="mb-12">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] mb-3">Observatoire Workwave</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-5">
            Les métiers artisanaux les plus répandus en France {YEAR}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Menuisier, maçon, professeur particulier, femme de ménage… Quels métiers comptent le plus
            d&apos;entreprises en France ? Voici le classement de <strong className="text-[var(--text-primary)]">{ranked.length} métiers</strong> et
            {" "}<strong className="text-[var(--text-primary)]">{grp(total)} entreprises</strong>, du bâtiment à l&apos;aide à la personne.
          </p>
          <div className="mt-8 rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8">
            <p className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Le métier le plus répandu : <span className="text-[var(--accent)]">{top.name}</span>, avec {grp(top.pros)} entreprises.
            </p>
          </div>
        </section>

        {/* Top 20 */}
        <section className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">Le top 20 des métiers</h2>
          <ul className="space-y-2.5">
            {top20.map((r) => (
              <li key={r.slug} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-sm font-semibold text-[var(--text-tertiary)] text-right">{r.rank}</span>
                <Link href={`/${r.slug}`} className="w-40 sm:w-52 shrink-0 text-sm text-[var(--text-primary)] hover:text-[var(--accent)] truncate">{r.name}</Link>
                <span className="flex-1 h-6 rounded-md bg-[var(--bg-secondary)] overflow-hidden">
                  <span className="block h-full rounded-md bg-[var(--accent)]" style={{ width: `${(r.pros / maxP) * 100}%` }} />
                </span>
                <span className="w-20 shrink-0 text-right text-sm font-semibold text-[var(--text-primary)]">{grp(r.pros)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">Nombre d&apos;entreprises référencées par métier. Cliquez pour voir les professionnels près de chez vous.</p>
        </section>

        {/* CTA intermédiaire */}
        <section className="mb-14">
          <div className="rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-lg text-[var(--text-primary)]">Besoin de l&apos;un de ces artisans ?</p>
              <p className="text-sm text-[var(--text-secondary)]">Décrivez votre projet, recevez plusieurs devis gratuits, sans engagement.</p>
            </div>
            <Link href="/deposer-projet" className="shrink-0 inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full transition-all duration-250 hover:-translate-y-0.5">
              Déposer mon projet <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Les plus rares */}
        <section className="mb-14 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">Les métiers les plus rares</h2>
          <div className="flex flex-wrap gap-3">
            {rarest.map((r) => (
              <Link key={r.slug} href={`/${r.slug}`} className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-3 hover:border-[var(--accent)] transition-colors">
                <div className="font-semibold text-[var(--text-primary)]">{r.name}</div>
                <div className="text-sm text-[var(--text-secondary)]">{grp(r.pros)} entreprises · {VLAB[r.vertical]}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">Questions fréquentes</h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="rounded-xl border border-[var(--card-border)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{f.q}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <ProximityLinks categories={proximityCats} />

        <ObservatoireNav current={PATH} />

        <section className="mb-16 max-w-2xl rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Méthodologie</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Nombre d&apos;entreprises actives par métier, référencées depuis le répertoire SIRENE (INSEE). Entreprises
            immatriculées, pas nécessairement toutes en activité à temps plein. Les métiers non encore référencés sont exclus.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--card-border)] p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Un projet en tête ?</h2>
          <p className="text-[var(--text-secondary)] mb-6">Recevez plusieurs devis gratuits d&apos;artisans près de chez vous.</p>
          <Link href="/deposer-projet" className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-4 rounded-full transition-all duration-250 hover:-translate-y-0.5">
            Déposer mon projet (gratuit) <span aria-hidden>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
