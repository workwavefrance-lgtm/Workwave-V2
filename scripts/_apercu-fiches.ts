/**
 * Pour 6 fiches ouvertes reelles : ce que Google affiche AUJOURD HUI et ce qu il
 * afficherait avec le gabarit des fiches fermees, qui convertit 43 % mieux.
 */
import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { getCategoryListing } from "../lib/utils/category-grammar";
import { formeJuridiqueDistinctive } from "../lib/data/formes-juridiques";
const sb = getServiceClient();
/** Coupe a la derniere phrase entiere qui tient, jamais en plein mot. */
function couper(t: string, max: number): string {
  if (t.length <= max) return t;
  const bout = t.slice(0, max);
  const pt = bout.lastIndexOf(". ");
  if (pt > max * 0.6) return bout.slice(0, pt + 1);
  return bout.slice(0, bout.lastIndexOf(" ")) + "...";
}
(async () => {
  const slugs = ["marylene-cordonnier-00017", "orlane-verrier-00023", "lucie-guillou-00028", "salsac-entreprises-89440", "urbaser-environnement-00274", "dominique-welker-00028"];
  const { data } = await sb.from("pros")
    .select("slug, name, siret, founding_date, founded_year, forme_juridique, effectif_range, naf_code, description, description_ai, rge_certified, nom_commercial, enseignes, sirene_enrichi_at, categories(id, name, slug), cities(name, postal_code, departments(name, code))")
    .in("slug", slugs);
  const out: any[] = [];
  for (const p of (data || []) as any[]) {
    const ville = p.cities?.name || "";
    const ou = ville ? ` à ${ville}` : "";
    const listing = getCategoryListing(p.categories.slug, p.categories.name);
    const ancien = {
      titre: `${p.name} - ${p.categories.name} à ${ville} | Workwave.fr`,
      desc: (p.description || p.description_ai || `${p.name}, ${p.categories.name} à ${ville}. Contactez ce professionnel gratuitement.`).slice(0, 165),
    };
    const d = p.founding_date ? new Date(p.founding_date) : null;
    const creation = d ? `${d.getDate() === 1 ? "1er" : d.getDate()} ${d.toLocaleDateString("fr-FR", { month: "long" })} ${d.getFullYear()}` : null;
    const belge = (p.cities?.departments?.code || "").length > 2 || /^\d{4}$/.test(p.cities?.postal_code || "");
    const annee = p.founding_date ? new Date(p.founding_date).getFullYear() : p.founded_year;
    const anciennete = annee ? new Date().getFullYear() - annee : null;
    const forme = formeJuridiqueDistinctive(p.forme_juridique);
    const morceaux: string[] = [];
    morceaux.push(`${p.name}, ${listing.singular}${ou}${p.cities?.postal_code ? ` (${p.cities.postal_code})` : ""}.`);
    if (creation) morceaux.push(`Entreprise créée le ${creation}${anciennete ? `, ${anciennete} ans d'activité` : ""}.`);
    if (forme) morceaux.push(`${forme}.`);
    morceaux.push(belge ? `Numéro d'entreprise vérifié à la BCE. Demandez un devis gratuitement.` : `SIRET vérifié au registre officiel. Demandez un devis gratuitement.`);
    out.push({
      slug: p.slug, nom: p.name, metier: p.categories.name, ville,
      donnees: { creation, anciennete, forme, siret: p.siret, naf: p.naf_code, effectif: p.effectif_range, rge: p.rge_certified, enrichie: !!p.sirene_enrichi_at },
      ancien,
      nouveau: {
        titre: `${p.name} - ${p.categories.name}${ou}${anciennete ? `, depuis ${annee}` : ""}`,
        desc: couper(morceaux.join(" "), 158),
      },
    });
  }
  fs.writeFileSync("/tmp/apercu-fiches.json", JSON.stringify(out, null, 1));
  for (const o of out) {
    console.log(`\n=== ${o.nom} (${o.metier}, ${o.ville}) ===`);
    console.log(`AVANT titre : ${o.ancien.titre}`);
    console.log(`AVANT desc  : ${o.ancien.desc}`);
    console.log(`APRES titre : ${o.nouveau.titre}`);
    console.log(`APRES desc  : ${o.nouveau.desc}`);
  }
})();
