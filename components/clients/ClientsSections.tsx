import Link from "next/link";
import { CLIENTS_FAQ, CLIENTS_COMPARISON } from "@/lib/data/clients";

// Sections partagées des pages "trouver des clients" (services à domicile &
// aide à la personne). Pendant de ChantiersSections (BTP). Le HERO reste propre
// à chaque page (dynamique métier) ; le reste est mutualisé.

type Props = {
  /** Mot pour personnaliser le CTA final ("de ménage", "de garde d'enfants"…). */
  contextLabel?: string;
};

export default function ClientsSections({ contextLabel }: Props) {
  return (
    <>
      {/* ============ BANDEAU PREUVE ============ */}
      <section className="px-4 py-12 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { n: "35 163", l: "communes couvertes" },
            { n: "107", l: "départements et provinces" },
            { n: "0 €", l: "d'abonnement" },
            { n: "9,90 €", l: "le contact, tout compris" },
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
            La plupart des plateformes cachent leur prix ou prennent une
            commission sur chaque mission. Nous, on affiche un prix fixe.
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
                {CLIENTS_COMPARISON.map((row, i) => (
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
            Une commission sur chaque prestation, ça grignote vos revenus à
            l&apos;année. Chez Workwave, un client =
            <strong className="text-[var(--accent)]"> 9,90 €</strong>, une seule
            fois, et tout ce que vous facturez reste à vous.
          </p>
        </div>
      </section>

      {/* ===================== COMMENT ÇA MARCHE ===================== */}
      <section className="px-4 py-20 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] text-center mb-12">
            Comment trouver des clients en 3 étapes
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                t: "Créez votre fiche",
                d: "Gratuitement, en quelques minutes. Indiquez votre service et votre zone d'intervention. Si votre entreprise existe déjà, réclamez votre fiche avec votre SIRET.",
              },
              {
                n: "2",
                t: "Recevez les demandes",
                d: "Dès qu'un particulier de votre zone cherche votre service, vous êtes notifié. Vous voyez le service demandé, la ville, le budget.",
              },
              {
                n: "3",
                t: "Débloquez pour 9,90 €",
                d: "Le client vous intéresse ? Débloquez ses coordonnées pour 9,90 € et contactez-le directement. Sinon, vous ne payez rien.",
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
              href="/pro/creer-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Créer ma fiche gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== POURQUOI WORKWAVE ===================== */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)] text-center mb-12">
            Pourquoi les professionnels choisissent Workwave
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                t: "Un prix clair, affiché",
                d: "9,90 € le contact. Pas de fourchette opaque, pas de devis commercial, pas de surprise en fin de mois.",
              },
              {
                t: "Zéro abonnement, zéro engagement",
                d: "Vous ne payez que quand vous voulez un client. Aucun prélèvement mensuel, vous arrêtez quand vous voulez.",
              },
              {
                t: "Vous gardez 100 % de vos revenus",
                d: "Aucune commission sur vos prestations. Ce que vous facturez à vos clients est à vous, entièrement.",
              },
              {
                t: "Vous décidez avant de payer",
                d: "Vous consultez chaque demande (service, zone, budget) et choisissez librement de débloquer, ou pas.",
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
            {CLIENTS_FAQ.map((item) => (
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
            Vos prochains clients{contextLabel ? ` ${contextLabel}` : ""} vous
            attendent.
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            Créez votre fiche gratuitement et recevez les demandes de votre
            zone. Vous ne payez que les clients qui vous intéressent.
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
        </div>
      </section>
    </>
  );
}
