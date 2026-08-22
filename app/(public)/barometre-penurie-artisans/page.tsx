import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import PenurieMap from "@/components/barometre/PenurieMap";
import ProximityLinks from "@/components/barometre/ProximityLinks";
import ObservatoireNav from "@/components/barometre/ObservatoireNav";
import { getAllCategories } from "@/lib/queries/categories";
import { PENURIE, PENURIE_META } from "@/lib/data/barometre-penurie";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 2592000;
const PATH = "/barometre-penurie-artisans";
const YEAR = 2026;

export const metadata: Metadata = {
  title: `Les déserts d'artisans : où manque-t-il le plus d'artisans en France ${YEAR} ?`,
  description: `Dans quel département manque-t-il le plus de plombiers, d'électriciens, de maçons ? Carte interactive de la densité d'artisans par métier et par département. Données SIRENE + INSEE.`,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    type: "article",
    title: `Les déserts d'artisans en France ${YEAR}`,
    description: `Où manque-t-il le plus d'artisans ? Carte interactive par métier et département.`,
    url: `${BASE_URL}${PATH}`,
  },
};

const grp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dec = (n: number) => String(n).replace(".", ",");

export default async function BarometrePenuriePage() {
  const proximityCats = (await getAllCategories())
    .filter((c) => ["btp", "domicile", "personne"].includes(c.vertical))
    .map((c) => ({ slug: c.slug, name: c.name }));

  // Département le plus souvent le moins doté (« le plus en tension »).
  const tension: Record<string, { name: string; count: number }> = {};
  for (const m of PENURIE) {
    const s = m.scarcest[0];
    tension[s.code] = { name: s.name, count: (tension[s.code]?.count || 0) + 1 };
  }
  const worst = Object.values(tension).sort((a, b) => b.count - a.count)[0];
  const totalEntreprises = PENURIE.reduce((a, m) => a + m.totalCount, 0);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Les déserts d'artisans" },
  ];

  const plombier = PENURIE.find((m) => m.slug === "plombier");
  const faq = [
    { q: `Dans quel département manque-t-il le plus d'artisans ?`, a: `${worst.name} est le département le moins doté par habitant pour ${worst.count} des ${PENURIE.length} métiers analysés. À l'inverse, les départements ruraux et de montagne (Hautes-Alpes, Alpes-de-Haute-Provence…) comptent le plus d'artisans par habitant.` },
    plombier ? { q: `Où manque-t-il le plus de plombiers en France ?`, a: `Rapporté à la population, c'est en ${plombier.scarcest[0].name} qu'il y a le moins de plombiers (${dec(plombier.scarcest[0].density)} pour 10 000 habitants), contre ${dec(plombier.densest[0].density)} en ${plombier.densest[0].name}.` } : null,
    { q: `Comment est mesurée la « pénurie » d'artisans ?`, a: `Nous rapportons le nombre d'entreprises artisanales référencées (répertoire SIRENE de l'INSEE) à la population du département (INSEE 2021). Une faible densité par habitant signale un territoire moins pourvu, pas nécessairement une pénurie de main-d'œuvre.` },
  ].filter(Boolean) as { q: string; a: string }[];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Densité d'artisans par métier et par département en France ${YEAR}`,
    description: `Densité d'entreprises artisanales pour 10 000 habitants, par métier et par département métropolitain (${PENURIE.length} métiers).`,
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

  const StatCard = ({ value, label }: { value: string; label: string }) => (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-6">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--accent)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--text-secondary)]">{label}</div>
    </div>
  );

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
            Les déserts d&apos;artisans : où en manque-t-il le plus ?
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Dans quel département manque-t-il le plus de plombiers, d&apos;électriciens ou de maçons ?
            Nous avons mesuré la densité d&apos;artisans par habitant pour <strong className="text-[var(--text-primary)]">{PENURIE.length} métiers</strong>,
            département par département. Choisissez un métier, la carte se recolore.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard value={`${PENURIE.length}`} label="métiers analysés, département par département" />
            <StatCard value={grp(totalEntreprises)} label="entreprises artisanales prises en compte" />
            <StatCard value={worst.name} label={`département le moins doté pour ${worst.count} des ${PENURIE.length} métiers`} />
          </div>
        </section>

        <section className="mb-14 rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8">
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-snug">
            {worst.name} est le département le plus en tension : il compte <span className="text-[var(--accent)]">le moins d&apos;artisans par habitant</span> pour {worst.count} métiers sur {PENURIE.length}.
          </p>
        </section>

        {/* Carte interactive */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">La carte, métier par métier</h2>
          <PenurieMap metiers={PENURIE} />
        </section>

        {/* CTA intermédiaire */}
        <section className="mb-16">
          <div className="rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-lg text-[var(--text-primary)]">Vous cherchez un artisan dans votre département ?</p>
              <p className="text-sm text-[var(--text-secondary)]">Déposez votre projet, recevez plusieurs devis gratuits, même là où ils sont rares.</p>
            </div>
            <Link href="/deposer-projet" className="shrink-0 inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full transition-all duration-250 hover:-translate-y-0.5">
              Déposer mon projet <span aria-hidden>→</span>
            </Link>
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
            Densité = entreprises artisanales référencées (répertoire SIRENE, INSEE) ÷ population du département
            (INSEE, population municipale 2021) × 10 000. France métropolitaine ; seuls les métiers présents dans
            au moins 85 départements sont retenus pour une comparaison juste. Relevé : {PENURIE_META.generatedAt}.
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
