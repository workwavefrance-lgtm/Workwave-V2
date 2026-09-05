/**
 * Insère les 8 électriciens VOISINS de Châtillon-sur-Seine (≤45 km, nord Côte-d'Or)
 * dans `prospects`, issus du harvest Apify validé (dry-run du 08/06).
 * Idempotent (upsert onConflict phone). Ensuite : recruit-prospects --dept=21.
 *   npx tsx scripts/_insert-chatillon-8.ts          # dry-run
 *   npx tsx scripts/_insert-chatillon-8.ts --execute
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const EXECUTE = process.argv.includes("--execute");

const EIGHT = [
  { name: "Sarl Electrodom", phone: "0629051559", city: "Châtillon-sur-Seine" },
  { name: "Energies Solaires Chatillonnaises", phone: "0626774587", city: "Châtillon-sur-Seine" },
  { name: "Ghis'Elec", phone: "0683526127", city: "Montliot-et-Courcelles" },
  { name: "EURL GUENIN Stéphane", phone: "0687514536", city: "Louesme" },
  { name: "Ent LE GOFF Maël", phone: "0677555032", city: "Montbard" },
  { name: "DV Electricité Générale", phone: "0625938284", city: "Nogent-lès-Montbard" },
  { name: "Arfeux Jerome Jean Philippe", phone: "0684074213", city: "Ménétreux-le-Pitois" },
  { name: "SARL Bruneau Philippe", phone: "0633203770", city: "Venarey-les-Laumes" },
];

async function main() {
  const { data: cat } = await sb.from("categories").select("id").eq("slug", "electricien").single();
  const rows = EIGHT.map((p) => ({
    name: p.name, category_slug: "electricien", category_id: (cat as any)?.id ?? null,
    city: p.city, department_code: "21", phone: p.phone, source: "google_maps",
  }));
  console.log(`${EXECUTE ? "EXECUTE" : "DRY-RUN"} · ${rows.length} prospects électricien Châtillon (dept 21)`);
  if (!EXECUTE) { rows.forEach((r) => console.log(`  ${r.name} | ${r.phone} | ${r.city}`)); return; }
  const { error, count } = await sb.from("prospects").upsert(rows, { onConflict: "phone", ignoreDuplicates: true, count: "exact" });
  if (error) console.error("❌", error.message);
  else console.log(`✓ ${count ?? rows.length} prospects insérés (idempotent).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
