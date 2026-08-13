import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import ProximityLinks from "@/components/barometre/ProximityLinks";
import ObservatoireNav from "@/components/barometre/ObservatoireNav";
import { getAllCategories } from "@/lib/queries/categories";
import { BAROMETRE_BE, BAROMETRE_BE_META } from "@/lib/data/barometre-be";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 2592000;
const PATH = "/barometre-artisans-belgique";
const YEAR = 2026;

export const metadata: Metadata = {
  title: `Baromètre des artisans en Belgique francophone ${YEAR} — densité par province`,
  description: `Où trouve-t-on le plus d'artisans en Wallonie et à Bruxelles ? Densité d'entreprises artisanales par province. Le Brabant wallon en tête, le Hainaut en bas. Données BCE + Statbel.`,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    type: "article",
    title: `Baromètre des artisans en Belgique francophone ${YEAR}`,
    description: `Densité d'artisans par province (Wallonie + Bruxelles). Données BCE + Statbel.`,
    url: `${BASE_URL}${PATH}`,
  },
};

const grp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dec = (n: number) => String(n).replace(".", ",");

const ANALYSE = [
  { titre: "Une structure économique et une spécialisation locales", texte: "En Wallonie, les artisans se concentrent dans la construction, la mécanique et l'alimentaire. Une province plus diversifiée et tournée vers les services aux ménages affiche mécaniquement plus d'artisans par habitant qu'un ancien bassin industriel." },
  { titre: "La dynamique entrepreneuriale du Brabant wallon", texte: "Le Brabant wallon bénéficie d'un contexte plus favorable, avec une création d'entreprises dynamique en périphérie bruxelloise. Cette attractivité soutient la densité d'activités indépendantes et artisanales par habitant." },
  { titre: "L'héritage industriel du Hainaut et de Liège", texte: "Le Hainaut a davantage subi la désindustrialisation des anciens bassins lourds, ce qui pèse sur l'émergence d'entreprises de proximité. L'IWEPS souligne que la croissance du nombre d'entreprises reste plus lente en Wallonie, avec moins de primo-créations." },
];
const ANALYSE_SOURCES = [
  "https://economie.fgov.be/fr/themes/entreprises/pme-et-independants-en/les-travailleurs-independants/les-artisans",
  "https://www.iweps.be",
];

