import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { titreFicheOuverte, descriptionFicheOuverte } from "../lib/seo/pro-registre";
import { getCategoryListing } from "../lib/utils/category-grammar";
const sb = getServiceClient();
(async () => {
  const { data, error } = await sb.from("pros")
    .select("slug, name, founding_date, forme_juridique, etat_admin, is_active, deleted_at, categories(slug, name), cities(name, postal_code, country)")
    .gte("founding_date", "1900-01-01").lt("founding_date", "1900-01-02")
    .eq("is_active", true).is("deleted_at", null).limit(200).abortSignal(AbortSignal.timeout(120_000));
  if (error) { console.log("ERREUR", error.message); return; }
  const courts = ((data as any[]) || []).filter(p => p.name.length <= 22 && p.categories && p.cities && p.etat_admin !== "F");
  console.log(`fiches actives a 1900-01-01 lues : ${(data||[]).length}, dont noms courts : ${courts.length}`);
  for (const p of courts.slice(0, 5)) {
    const listing = getCategoryListing(p.categories.slug, p.categories.name);
    const f = { nom: p.name, metierSingulier: listing.singular, ville: p.cities.name, codePostal: p.cities.postal_code,
      pays: p.cities.country, dateCreation: p.founding_date, formeJuridiqueCode: p.forme_juridique };
    console.log(`\n/artisan/${p.slug}`);
    console.log(`  TITRE : ${titreFicheOuverte(f, p.categories.name, null)}`);
    console.log(`  META  : ${descriptionFicheOuverte(f)}`);
  }
})();
