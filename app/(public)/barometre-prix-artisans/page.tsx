import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import ProximityLinks from "@/components/barometre/ProximityLinks";
import ObservatoireNav from "@/components/barometre/ObservatoireNav";
import { getAllCategories } from "@/lib/queries/categories";
import { SOURCED_PRICES } from "@/lib/data/sourced-prices";
import { METIER_STATS } from "@/lib/data/metier-stats";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 2592000;
const PATH = "/barometre-prix-artisans";
const YEAR = 2026;

export const metadata: Metadata = {
  title: `Baromètre des prix des artisans ${YEAR} · combien coûte un artisan ?`,
  description: `Combien coûte un plombier, un électricien, un maçon en ${YEAR} ? Fourchettes de prix réelles et sourcées, métier par métier, pour comparer avant de vous engager. Devis gratuits sur Workwave.`,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    type: "article",
    title: `Baromètre des prix des artisans ${YEAR}`,
    description: `Les fourchettes de prix réelles des artisans, métier par métier. Sources citées.`,
    url: `${BASE_URL}${PATH}`,
  },
};

const VERTICAL_LABELS: Record<string, string> = {
  btp: "Bâtiment & artisanat",
  domicile: "Services à domicile",
  personne: "Aide à la personne",
};

export default async function BarometrePrixPage() {
  const cats = await getAllCategories();
  const btp = cats.filter((c) => ["btp", "domicile", "personne"].includes(c.vertical));

  // Métiers ayant des prix sourcés, triés par popularité (nb d'entreprises).
  const withPrices = btp
    .filter((c) => SOURCED_PRICES[c.slug]?.ranges?.length)
    .map((c) => ({ slug: c.slug, name: c.name, vertical: c.vertical, pros: METIER_STATS[c.slug] || 0, entry: SOURCED_PRICES[c.slug] }))
    .sort((a, b) => b.pros - a.pros);

  const proximityCats = withPrices.map((m) => ({ slug: m.slug, name: m.name }));
  const nbSources = new Set(withPrices.flatMap((m) => m.entry.sources)).size;

  // Prix repères (headline) : 1re prestation de 6 métiers populaires courants.
  const REPERE_SLUGS = ["plombier", "electricien", "serrurier", "chauffagiste", "menage", "demenagement"];
  const reperes = REPERE_SLUGS.map((s) => {
    const m = withPrices.find((x) => x.slug === s);
    return m ? { name: m.name, label: m.entry.ranges[0].label, range: m.entry.ranges[0].range } : null;
  }).filter(Boolean) as { name: string; label: string; range: string }[];

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Baromètre des prix" },
  ];

  const faq = [
    { q: `Combien coûte un plombier en ${YEAR} ?`, a: `Une intervention de dépannage simple coûte généralement ${SOURCED_PRICES["plombier"]?.ranges[0]?.range || "80 € à 180 €"}. Les tarifs varient selon la nature des travaux, la région et l'urgence. Le mieux reste de comparer plusieurs devis gratuits.` },
    { q: "Les prix affichés sont-ils fiables ?", a: `Ce sont des fourchettes couramment constatées, issues de sources web spécialisées et actualisées. Elles donnent un ordre de grandeur : seul un devis personnalisé donne un tarif exact pour votre projet.` },
    { q: "Comment payer le juste prix pour des travaux ?", a: "Demandez au moins 2 à 3 devis, vérifiez que chacun détaille la main-d'œuvre, les fournitures et le déplacement, et méfiez-vous des prix très en dessous du marché. Sur Workwave, décrire votre projet une fois suffit pour recevoir plusieurs devis gratuits." },
  ];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Baromètre des prix des artisans en France ${YEAR}`,
    description: `Fourchettes de prix de référence pour ${withPrices.length} métiers artisanaux (bâtiment, services à domicile, aide à la personne) en France.`,
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

  const grouped: Record<string, typeof withPrices> = { btp: [], domicile: [], personne: [] };
  for (const m of withPrices) grouped[m.vertical].push(m);

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
            Baromètre des prix des artisans {YEAR}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Combien coûte vraiment un plombier, un électricien, un maçon ? Voici les fourchettes de prix
            de référence pour <strong className="text-[var(--text-primary)]">{withPrices.length} métiers</strong>,
            issues de sources spécialisées, pour savoir à quoi vous attendre avant de demander un devis.
          </p>
        </section>

        {/* Prix repères */}
        <section className="mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reperes.map((r) => (
              <div key={r.name} className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5">
                <div className="text-sm text-[var(--text-tertiary)] mb-1">{r.name}</div>
                <div className="text-xl font-bold text-[var(--accent)]">{r.range}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{r.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA intermédiaire */}
        <section className="mb-14">
          <div className="rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-lg text-[var(--text-primary)]">Le meilleur moyen de connaître VOTRE prix ?</p>
              <p className="text-sm text-[var(--text-secondary)]">Décrivez votre projet en 2 minutes, recevez plusieurs devis gratuits à comparer.</p>
            </div>
            <Link href="/deposer-projet" className="shrink-0 inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full transition-all duration-250 hover:-translate-y-0.5">
              Déposer mon projet <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Prix par métier, groupés par vertical */}
        {(["btp", "domicile", "personne"] as const).map((v) =>
          grouped[v].length ? (
            <section key={v} className="mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
                {VERTICAL_LABELS[v]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped[v].map((m) => (
                  <div key={m.slug} className="rounded-2xl border border-[var(--card-border)] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">{m.name}</span>
                      <Link href={`/${m.slug}`} className="text-xs text-[var(--accent)] hover:underline">
                        Prix près de chez moi →
                      </Link>
                    </div>
                    <div>
                      {m.entry.ranges.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-5 py-2.5 border-t border-[var(--card-border)]">
                          <span className="text-sm text-[var(--text-secondary)]">{r.label}</span>
                          <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">{r.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        )}

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

        {/* Proximité (maillage interne) */}
        <ProximityLinks categories={proximityCats} />

        <ObservatoireNav current={PATH} />

        {/* Méthodologie */}
        <section className="mb-16 max-w-2xl rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Méthodologie</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Fourchettes de prix TTC couramment constatées (fourniture + pose), collectées auprès de {nbSources} sources
            web spécialisées et citées sur chaque page métier. Ce sont des ordres de grandeur : seul un devis personnalisé
            donne un tarif exact. Workwave est 100 % gratuit pour les particuliers.
          </p>
        </section>

        {/* CTA final */}
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
