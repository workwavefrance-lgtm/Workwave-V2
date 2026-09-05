/**
 * Insère les 17 plombiers VOISINS de Les Billanges (≤ ~25 km, Haute-Vienne 87),
 * issus du harvest Apify validé (dry-run 08/06). Idempotent (upsert onConflict phone).
 * Ensuite : recruit-prospects --project=65 (message avec résumé du projet).
 *   npx tsx scripts/_insert-billanges-17.ts --execute
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const EXECUTE = process.argv.includes("--execute");

const LIST = [
  { name: "MOREAU SERVICES", phone: "0767756388", city: "Saint-Léger-la-Montagne" },
  { name: "E.I. Vaz Rémi", phone: "0623207625", city: "Ambazac" },
  { name: "Benjamin Merigaud SASU", phone: "0685294716", city: "Nantiat" },
  { name: "BM Chauffage", phone: "0673356042", city: "Compreignac" },
  { name: "Lavillauroy père et fils", phone: "0607763485", city: "Bessines-sur-Gartempe" },
  { name: "SARL LABBENS", phone: "0642623292", city: "Bessines-sur-Gartempe" },
  { name: "Avenir Habitat Limousin", phone: "0621775249", city: "Bessines-sur-Gartempe" },
  { name: "CONFORT ET SERVICES 87", phone: "0686412019", city: "Razès" },
  { name: "Lejeune et Fils", phone: "0640160828", city: "Razès" },
  { name: "Noblat Energie", phone: "0788800213", city: "Saint-Léonard-de-Noblat" },
  { name: "PratiK'Services", phone: "0650809210", city: "Saint-Léonard-de-Noblat" },
  { name: "Entreprise GTC", phone: "0651326980", city: "Eybouleuf" },
  { name: "EURL Clavaud Dépannage", phone: "0603966632", city: "Saint-Just-le-Martel" },
  { name: "NP Services", phone: "0630956075", city: "Chaptelat" },
  { name: "Dufour Plomberie Chauffage", phone: "0607672167", city: "Saint-Jouvent" },
  { name: "Tuy'eau d'OR", phone: "0626857538", city: "Neuvic-Entier" },
  { name: "L&M Pro Services", phone: "0624155105", city: "Châteauponsac" },
];

async function main() {
  const { data: cat } = await sb.from("categories").select("id").eq("slug", "plombier").single();
  const rows = LIST.map((p) => ({
    name: p.name, category_slug: "plombier", category_id: (cat as any)?.id ?? null,
    city: p.city, department_code: "87", phone: p.phone, source: "google_maps",
  }));
  console.log(`${EXECUTE ? "EXECUTE" : "DRY-RUN"} · ${rows.length} plombiers Les Billanges (dept 87)`);
  if (!EXECUTE) { rows.forEach((r) => console.log(`  ${r.name} | ${r.phone} | ${r.city}`)); return; }
  const { error, count } = await sb.from("prospects").upsert(rows, { onConflict: "phone", ignoreDuplicates: true, count: "exact" });
  if (error) console.error("❌", error.message);
  else console.log(`✓ ${count ?? rows.length} prospects insérés (idempotent).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
