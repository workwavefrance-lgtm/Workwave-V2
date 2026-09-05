import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
import { titreFicheOuverte, descriptionFicheOuverte } from "../lib/seo/pro-registre";
import { getCategoryListing } from "../lib/utils/category-grammar";
const sb = getServiceClient();

(async () => {
  const a = JSON.parse(fs.readFileSync("/tmp/wf-sirene-dates.json", "utf8"));
  const b = JSON.parse(fs.readFileSync("/tmp/wf-sirene-dates-ancien.json", "utf8"));
  const an = (d: string) => Number(d.slice(0, 4));
  const cas = [...a, ...b].filter((r: any) => r.etab && r.unite && an(r.etab) - an(r.unite) >= 15 && an(r.unite) > 1901)
    .sort((x: any, y: any) => (an(y.etab) - an(y.unite)) - (an(x.etab) - an(x.unite)));
  const sirets = cas.slice(0, 40).map((c: any) => c.siret);
  const { data } = await sb.from("pros")
    .select("slug, name, siret, founding_date, forme_juridique, categories(slug, name), cities(name, postal_code, country)")
    .in("siret", sirets).limit(40).abortSignal(AbortSignal.timeout(60_000));
  let n = 0;
  for (const p of (data as any[]) || []) {
    const c = cas.find((x: any) => x.siret === p.siret);
    if (!p.categories || !p.cities) continue;
    const listing = getCategoryListing(p.categories.slug, p.categories.name);
    const f = {
      nom: p.name, metierSingulier: listing.singular, ville: p.cities.name,
      codePostal: p.cities.postal_code, pays: p.cities.country,
      dateCreation: p.founding_date, formeJuridiqueCode: p.forme_juridique,
    };
    console.log(`\n/artisan/${p.slug}`);
    console.log(`  registre : etablissement ${c.etab}  |  entreprise ${c.unite}  (${an(c.etab) - an(c.unite)} ans d'ecart)`);
    console.log(`  TITRE servi apres deploiement : ${titreFicheOuverte(f, p.categories.name, null)}`);
    console.log(`  META  servie apres deploiement : ${descriptionFicheOuverte(f)}`);
    if (++n >= 6) break;
  }
})();
