import type { CompetitorOffer } from "@/lib/data/competitor-offers";

/**
 * Tableau comparatif factuel Workwave vs un concurrent.
 *
 * SÉCURITÉ JURIDIQUE (pub comparative L121-8 C. conso) : toutes les données
 * concurrent viennent de `lib/data/competitor-offers.ts` (sourcées Perplexity,
 * citées + datées). Aucune donnée non confirmée (null) n'est affichée. La note
 * de sources en bas date l'info et renvoie au site du concurrent + invite à
 * vérifier. Présentation objective, non dénigrante.
 */

// Offre Workwave (faits internes, stables).
const WORKWAVE = {
  model: "Pay-per-lead transparent",
  price: "9,90 € TTC / lead débloqué",
  priceDetail: "Paiement unique par projet, à l'unité",
  commitment: "Aucun engagement",
  subscription: "Aucun abonnement",
  leads: "Reçu gratuitement, projet visible avant de payer — déblocage à la carte (9,90 €)",
  commission: "0 % de commission sur vos devis",
  signup: "Inscription gratuite, sans carte bancaire",
};

type Row = { label: string; ww: string; comp: string | null };

function buildRows(c: CompetitorOffer): Row[] {
  const rows: Row[] = [
    { label: "Modèle de facturation", ww: WORKWAVE.model, comp: c.model },
    { label: "Prix payé par le pro", ww: WORKWAVE.price, comp: c.price_text },
    { label: "Engagement", ww: WORKWAVE.commitment, comp: c.commitment },
    { label: "Partage du lead", ww: WORKWAVE.leads, comp: c.leads_shared },
    { label: "Frais d'inscription", ww: WORKWAVE.signup, comp: c.signup_fee },
  ];
  // On n'affiche une ligne concurrent que si la donnée est confirmée (sinon "—"
  // côté concurrent, jamais une affirmation inventée). On garde la ligne pour
  // montrer la valeur Workwave, avec "Non communiqué" côté concurrent.
  return rows;
}

function CheckDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full mr-2 shrink-0 align-middle"
      style={{ backgroundColor: "var(--accent)" }}
      aria-hidden="true"
    />
  );
}

export default function CompetitorComparison({
  competitor,
}: {
  competitor: CompetitorOffer;
}) {
  const rows = buildRows(competitor);
  const fmtDate = (iso: string) => {
    const [y, m] = iso.split("-");
    const mois = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre",
    ];
    return `${mois[parseInt(m, 10) - 1]} ${y}`;
  };

  return (
    <div>
      {/* En-têtes des 2 colonnes */}
      <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[1.2fr_1fr_1fr] gap-px bg-[var(--border-color)] rounded-2xl overflow-hidden border border-[var(--border-color)]">
        {/* ligne d'en-tête */}
        <div className="hidden sm:block bg-[var(--bg-secondary)] p-4" />
        <div className="bg-[var(--accent-muted)] p-4 text-center">
          <p className="font-bold text-[var(--text-primary)]">Workwave</p>
        </div>
        <div className="bg-[var(--bg-secondary)] p-4 text-center">
          <p className="font-bold text-[var(--text-primary)]">{competitor.name}</p>
        </div>

        {/* lignes critères */}
        {rows.map((r) => (
          <Row key={r.label} row={r} />
        ))}
      </div>

      {/* Note de sources — datée, citée, invite à vérifier (légal) */}
      <div className="mt-5 text-xs text-[var(--text-tertiary)] leading-relaxed">
        <p>
          Données {competitor.name} indicatives, issues de sources publiques
          tierces constatées en {fmtDate(competitor.retrievedAt)}, susceptibles
          d&apos;évoluer — vérifiez les conditions à jour sur{" "}
          <a
            href={`https://${competitor.site}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline hover:text-[var(--accent)]"
          >
            {competitor.site}
          </a>
          . Comparatif objectif au sens de l&apos;article L121-8 du Code de la
          consommation.
        </p>
        {competitor.sources.length > 0 && (
          <p className="mt-2">
            Sources :{" "}
            {competitor.sources.map((s, i) => {
              let host = s;
              try {
                host = new URL(s).hostname.replace(/^www\./, "");
              } catch {
                /* garde l'URL brute si parse échoue */
              }
              return (
                <span key={s}>
                  {i > 0 && ", "}
                  <a
                    href={s}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline hover:text-[var(--accent)]"
                  >
                    {host}
                  </a>
                </span>
              );
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ row }: { row: Row }) {
  return (
    <>
      {/* Label : pleine largeur sur mobile (au-dessus des 2 valeurs) */}
      <div className="col-span-2 sm:col-span-1 bg-[var(--bg-secondary)] px-4 pt-4 pb-1 sm:py-4">
        <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
          {row.label}
        </p>
      </div>
      <div className="bg-[var(--bg-primary)] p-4">
        <p className="text-sm text-[var(--text-primary)] leading-snug">
          <CheckDot />
          {row.ww}
        </p>
      </div>
      <div className="bg-[var(--bg-primary)] p-4">
        <p className="text-sm text-[var(--text-secondary)] leading-snug">
          {row.comp ?? <span className="text-[var(--text-tertiary)]">Non communiqué</span>}
        </p>
      </div>
    </>
  );
}
