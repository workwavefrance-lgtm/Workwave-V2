import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FranceChoropleth, { type ChoroDatum } from "@/components/barometre/FranceChoropleth";
import ProximityLinks from "@/components/barometre/ProximityLinks";
import ObservatoireNav from "@/components/barometre/ObservatoireNav";
import { getAllCategories } from "@/lib/queries/categories";
import { BAROMETRE_ARTISANS, BAROMETRE_META } from "@/lib/data/barometre-artisans";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 2592000; // 30j : données statiques (regénérées via scripts/build-barometre.ts)

const PATH = "/barometre-artisans";
const YEAR = 2026;

// « 1,03 million » : accord au singulier sous 2 millions.
const millions = (n: number) =>
  `${(n / 1_000_000).toFixed(2).replace(".", ",")} million${n >= 2_000_000 ? "s" : ""}`;
// Taux en % ; « n.d. » quand le departement a moins de BAROMETRE_META.seuilTaux
// fiches verifiees (lecon du 07/06 : pas de taux sur une couverture trop faible).
const pct = (n: number | null) => (n === null ? "n.d." : `${String(n).replace(".", ",")} %`);

export const metadata: Metadata = {
  title: `Baromètre des artisans en France ${YEAR} · densité par département`,
  description: `Où trouve-t-on le plus d'artisans en France ? ${millions(BAROMETRE_META.totalActifs)} d'entreprises artisanales analysées, département par département, avec la part d'établissements fermés. La France rurale compte jusqu'à 6× plus d'artisans par habitant que les métropoles. Données SIRENE + INSEE.`,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: {
    type: "article",
    title: `Baromètre des artisans en France ${YEAR}`,
    description: `${millions(BAROMETRE_META.totalPros)} d'établissements artisanaux ouverts, la densité département par département et la part d'établissements fermés. Données SIRENE + INSEE.`,
    url: `${BASE_URL}${PATH}`,
  },
};

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function BarometreArtisansPage() {
  const proximityCats = (await getAllCategories())
    .filter((c) => ["btp", "domicile", "personne"].includes(c.vertical))
    .map((c) => ({ slug: c.slug, name: c.name }));
  const rows = BAROMETRE_ARTISANS;
  const top = rows[0];
  const bottom = rows[rows.length - 1];
  const dec = (n: number) => String(n).replace(".", ",");
  const grp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); // 1 921 065
  const ecart = (top.densite / bottom.densite).toFixed(1).replace(".", ",");
  const top15 = rows.slice(0, 15);
  const bottom5 = rows.slice(-5).reverse();
  const maxDens = top.densite;

  // Classement par région (agrégé depuis les départements, donnée réelle).
  const regMap = new Map<string, { region: string; pros: number; pop: number }>();
  for (const r of rows) {
    const g = regMap.get(r.region) || { region: r.region, pros: 0, pop: 0 };
    g.pros += r.pros;
    g.pop += r.population;
    regMap.set(r.region, g);
  }
  const regions = [...regMap.values()]
    .map((g) => ({ ...g, densite: +((g.pros / g.pop) * 10000).toFixed(1) }))
    .sort((a, b) => b.densite - a.densite);
  const regMax = regions[0].densite;

  // Etat Sirene (fichiers Stock, classement du 03/09/2026) : departements avec
  // un taux publie (>= seuilTaux fiches verifiees), classes par part de fermes.
  const avecTaux = rows.flatMap((r) =>
    r.partFermes !== null && r.partDisparus !== null
      ? [{ ...r, partFermes: r.partFermes, partDisparus: r.partDisparus }]
      : []
  );
  const plusFermes = [...avecTaux].sort((a, b) => b.partFermes - a.partFermes).slice(0, 5);
  const moinsFermes = [...avecTaux].sort((a, b) => a.partFermes - b.partFermes).slice(0, 5);

  // Analyse « pourquoi » : points FACTUELS sourcés (Perplexity/sonar, 27/07/2026).
  const ANALYSE = [
    { titre: "Un secteur de proximité calqué sur la population", texte: "L'artisanat est un secteur de proximité : l'ISM et Bpifrance Création décrivent un tissu « en correspondance quasi parfaite avec la répartition de la population », d'où une densité par habitant souvent plus forte dans les territoires peu denses que dans les métropoles." },
    { titre: "Des entreprises plus petites, donc plus nombreuses par habitant", texte: "En zone rurale, les entreprises individuelles dominent : les entreprises sans salarié représentent environ 64 % du tissu artisanal, contre 60 à 62 % dans les grandes agglomérations. Ce profil augmente mécaniquement le nombre d'entreprises rapporté à la population." },
    { titre: "Une histoire économique et le tourisme", texte: "Le phénomène est ancien : les anciennes « terres industrielles » sont moins pourvues en artisanat, tandis que l'économie touristique renforce la densité artisanale dans certains départements ruraux ou de montagne." },
  ];
  const ANALYSE_SOURCES = [
    "https://fondation-entrepreneurs.mma/news/174991/une-densite-plus-forte-de-l-artisanat-en-milieu-rural.htm",
    "https://veille.artisanat.fr/dossier_filiere/transports/donnees-economiques/actualite/les-entreprises-artisanales-dans-les-regions-tableau-economique-de-lartisanat.html",
    "https://www.batiactu.com/edito/artisanat-investit-agglomerations-mais-deserte-ruralite-56099.php",
  ];

  const FAQ = [
    { q: "Quel département compte le plus d'artisans par habitant en France ?", a: `${top.name} arrive en tête avec ${dec(top.densite)} entreprises artisanales pour 10 000 habitants, devant ${rows[1].name} et ${rows[2].name}. À l'opposé, ${bottom.name} ferme le classement avec ${dec(bottom.densite)}.` },
    { q: "Combien y a-t-il d'entreprises artisanales en France ?", a: `Workwave référence ${grp(BAROMETRE_META.totalPros)} établissements artisanaux ouverts (bâtiment, services à domicile, aide à la personne) répartis dans les 100 départements analysés, d'après le répertoire SIRENE de l'INSEE, sur ${grp(BAROMETRE_META.totalActifs)} fiches analysées. Les établissements fermés d'après les fichiers Stock Sirene (classement du 03/09/2026) ne sont pas comptés.` },
    { q: "Quelle part des entreprises artisanales référencées est fermée ?", a: `${pct(BAROMETRE_META.partFermes)} des établissements dont l'état est vérifié dans les fichiers Stock Sirene (INSEE, classement du 03/09/2026) sont fermés, et ${pct(BAROMETRE_META.partDisparus)} correspondent à des entreprises disparues (établissement fermé et entreprise cessée). La part varie de ${pct(moinsFermes[0]?.partFermes ?? null)} (${moinsFermes[0]?.name ?? "n.d."}) à ${pct(plusFermes[0]?.partFermes ?? null)} (${plusFermes[0]?.name ?? "n.d."}) selon le département.` },
    { q: "Pourquoi y a-t-il moins d'artisans par habitant dans les grandes villes ?", a: "L'artisanat suit la répartition de la population, mais les grandes métropoles concentrent surtout de grandes entreprises et des salariés : la part d'indépendants y est plus faible. Les zones rurales et de montagne comptent davantage de petites entreprises artisanales par habitant." },
    { q: "Comment la densité artisanale est-elle calculée ?", a: `Densité = nombre d'entreprises artisanales référencées ÷ population du département × 10 000. Les entreprises viennent du répertoire SIRENE (INSEE) et la population de l'INSEE (population municipale 2021). Relevé de ${BAROMETRE_META.generatedAt}.` },
  ];

  const choroData: Record<string, ChoroDatum> = {};
  for (const r of rows) {
    choroData[r.code] = { name: r.name, densite: r.densite, rank: r.rank, pros: r.pros, slug: `${slugify(r.name)}-${r.code}` };
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Baromètre des artisans" },
  ];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Baromètre des artisans en France ${YEAR} · densité par département`,
    description: `Densité d'entreprises artisanales (bâtiment, services à domicile, aide à la personne) pour 10 000 habitants, dans les 100 départements français, avec la part d'établissements fermés et d'entreprises disparues par département. ${BAROMETRE_META.totalActifs.toLocaleString("fr-FR")} fiches analysées, dont ${BAROMETRE_META.totalPros.toLocaleString("fr-FR")} établissements ouverts.`,
    creator: { "@type": "Organization", name: "Workwave", url: BASE_URL },
    // Google reclame le champ "license" sur tout Dataset (avertissement dans
    // la Search Console). CC BY 4.0 : reutilisation libre, y compris
    // commerciale, a condition de citer Workwave.fr. Compatible avec la
    // Licence Ouverte 2.0 d'Etalab qui couvre nos sources INSEE, et invite
    // les reprises a nous citer, donc a nous lier.
    license: "https://creativecommons.org/licenses/by/4.0/",
    temporalCoverage: String(YEAR),
    isBasedOn: [
      {
        "@type": "Dataset",
        name: "Répertoire SIRENE des entreprises",
        // Google exige name ET description sur CHAQUE noeud Dataset, y compris
        // ceux imbriques dans isBasedOn. Sans description : "Champ description
        // manquant", signale comme critique dans la Search Console.
        description:
          "Répertoire officiel des entreprises et de leurs établissements, tenu par l'INSEE et publié en Licence Ouverte.",
        url: "https://www.insee.fr/fr/information/3591226",
        license: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
        creator: { "@type": "Organization", name: "INSEE" },
      },
      {
        "@type": "Dataset",
        name: "Base Sirene des entreprises et de leurs établissements (fichiers Stock)",
        description:
          "Fichiers Stock mensuels du répertoire Sirene (StockEtablissement, StockUniteLegale) publiés par l'INSEE sur data.gouv.fr : état administratif de chaque établissement et de chaque unité légale.",
        url: "https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/",
        license: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
        creator: { "@type": "Organization", name: "INSEE" },
      },
      {
        "@type": "Dataset",
        name: "Population municipale 2021",
        description:
          "Populations légales des communes françaises au 1er janvier 2021, publiées par l'INSEE.",
        url: "https://www.insee.fr/fr/statistiques/7739582",
        license: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
        creator: { "@type": "Organization", name: "INSEE" },
      },
    ],
    url: `${BASE_URL}${PATH}`,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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

        {/* Hero */}
        <section className="mb-12">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] mb-3">
            Observatoire Workwave
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-5">
            Baromètre des artisans en France {YEAR}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Où trouve-t-on le plus d&apos;artisans, et où en manque-t-il le plus ? Nous avons
            analysé <strong className="text-[var(--text-primary)]">{grp(BAROMETRE_META.totalActifs)} entreprises
            artisanales</strong> (bâtiment, services à domicile, aide à la personne) dans
            les 100 départements français, dont{" "}
            <strong className="text-[var(--text-primary)]">{grp(BAROMETRE_META.totalPros)} établissements ouverts</strong>.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard value={grp(BAROMETRE_META.totalPros)} label="établissements artisanaux ouverts" />
            <StatCard value="100" label="départements analysés" />
            <StatCard value={`${ecart}×`} label={`plus d'artisans/hab. entre le 1ᵉʳ (${top.name}) et le dernier (${bottom.name})`} />
            <StatCard value={pct(BAROMETRE_META.partFermes)} label="d'établissements fermés (fichiers Stock Sirene, 03/09/2026)" />
          </div>
        </section>

        {/* Le chiffre clé */}
        <section className="mb-14 rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8">
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-snug">
            La France rurale compte jusqu&apos;à{" "}
            <span className="text-[var(--accent)]">{ecart} fois plus</span>{" "}
            d&apos;artisans par habitant que les grandes métropoles.
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            En tête : {top.name} ({dec(top.densite)} entreprises / 10 000 hab.). En bas : {bottom.name} ({dec(bottom.densite)}).
          </p>
        </section>

        {/* Carte */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            La carte de la densité artisanale
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Plus un département est foncé, plus il compte d&apos;entreprises artisanales par habitant. Survolez pour le détail.
          </p>
          <div className="max-w-xl mx-auto">
            <FranceChoropleth data={choroData} />
          </div>
        </section>

        {/* Top 15 barres */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Le top 15 des départements les mieux dotés
          </h2>
          <ul className="space-y-2.5">
            {top15.map((r) => (
              <li key={r.code} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-sm font-semibold text-[var(--text-tertiary)] text-right">{r.rank}</span>
                <span className="w-40 sm:w-52 shrink-0 text-sm text-[var(--text-primary)] truncate">{r.name}</span>
                <span className="flex-1 h-6 rounded-md bg-[var(--bg-secondary)] overflow-hidden">
                  <span className="block h-full rounded-md bg-[var(--accent)]" style={{ width: `${(r.densite / maxDens) * 100}%` }} />
                </span>
                <span className="w-14 shrink-0 text-right text-sm font-semibold text-[var(--text-primary)]">{dec(r.densite)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">Entreprises artisanales pour 10 000 habitants.</p>
        </section>

        {/* Flop 5 */}
        <section className="mb-16 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Là où il manque le plus d&apos;artisans
          </h2>
          <div className="flex flex-wrap gap-3">
            {bottom5.map((r) => (
              <div key={r.code} className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-3">
                <div className="font-semibold text-[var(--text-primary)]">{r.name}</div>
                <div className="text-sm text-[var(--text-secondary)]">{dec(r.densite)} / 10k · #{r.rank}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Etat Sirene : etablissements fermes et entreprises disparues, par
            departement. Donnee unique (fichiers Stock Sirene appliques a notre
            base le 03/09/2026), affichee sobrement : deux listes de 5. */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Combien d&apos;entreprises artisanales ont fermé ?
          </h2>
          <p className="text-[var(--text-secondary)] mb-6 max-w-3xl leading-relaxed">
            Les fichiers Stock Sirene de l&apos;INSEE donnent l&apos;état réel de chaque établissement.
            Sur {grp(BAROMETRE_META.verifies)} fiches vérifiées en France,{" "}
            <strong className="text-[var(--text-primary)]">{pct(BAROMETRE_META.partFermes)} sont des établissements fermés</strong>,
            et {pct(BAROMETRE_META.partDisparus)} correspondent à des entreprises disparues (établissement fermé et
            entreprise cessée). Ces établissements sont exclus des comptes et des densités de cette page.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { titre: "Les départements où la part d'établissements fermés est la plus forte", liste: plusFermes },
              { titre: "Les départements où elle est la plus faible", liste: moinsFermes },
            ].map((bloc) => (
              <div key={bloc.titre} className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">{bloc.titre}</h3>
                <ul className="space-y-2">
                  {bloc.liste.map((r) => (
                    <li key={r.code} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-[var(--text-primary)] truncate">
                        {r.name} <span className="text-[var(--text-tertiary)]">({r.code})</span>
                      </span>
                      <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                        {pct(r.partFermes)}{" "}
                        <span className="font-normal text-[var(--text-tertiary)]">· disparues {pct(r.partDisparus)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Source : {BAROMETRE_META.etatsSource}. Part = établissements fermés (puis entreprises disparues) ÷ fiches
            dont l&apos;état est vérifié ; aucun taux publié sous {BAROMETRE_META.seuilTaux} fiches vérifiées.
          </p>
        </section>

        {/* CTA intermédiaire (conversion en cours de lecture) */}
        <section className="mb-16">
          <div className="rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-lg text-[var(--text-primary)]">Vous cherchez un artisan près de chez vous ?</p>
              <p className="text-sm text-[var(--text-secondary)]">Déposez votre projet en 2 minutes, recevez plusieurs devis gratuits, sans engagement.</p>
            </div>
            <Link
              href="/deposer-projet"
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full transition-all duration-250 hover:-translate-y-0.5"
            >
              Déposer mon projet <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Analyse : pourquoi cet écart (sourcé) */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Pourquoi un tel écart entre villes et campagnes ?
          </h2>
          <div className="space-y-6">
            {ANALYSE.map((a) => (
              <div key={a.titre}>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1.5">{a.titre}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{a.texte}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-xl px-4 py-3 leading-relaxed">
            <strong className="text-[var(--text-primary)]">À lire avec nuance :</strong> la densité dépend de
            l&apos;échelle (département, région, commune). Un département urbain peut concentrer beaucoup d&apos;artisans
            en valeur absolue, mais moins par habitant.
          </p>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Sources :{" "}
            {ANALYSE_SOURCES.map((src, i) => {
              let host = src;
              try { host = new URL(src).hostname.replace(/^www\./, ""); } catch {}
              return (
                <span key={i}>
                  {i > 0 && ", "}
                  <a href={src} target="_blank" rel="nofollow noopener noreferrer" className="underline hover:no-underline">{host}</a>
                </span>
              );
            })}
          </p>
        </section>

        {/* Classement par région */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Le classement par région
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            La même densité, agrégée à l&apos;échelle des régions.
          </p>
          <ul className="space-y-2.5">
            {regions.map((r, i) => (
              <li key={r.region} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-sm font-semibold text-[var(--text-tertiary)] text-right">{i + 1}</span>
                <span className="w-40 sm:w-56 shrink-0 text-sm text-[var(--text-primary)] truncate">{r.region}</span>
                <span className="flex-1 h-6 rounded-md bg-[var(--bg-secondary)] overflow-hidden">
                  <span className="block h-full rounded-md bg-[var(--accent)]" style={{ width: `${(r.densite / regMax) * 100}%` }} />
                </span>
                <span className="w-14 shrink-0 text-right text-sm font-semibold text-[var(--text-primary)]">{dec(r.densite)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">Entreprises artisanales pour 10 000 habitants, par région.</p>
        </section>

        {/* Classement complet (replié) */}
        <section className="mb-16">
          <details className="group rounded-2xl border border-[var(--card-border)] overflow-hidden">
            <summary className="cursor-pointer list-none px-5 py-4 bg-[var(--bg-secondary)] font-semibold text-[var(--text-primary)] flex items-center justify-between">
              Voir le classement complet des 100 départements
              <span className="text-[var(--text-tertiary)] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--card-border)]">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Département</th>
                    <th className="px-4 py-3 font-medium">Région</th>
                    <th className="px-4 py-3 font-medium text-right">Ouverts</th>
                    <th className="px-4 py-3 font-medium text-right">/ 10k hab.</th>
                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Fermés · disparues</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.code} className={i % 2 ? "bg-[var(--bg-secondary)]" : ""}>
                      <td className="px-4 py-2.5 text-[var(--text-tertiary)]">{r.rank}</td>
                      <td className="px-4 py-2.5 text-[var(--text-primary)]">{r.name} <span className="text-[var(--text-tertiary)]">({r.code})</span></td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.region}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{r.pros.toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">{dec(r.densite)}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--text-secondary)] whitespace-nowrap">{pct(r.partFermes)} · {pct(r.partDisparus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-[var(--text-tertiary)] border-t border-[var(--card-border)]">
              Ouverts : établissements non fermés au registre Sirene. Fermés · disparues : part des établissements
              fermés, puis part des entreprises disparues, sur les fiches vérifiées ({BAROMETRE_META.etatsSource}) ;
              n.d. sous {BAROMETRE_META.seuilTaux} fiches vérifiées.
            </p>
          </details>
        </section>

        {/* FAQ */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-xl border border-[var(--card-border)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{f.q}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Méthodologie / sources */}
        <section className="mb-16 max-w-2xl rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Méthodologie &amp; sources</h2>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
            <li><strong className="text-[var(--text-primary)]">Entreprises</strong> : établissements <strong className="text-[var(--text-primary)]">ouverts</strong> des métiers du bâtiment, des services à domicile et de l&apos;aide à la personne, référencés par Workwave depuis le <strong className="text-[var(--text-primary)]">répertoire SIRENE (INSEE)</strong>. Il s&apos;agit d&apos;entreprises immatriculées, pas nécessairement toutes en activité à temps plein. Les établissements fermés d&apos;après les {BAROMETRE_META.etatsSource} sont exclus du compte et de la densité.</li>
            <li><strong className="text-[var(--text-primary)]">Fermés et disparues</strong> : part des établissements fermés, et part des entreprises disparues (établissement fermé et unité légale cessée), rapportées aux fiches dont l&apos;état est vérifié dans les fichiers Stock Sirene. Aucun taux publié sous {BAROMETRE_META.seuilTaux} fiches vérifiées.</li>
            <li><strong className="text-[var(--text-primary)]">Population</strong> : population municipale 2021, <strong className="text-[var(--text-primary)]">INSEE</strong> (via data.gouv.fr).</li>
            <li><strong className="text-[var(--text-primary)]">Densité</strong> = établissements ouverts ÷ population × 10 000. Mayotte exclu (population non disponible dans la source).</li>
            <li>Relevé : {BAROMETRE_META.generatedAt}. Réutilisation libre avec lien vers cette page.</li>
          </ul>
        </section>

        {/* Proximité (maillage interne vers les pages métier) */}
        <ProximityLinks categories={proximityCats} />

        <ObservatoireNav current={PATH} />

        {/* CTA */}
        <section className="rounded-2xl border border-[var(--card-border)] p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Besoin d&apos;un artisan près de chez vous ?
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Décrivez votre projet en 2 minutes, recevez plusieurs devis gratuits.
          </p>
          <Link
            href="/deposer-projet"
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-4 rounded-full transition-all duration-250 hover:-translate-y-0.5"
          >
            Déposer mon projet (gratuit) <span aria-hidden>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