export default async function BarometreBePage() {
  const proximityCats = (await getAllCategories())
    .filter((c) => ["btp", "domicile", "personne"].includes(c.vertical))
    .map((c) => ({ slug: c.slug, name: c.name }));

  const rows = BAROMETRE_BE;
  const top = rows[0], bottom = rows[rows.length - 1];
  const ecart = (top.densite / bottom.densite).toFixed(1).replace(".", ",");
  const maxD = top.densite;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Baromètre des artisans (Belgique)" },
  ];

  const faq = [
    { q: `Quelle province belge compte le plus d'artisans par habitant ?`, a: `Le ${top.name} arrive en tête avec ${dec(top.densite)} entreprises artisanales pour 10 000 habitants, devant ${rows[1].name}. Le ${bottom.name} ferme le classement (${dec(bottom.densite)}).` },
    { q: `Combien d'artisans en Belgique francophone ?`, a: `Workwave référence ${grp(BAROMETRE_BE_META.totalPros)} entreprises artisanales actives en Wallonie et à Bruxelles (source : Banque-Carrefour des Entreprises).` },
    { q: `Ce baromètre couvre-t-il toute la Belgique ?`, a: `Il couvre la Belgique francophone : les 5 provinces wallonnes et la Région de Bruxelles-Capitale. La Flandre n'est pas incluse.` },
  ];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Densité d'artisans par province en Belgique francophone ${YEAR}`,
    description: `Densité d'entreprises artisanales pour 10 000 habitants dans les provinces wallonnes et à Bruxelles (${grp(BAROMETRE_BE_META.totalPros)} entreprises).`,
    creator: { "@type": "Organization", name: "Workwave", url: BASE_URL },
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
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] mb-3">Observatoire Workwave · 🇧🇪 Belgique</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-5">
            Baromètre des artisans en Belgique francophone {YEAR}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Où trouve-t-on le plus d&apos;artisans en Wallonie et à Bruxelles ? Nous avons analysé{" "}
            <strong className="text-[var(--text-primary)]">{grp(BAROMETRE_BE_META.totalPros)} entreprises artisanales</strong>{" "}
            dans les 5 provinces wallonnes et la Région de Bruxelles-Capitale.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard value={grp(BAROMETRE_BE_META.totalPros)} label="entreprises artisanales référencées" />
            <StatCard value="6" label="provinces & régions analysées" />
            <StatCard value={`${ecart}×`} label={`plus d'artisans/hab. entre le 1ᵉʳ (${top.name}) et le dernier (${bottom.name})`} />
          </div>
        </section>

        <section className="mb-14 rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8">
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-snug">
            Le {top.name} compte le plus d&apos;artisans par habitant, le {bottom.name} le moins.
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            {dec(top.densite)} contre {dec(bottom.densite)} entreprises pour 10 000 habitants.
          </p>
        </section>

        {/* Classement */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">Le classement par province</h2>
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li key={r.code} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-sm font-semibold text-[var(--text-tertiary)] text-right">{r.rank}</span>
                <span className="w-40 sm:w-52 shrink-0 text-sm text-[var(--text-primary)] truncate">{r.name}</span>
                <span className="flex-1 h-6 rounded-md bg-[var(--bg-secondary)] overflow-hidden">
                  <span className="block h-full rounded-md bg-[var(--accent)]" style={{ width: `${(r.densite / maxD) * 100}%` }} />
                </span>
                <span className="w-14 shrink-0 text-right text-sm font-semibold text-[var(--text-primary)]">{dec(r.densite)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">Entreprises artisanales pour 10 000 habitants, par province.</p>
        </section>

        {/* CTA */}
        <section className="mb-16">
          <div className="rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-lg text-[var(--text-primary)]">Vous cherchez un artisan en Belgique ?</p>
              <p className="text-sm text-[var(--text-secondary)]">Décrivez votre projet, recevez plusieurs devis gratuits.</p>
            </div>
            <Link href="/deposer-projet" className="shrink-0 inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full transition-all duration-250 hover:-translate-y-0.5">
              Déposer mon projet <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Analyse */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">Pourquoi ces écarts entre provinces ?</h2>
          <div className="space-y-6">
            {ANALYSE.map((a) => (
              <div key={a.titre}>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1.5">{a.titre}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{a.texte}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Sources :{" "}
            {ANALYSE_SOURCES.map((src, i) => {
              let host = src; try { host = new URL(src).hostname.replace(/^www\./, ""); } catch {}
              return <span key={i}>{i > 0 && ", "}<a href={src} target="_blank" rel="nofollow noopener noreferrer" className="underline hover:no-underline">{host}</a></span>;
            })}
          </p>
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
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Méthodologie &amp; sources</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Entreprises = établissements actifs des métiers du bâtiment, des services et de l&apos;aide à la personne,
            référencés depuis la <strong className="text-[var(--text-primary)]">Banque-Carrefour des Entreprises (BCE)</strong>.
            Population = somme des communes (<strong className="text-[var(--text-primary)]">Statbel</strong>). Densité =
            entreprises ÷ population × 10 000. Périmètre : Belgique francophone (Wallonie + Bruxelles). Relevé : {BAROMETRE_BE_META.generatedAt}.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--card-border)] p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Un projet en Belgique ?</h2>
          <p className="text-[var(--text-secondary)] mb-6">Recevez plusieurs devis gratuits d&apos;artisans près de chez vous.</p>
          <Link href="/deposer-projet" className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-4 rounded-full transition-all duration-250 hover:-translate-y-0.5">
            Déposer mon projet (gratuit) <span aria-hidden>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
