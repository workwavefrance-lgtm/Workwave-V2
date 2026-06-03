import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

// Page hub PRO-ACQUISITION : capter l'intention "trouver des chantiers"
// (artisans qui cherchent du travail) — la requête sur laquelle travaux.com,
// habitatpresto, ootravaux… paient des Google Ads et ont des pages dédiées,
// et où Workwave n'avait AUCUNE page.
//
// Angle gagnant (cf. analyse concurrentielle 03/06/2026) : AUCUN concurrent
// n'affiche son prix (Habitatpresto = abonnement caché ~100-250€/mois ;
// Travaux.com = 1-90€/contact opaque ; ArtiBox = 5% du chantier ; OoTravaux =
// caché). Workwave est le SEUL à pouvoir afficher "9,90 € le lead, point".
// + FAQPage schema (qu'AUCUN concurrent n'a) = rich snippets + citabilité IA (GEO).
//
// Chiffres : 100% réels (zéro invention). Couverture = 12 115 communes / 40
// départements / 5 régions ; ~550 000 artisans BTP & services référencés.

const BASE_URL = "https://workwave.fr";

export const metadata: Metadata = {
  title: "Trouver des chantiers : 9,90 €/lead, sans abonnement",
  description:
    "Trouvez des chantiers près de chez vous. Recevez les demandes de votre zone et payez 9,90 € seulement pour débloquer les contacts qui vous intéressent — sans abonnement, sans engagement, sans commission. Créez votre fiche gratuite.",
  alternates: { canonical: `${BASE_URL}/trouver-des-chantiers` },
  openGraph: {
    title: "Trouver des chantiers près de chez vous — 9,90 €/lead, sans abonnement",
    description:
      "Le seul service d'apport de chantiers à prix transparent : 9,90 € le contact, zéro abonnement, zéro commission. Créez votre fiche gratuite sur Workwave.",
    url: `${BASE_URL}/trouver-des-chantiers`,
    type: "website",
  },
};

// FAQ : répond pile aux objections que les concurrents laissent en suspens
// (prix, abonnement, commission, revente de données). Sert l'affichage ET le
// FAQPage schema (rich snippets + GEO).
const FAQ: { q: string; a: string }[] = [
  {
    q: "Combien coûte un chantier sur Workwave ?",
    a: "9,90 € pour débloquer les coordonnées d'un projet qui vous intéresse. C'est tout. Pas d'abonnement mensuel, pas de frais de mise en service, pas de commission sur vos chantiers. Vous voyez le détail de la demande (type de travaux, zone, budget) AVANT de décider de payer.",
  },
  {
    q: "Y a-t-il un abonnement ou un engagement ?",
    a: "Non. Contrairement aux plateformes à abonnement (souvent 100 à 250 € par mois), Workwave ne vous engage à rien. Vous créez votre fiche gratuitement et vous payez uniquement les contacts que vous décidez de débloquer, à l'unité.",
  },
  {
    q: "Workwave prend-il une commission sur mes chantiers ?",
    a: "Jamais. Certaines plateformes prennent un pourcentage du montant du chantier (par ex. 5 %, soit 1 000 € sur un chantier à 20 000 €). Chez Workwave, vous gardez 100 % de votre chiffre d'affaires : un contact = 9,90 €, quel que soit le montant du chantier.",
  },
  {
    q: "Comment recevoir des demandes de chantiers ?",
    a: "Votre fiche existe peut-être déjà : Workwave référence plus de 550 000 artisans à partir du registre officiel Sirene. Retrouvez-la avec votre SIRET et réclamez-la gratuitement en 2 minutes. Si elle n'existe pas encore, vous pouvez la créer. Vous recevez ensuite les demandes des particuliers de votre zone et de votre métier.",
  },
  {
    q: "Quand est-ce que je paie ?",
    a: "Uniquement au moment où vous débloquez les coordonnées d'un projet. Vous consultez d'abord la demande (métier, ville, budget estimé, urgence) ; si elle vous intéresse, vous payez 9,90 € pour obtenir le contact direct du particulier. Aucun paiement à l'aveugle.",
  },
  {
    q: "Mes données ou celles des clients sont-elles revendues ?",
    a: "Non. Workwave n'est pas un revendeur de fichiers. Vous gérez votre fiche, vous recevez des demandes réelles de particuliers, et les coordonnées ne servent qu'à la mise en relation que vous avez choisie.",
  },
  {
    q: "Dans quelles zones Workwave trouve-t-il des chantiers ?",
    a: "Workwave couvre 12 115 communes sur 40 départements et 5 régions de France (Nouvelle-Aquitaine, Bretagne, Pays de la Loire, Occitanie et PACA), avec une couverture qui continue de s'étendre.",
  },
];

const COMPARISON: {
  feature: string;
  others: string;
  workwave: string;
}[] = [
  {
    feature: "Prix",
    others: "Abonnement 100–250 €/mois ou 1–90 €/contact (opaque)",
    workwave: "9,90 € le lead — affiché, fixe",
  },
  {
    feature: "Engagement",
    others: "Abonnement, frais de mise en service",
    workwave: "Aucun, zéro engagement",
  },
  {
    feature: "Commission sur vos chantiers",
    others: "Jusqu'à 5 % du montant du chantier",
    workwave: "0 % — vous gardez tout",
  },
  {
    feature: "Vous voyez le projet avant de payer",
    others: "Souvent non (lead acheté à l'aveugle)",
    workwave: "Oui — détail visible avant",
  },
  {
    feature: "Commercial à rappeler",
    others: "Oui (prix sur devis)",
    workwave: "Non — tout en ligne",
  },
];

