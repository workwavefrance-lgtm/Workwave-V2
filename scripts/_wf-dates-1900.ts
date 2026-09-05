import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

(async () => {
  // Toutes les fiches dont la date de creation est anterieure a 1901.
  // On lit les LIGNES (pagination 1000, arret sur page vide) plutot que de
  // demander un count exact : le count sur cette colonne non indexee depasse
  // le delai (mesure a l'instant, 3 essais sur 240 s).
  const par: Record<string, number> = {};
  const exemples: any[] = [];
  let lastId = 0, total = 0;
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("id, slug, name, siret, founding_date, founded_year, is_active, deleted_at, created_at, source")
      .lt("founding_date", "1901-01-01").gt("id", lastId).order("id").limit(1000)
      .abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERREUR", error.message); break; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      const d = String(r.founding_date).slice(0, 10);
      par[d] = (par[d] || 0) + 1;
      total++;
      if (d === "1900-01-01" && exemples.length < 8 && r.is_active && !r.deleted_at) exemples.push(r);
    }
    lastId = rows[rows.length - 1].id;
    process.stdout.write(`\r  ${total} lignes lues...`);
  }
  console.log(`\n\nTotal founding_date < 1901-01-01 : ${total}`);
  const tri = Object.entries(par).sort((a, b) => b[1] - a[1]);
  for (const [d, n] of tri.slice(0, 12)) console.log(`  ${d} : ${n}`);
  console.log(`  (${tri.length} dates distinctes)`);
  console.log("\nExemples 1900-01-01 actifs :");
  for (const e of exemples) console.log(`  /artisan/${e.slug}  founded_year=${e.founded_year}  cree_le=${String(e.created_at).slice(0,10)}  source=${e.source}`);
})();
