import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { titreFicheOuverte, descriptionFicheOuverte } from "../lib/seo/pro-registre";
import { getCategoryListing } from "../lib/utils/category-grammar";
const sb = getServiceClient();
const CAS: Record<string, [string, string]> = {
  "40178050700026": ["2026-05-05", "1995-08-05"],
  "30817902700054": ["2016-03-15", "1976-12-25"],
  "32817285300074": ["2020-01-16", "1983-09-09"],
  "39237297500038": ["2025-04-01", "1993-09-02"],
  "33882717300042": ["2016-10-01", "1986-08-01"],
  "40776840700097": ["2024-01-01", "1996-07-03"],
};
(async () => {
  const { data, error } = await sb.from("pros")
    .select("slug, name, siret, founding_date, forme_juridique, categories(slug, name), cities(name, postal_code, country)")
    .in("siret", Object.keys(CAS)).abortSignal(AbortSignal.timeout(60_000));
  if (error) { console.log("ERREUR", error.message); return; }
  for (const p of (data as any[]) || []) {
    const [etab, unite] = CAS[p.siret];
    const listing = getCategoryListing(p.categories.slug, p.categories.name);
    const f = { nom: p.name, metierSingulier: listing.singular, ville: p.cities?.name || "",
      codePostal: p.cities?.postal_code, pays: p.cities?.country, dateCreation: p.founding_date,
      formeJuridiqueCode: p.forme_juridique };
    console.log(`\n/artisan/${p.slug}   registre : etablissement ${etab} | entreprise ${unite}`);
    console.log(`  TITRE : ${titreFicheOuverte(f, p.categories.name, null)}`);
    console.log(`  META  : ${descriptionFicheOuverte(f)}`);
  }
})();