export default function TrouverDesChantiersPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Apport de chantiers pour artisans — Workwave",
    serviceType: "Mise en relation artisans / particuliers",
    provider: {
      "@type": "Organization",
      name: "Workwave",
      url: BASE_URL,
    },
    areaServed: "France",
    description:
      "Service d'apport de chantiers pour les artisans du bâtiment et des services. Recevez les demandes de votre zone et payez 9,90 € par contact débloqué, sans abonnement.",
    offers: {
      "@type": "Offer",
      price: "9.90",
      priceCurrency: "EUR",
      description: "9,90 € par lead débloqué, sans abonnement ni engagement.",
    },
  };

  return (
    <main>
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />

      {/* ===================== HERO ===================== */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-semibold text-[var(--accent)] mb-4 tracking-wide uppercase">
            Pour les artisans
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
            Trouvez des chantiers près de chez vous.
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed mb-4 max-w-2xl mx-auto">
            Recevez les demandes des particuliers de votre zone. Payez{" "}
            <strong className="text-[var(--text-primary)]">
              9,90 € seulement
            </strong>{" "}
            pour débloquer un contact qui vous intéresse.
          </p>
          <p className="text-base text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            Pas d&apos;abonnement. Pas d&apos;engagement. Pas de commission sur
            vos chantiers. <strong>Le seul service qui affiche son prix.</strong>
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
            Inscription gratuite · Fiche en ligne en 2 minutes
          </p>
        </div>
      </section>

      {/* ============ BANDEAU PREUVE (chiffres réels) ============ */}
      <section className="px-4 py-12 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { n: "550 000+", l: "artisans référencés" },
            { n: "12 115", l: "communes couvertes" },
            { n: "40", l: "départements" },
            { n: "9,90 €", l: "le lead, tout compris" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--accent)] tabular-nums">
                {s.n}
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== COMPARATIF ===================== */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] text-center mb-4">
            Workwave vs les plateformes à abonnement
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            La plupart des plateformes cachent leur prix derrière un commercial
            ou un abonnement. Nous, on l&apos;affiche.
          </p>
          <div className="overflow-hidden rounded-2xl border border-[var(--card-border)]">
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left font-semibold text-[var(--text-secondary)] p-4"></th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] p-4">
                    Les autres
                  </th>
                  <th className="text-left font-bold text-[var(--accent)] p-4">
                    Workwave
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "" : "bg-[var(--bg-secondary)]"}
                  >
                    <td className="p-4 font-medium text-[var(--text-primary)] border-t border-[var(--card-border)]">
                      {row.feature}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)] border-t border-[var(--card-border)]">
                      {row.others}
                    </td>
                    <td className="p-4 font-medium text-[var(--text-primary)] border-t border-[var(--card-border)]">
                      {row.workwave}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center text-[var(--text-secondary)] text-sm max-w-2xl mx-auto">
            Exemple : sur un chantier à 20 000 €, une commission de 5 % vous
            coûte <strong className="text-[var(--text-primary)]">1 000 €</strong>
            . Chez Workwave, le même chantier vous a coûté{" "}
            <strong className="text-[var(--accent)]">9,90 €</strong>.
          </p>
        </div>
      </section>

      {/* ===================== COMMENT ÇA MARCHE ===================== */}
      <section className="px-4 py-20 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] text-center mb-12">
            Comment trouver des chantiers en 3 étapes
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                t: "Réclamez votre fiche",
                d: "Votre entreprise est sans doute déjà référencée (registre Sirene). Retrouvez votre fiche avec votre SIRET et activez-la gratuitement.",
              },
              {
                n: "2",
                t: "Recevez les demandes",
                d: "Dès qu'un particulier de votre zone et de votre métier dépose un projet, vous êtes notifié. Vous voyez le type de travaux, la ville, le budget.",
              },
              {
                n: "3",
                t: "Débloquez pour 9,90 €",
                d: "Le chantier vous intéresse ? Débloquez les coordonnées du particulier pour 9,90 € et contactez-le directement. Sinon, vous ne payez rien.",
              },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-lg font-bold mb-4">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {step.t}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {step.d}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Trouver ma fiche gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== POURQUOI WORKWAVE ===================== */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] text-center mb-12">
            Pourquoi les artisans choisissent Workwave
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                t: "Un prix clair, affiché",
                d: "9,90 € le contact. Pas de fourchette opaque, pas de devis commercial, pas de surprise en fin de mois.",
              },
              {
                t: "Zéro abonnement, zéro engagement",
                d: "Vous ne payez que quand vous voulez un contact. Aucun prélèvement mensuel, vous arrêtez quand vous voulez.",
              },
              {
                t: "Vous gardez 100 % de vos chantiers",
                d: "Aucune commission sur le montant de vos travaux. Le chantier est à vous, entièrement.",
              },
              {
                t: "Vous décidez avant de payer",
                d: "Vous consultez chaque demande (métier, zone, budget) et choisissez librement de débloquer, ou pas.",
              },
            ].map((b) => (
              <div
                key={b.t}
                className="rounded-2xl border border-[var(--card-border)] p-6 bg-[var(--card-bg)]"
              >
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {b.t}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {b.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="px-4 py-20 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-[var(--text-primary)]">
                  {item.q}
                  <span className="ml-4 text-[var(--accent)] transition-transform duration-250 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="px-4 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] mb-4">
            Vos prochains chantiers vous attendent.
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            Activez votre fiche gratuitement et recevez les demandes de votre
            zone. Vous ne payez que les contacts qui vous intéressent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Trouver ma fiche avec mon SIRET
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              En savoir plus sur l&apos;espace pro
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
