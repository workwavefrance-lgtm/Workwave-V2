/**
 * Repasse sur les fiches enrichies ce soir et efface celles qui ne tiennent
 * pas les garde-fous ajoutes apres coup (type d'etablissement aberrant,
 * nombre d'avis invraisemblable pour un artisan, ou fiche sans telephone ni
 * site — donc rapprochee par nom, ce qui n'aurait jamais du arriver).
 *
 *   npx tsx scripts/_nettoyer-enrichissement.ts             # simulation
 *   npx tsx scripts/_nettoyer-enrichissement.ts --appliquer
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const CLE = process.env.GOOGLE_PLACES_API_KEY!;
const APPLIQUER = process.argv.includes("--appliquer");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

const TYPES_INTERDITS = /supermarket|hypermarket|grocery|store|restaurant|cafe|bar|hotel|bank|pharmacy|gas_station|school|hospital|shopping/i;

(async () => {
  const { data } = await sb.from("pros")
    .select("id, slug, name, phone, website, google_place_id, google_rating, google_reviews_count")
    .not("google_enriched_at", "is", null)
    .gte("google_enriched_at", "2026-08-11T00:00:00Z");
  const fiches = (data || []) as any[];
  console.log(`${fiches.length} fiches enrichies aujourd'hui\n`);

  const aEffacer: any[] = [];
  for (const p of fiches) {
    // Cas 1 : aucune cle fiable -> rapprochee par nom -> a effacer sans appel.
    if (!p.phone && !p.website) {
      aEffacer.push({ ...p, raison: "aucun telephone ni site : rapprochee par nom" });
      continue;
    }
    // Cas 2 : nombre d'avis invraisemblable -> a effacer sans appel.
    if ((p.google_reviews_count ?? 0) > 300) {
      aEffacer.push({ ...p, raison: `${p.google_reviews_count} avis, invraisemblable pour un artisan` });
      continue;
    }
    // Cas 3 : on redemande le type a Google (1 appel, dans le quota).
    if (!p.google_place_id) continue;
    const r = await fetch(`https://places.googleapis.com/v1/places/${p.google_place_id}`, {
      headers: { "X-Goog-Api-Key": CLE, "X-Goog-FieldMask": "primaryType,displayName" },
    });
    if (!r.ok) continue;
    const g = await r.json();
    if (TYPES_INTERDITS.test(g.primaryType || "")) {
      aEffacer.push({ ...p, raison: `type "${g.primaryType}" (${g.displayName?.text})` });
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`${aEffacer.length} fiches a nettoyer :\n`);
  aEffacer.forEach((p) => console.log(`  ${p.name.slice(0, 30).padEnd(32)} ${p.raison}`));

  if (!APPLIQUER) { console.log("\n(simulation — relancer avec --appliquer)"); return; }
  if (aEffacer.length === 0) { console.log("\nrien a nettoyer."); return; }

  const ids = aEffacer.map((p) => p.id);
  const { error, count } = await sb.from("pros")
    .update({ google_rating: null, google_reviews_count: null, google_place_id: null,
              google_enriched_at: null }, { count: "exact" })
    .in("id", ids);
  if (error) { console.error("\nERREUR :", error.message); process.exit(1); }
  console.log(`\n${count} fiches nettoyees.`);

  // VERIFICATION EN BASE, pas sur le retour du script (lecon du 08/08).
  const { data: reste } = await sb.from("pros").select("id")
    .in("id", ids).not("google_rating", "is", null);
  console.log(`verification : ${(reste || []).length} fiche(s) encore avec une note (doit etre 0)`);
})();
