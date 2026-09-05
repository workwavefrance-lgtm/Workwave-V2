/** Quelle colonne de `pros` est limitee a 5 caracteres (erreur 22001 du run). */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: cle, Authorization: `Bearer ${cle}` } });
  const spec: any = await r.json();
  const props = spec?.definitions?.pros?.properties || {};
  const courtes = Object.entries(props)
    .map(([k, v]: any) => ({ col: k, fmt: v.format, max: v.maxLength }))
    .filter((x) => x.max != null && x.max <= 12);
  console.log("  colonnes de `pros` a longueur bornee :");
  for (const c of courtes.sort((a, b) => a.max - b.max)) console.log(`    ${c.col.padEnd(20)} ${c.fmt} max ${c.max}`);
  const ecrites = ["slug", "name", "siret", "siren", "category_id", "address", "city_id", "postal_code", "source", "naf_code", "founding_date", "forme_juridique", "effectif_range", "etat_admin", "entreprise_etat", "etat_verifie_at"];
  console.log("\n  parmi les colonnes que le scraper ecrit :");
  for (const e of ecrites) {
    const p: any = props[e];
    if (p?.maxLength) console.log(`    ${e.padEnd(20)} ${p.format} max ${p.maxLength}  <- candidat`);
  }
})();
