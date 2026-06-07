import type { DepartmentMarket } from "@/lib/data/department-market";

type Props = {
  deptName: string;
  deptCode: string;
  categoryName: string;
  market: DepartmentMarket | null | undefined;
};

function eur(n: number | null | undefined): string | null {
  return n == null ? null : n.toLocaleString("fr-FR") + " €";
}

/**
 * Bloc "Marché immobilier en [département]" sur les pages listing dept.
 *
 * Données RÉELLES agrégées de commune_data (data.gouv.fr : DVF prix, FiLoSoFi
 * revenus, LOVAC vacance), pondérées par population, gate de représentativité
 * appliqué à la génération (cf. scripts/build-department-market.ts). Zéro chiffre
 * inventé. Affiché uniquement si le prix OU le revenu est disponible (sinon un
 * stat isolé serait peu parlant). Contenu unique factuel par dépt = moat SEO.
 */
export default function DeptMarketBlock({
  deptName,
  deptCode,
  categoryName,
  market,
}: Props) {
  if (!market) return null;
  // On exige au moins le prix OU le revenu pour afficher le bloc (un taux de
  // vacance seul, ex. DOM, serait peu parlant et potentiellement alarmant).
  if (market.prix_m2_moyen == null && market.revenu_median == null) return null;

  const lcCategory = categoryName.toLowerCase();

  const cards: { value: string; label: string }[] = [];
  if (market.prix_m2_moyen != null)
    cards.push({ value: eur(market.prix_m2_moyen)!, label: "prix moyen au m²" });
  if (market.revenu_median != null)
    cards.push({ value: eur(market.revenu_median)!, label: "revenu médian / an" });
  if (market.taux_vacance != null)
    cards.push({ value: `${market.taux_vacance.toLocaleString("fr-FR")} %`, label: "logements vacants" });
  if (market.logements_vacants != null)
    cards.push({ value: market.logements_vacants.toLocaleString("fr-FR"), label: "logements à rénover" });

  // Phrase factuelle tissée à partir des données réelles disponibles.
  const bits: string[] = [];
  if (market.prix_m2_moyen != null)
    bits.push(`l'immobilier s'y vend en moyenne ${eur(market.prix_m2_moyen)}/m²${market.dvf_annee ? ` (DVF ${market.dvf_annee})` : ""}`);
  if (market.revenu_median != null)
    bits.push(`le revenu médian des habitants est de ${eur(market.revenu_median)} par an${market.filosofi_annee ? ` (INSEE ${market.filosofi_annee})` : ""}`);
  if (market.taux_vacance != null && market.logements_vacants != null)
    bits.push(`${market.taux_vacance.toLocaleString("fr-FR")} % du parc privé est vacant, soit environ ${market.logements_vacants.toLocaleString("fr-FR")} logements à rénover qui soutiennent la demande pour les ${lcCategory}s`);
  else if (market.taux_vacance != null)
    bits.push(`le taux de logements vacants y est de ${market.taux_vacance.toLocaleString("fr-FR")} %`);

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <div className="border-t border-[var(--border-color)] pt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Marché immobilier en {deptName} ({deptCode})
          </h2>
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--card-border)]">
            Source data.gouv.fr
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 text-center"
            >
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                {c.value}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
            </div>
          ))}
        </div>

        {bits.length > 0 && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            En {deptName}, {bits.join(", ")}.
          </p>
        )}

        <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
          Données agrégées sur {market.nb_communes.toLocaleString("fr-FR")} communes du
          département. Sources : DVF (valeurs foncières), INSEE FiLoSoFi (revenus),
          LOVAC (logements vacants) — data.gouv.fr, Licence Ouverte.
        </p>
      </div>
    </section>
  );
}
