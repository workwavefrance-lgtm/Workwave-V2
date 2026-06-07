import type { City, Department } from "@/lib/types/database";
import type { CommuneData } from "@/lib/queries/commune-data";
import { hasCommuneData } from "@/lib/queries/commune-data";

type Props = {
  city: City & { department?: Department | null };
  categoryName: string;
  prosCount?: number;
  /** Enrichissement data.gouv.fr (prix immo DVF, revenus, vacance, densité). */
  communeData?: CommuneData | null;
};

function eur(n: number | null | undefined): string | null {
  return n == null ? null : n.toLocaleString("fr-FR") + " €";
}

/**
 * Bloc "[ville] en chiffres" affiche sur les pages /[metier]/[ville].
 *
 * Genere un passage factuel a partir de la population de la commune
 * (deja en base, source INSEE), d'estimations derivees standard
 * (1 logement / 2.3 habitants en France) et d'une categorisation
 * de marche selon la taille (rural / petite ville / ville moyenne /
 * grande agglomeration).
 *
 * Pourquoi : contenu unique factuel par ville = exactement ce que Google
 * recompense pour le SEO local et ce que les LLM citent. Casse le risque
 * "duplicate content" entre nos 12 000+ pages ville.
 */
export default function CityFactsBlock({
  city,
  categoryName,
  prosCount,
  communeData,
}: Props) {
  const pop = city.population;
  if (!pop) return null;

  const cityName = city.name;
  const deptName = city.department?.name || "";
  const deptCode = city.department?.code || "";
  const lcCategory = categoryName.toLowerCase();

  // Estimation logements (ratio moyen France 2.3 hab/logement)
  const estimatedHomes = Math.round(pop / 2.3);
  const homesStr = estimatedHomes.toLocaleString("fr-FR");
  const popStr = pop.toLocaleString("fr-FR");

  // Densite pro/habitant : 1 pro pour X habitants. Affichee uniquement si
  // pop >= 1000 et au moins 2 pros (sinon le ratio est peu significatif).
  const showDensity = !!prosCount && prosCount >= 2 && pop >= 1000;
  const habitantsParPro = showDensity ? Math.round(pop / prosCount!) : null;

  // Categorisation marche
  let marketTier: "rural" | "small" | "medium" | "large";
  let marketLabel: string;
  if (pop < 2000) {
    marketTier = "rural";
    marketLabel = "petite commune rurale";
  } else if (pop < 10000) {
    marketTier = "small";
    marketLabel = "commune de taille intermediaire";
  } else if (pop < 50000) {
    marketTier = "medium";
    marketLabel = "ville moyenne";
  } else {
    marketTier = "large";
    marketLabel = "grande agglomeration";
  }

  // Texte adapte selon la taille du marche
  let marketSentence: string;
  switch (marketTier) {
    case "rural":
      marketSentence = `${cityName} est une ${marketLabel} de la ${deptName}, comptant ${popStr} habitants et environ ${homesStr} logements. Le marche local pour les ${lcCategory}s est restreint mais souvent fidelise par le bouche-a-oreille et les recommandations entre voisins.`;
      break;
    case "small":
      marketSentence = `Avec ses ${popStr} habitants repartis dans environ ${homesStr} logements, ${cityName} est une ${marketLabel} de la ${deptName} (${deptCode}). Les ${lcCategory}s y trouvent une clientele de proximite stable, avec une demande reguliere pour l'entretien et les petits travaux du quotidien.`;
      break;
    case "medium":
      marketSentence = `${cityName}, ${marketLabel} de ${popStr} habitants en ${deptName}, represente un marche significatif pour les ${lcCategory}s. La commune compte environ ${homesStr} logements, ce qui constitue un volume important de chantiers potentiels — renovation, depannage et travaux d'amelioration energetique.`;
      break;
    case "large":
      marketSentence = `${cityName} est une ${marketLabel} de ${popStr} habitants, l'une des principales villes de la ${deptName}. Avec environ ${homesStr} logements, le marche local pour les ${lcCategory}s est dense et concurrentiel, avec une forte demande sur la renovation, l'efficacite energetique et la mise aux normes.`;
      break;
  }

  return (
    <section className="mt-12 pt-8 border-t border-[var(--border-color)]">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {cityName} en chiffres
        </h2>
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--card-border)]">
          Source INSEE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
            {popStr}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">habitants</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
            ~{homesStr}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">logements</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
            {deptCode}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">{deptName}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1 capitalize">
            {marketTier === "rural"
              ? "Rural"
              : marketTier === "small"
              ? "Local"
              : marketTier === "medium"
              ? "Moyen"
              : "Dense"}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">marché local</p>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {marketSentence}
      </p>

      {/* Densite pro/habitant : signal d'engagement utilisateur fort.
          Calcul a la volee : population / count(pros dans cette cat).
          Affiche uniquement si la ville a >= 1000 habitants et >= 2 pros
          dans la categorie courante (sinon le ratio est peu significatif). */}
      {showDensity && habitantsParPro !== null && (
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
          A {cityName}, on compte <strong className="text-[var(--text-primary)]">{prosCount} {lcCategory}{prosCount! > 1 ? "s" : ""}</strong> pour <strong className="text-[var(--text-primary)]">{popStr} habitants</strong>, soit <strong className="text-[var(--text-primary)]">1 {lcCategory} pour {habitantsParPro.toLocaleString("fr-FR")} habitants</strong>.
        </p>
      )}

      {/* Marché immobilier & local — VRAIES données data.gouv.fr (DVF prix immo,
          FiLoSoFi revenus, LOVAC vacance, densité). Affiché uniquement si la
          commune a des données exploitables (sinon rien = pas de bloc vide).
          Contenu factuel UNIQUE par commune = moat SEO. */}
      {hasCommuneData(communeData) && communeData && (() => {
        const cards: { value: string; label: string }[] = [];
        if (communeData.prix_m2_moyen != null)
          cards.push({ value: eur(communeData.prix_m2_moyen)!, label: "prix moyen au m²" });
        if (communeData.revenu_median != null)
          cards.push({ value: eur(communeData.revenu_median)!, label: "revenu médian / an" });
        if (communeData.taux_vacance != null)
          cards.push({ value: `${communeData.taux_vacance.toLocaleString("fr-FR")} %`, label: "logements vacants" });
        if (communeData.densite_hab_km2 != null)
          cards.push({ value: communeData.densite_hab_km2.toLocaleString("fr-FR"), label: "hab/km²" });
        if (cards.length === 0) return null;

        // Phrase factuelle tissée à partir des données réelles disponibles.
        const bits: string[] = [];
        if (communeData.prix_m2_moyen != null)
          bits.push(`l'immobilier s'y vend en moyenne ${eur(communeData.prix_m2_moyen)}/m²${communeData.dvf_annee ? ` (DVF ${communeData.dvf_annee})` : ""}`);
        if (communeData.revenu_median != null)
          bits.push(`le revenu médian des habitants est de ${eur(communeData.revenu_median)} par an`);
        if (communeData.taux_vacance != null && communeData.taux_vacance >= 8)
          bits.push(`${communeData.taux_vacance.toLocaleString("fr-FR")} % des logements privés sont vacants — un parc à rénover qui génère de la demande pour les ${lcCategory}s`);
        else if (communeData.taux_vacance != null)
          bits.push(`le taux de logements vacants y est de ${communeData.taux_vacance.toLocaleString("fr-FR")} %`);

        return (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Marché immobilier &amp; local à {cityName}
              </h3>
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--card-border)]">
                Source data.gouv.fr
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {cards.map((c) => (
                <div key={c.label} className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1">{c.value}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
                </div>
              ))}
            </div>
            {bits.length > 0 && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                À {cityName}, {bits.join(", ")}.
              </p>
            )}
            <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              Sources : DVF (valeurs foncières), INSEE FiLoSoFi (revenus), LOVAC (logements vacants) — data.gouv.fr, Licence Ouverte.
            </p>
          </div>
        );
      })()}
    </section>
  );
}
