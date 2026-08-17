/**
 * Efface les notes Google attribuees a PLUSIEURS fiches a la fois.
 *
 * Constat du 11/08/2026 : 297 fiches sur 938 enrichies (31,7 %) partagent leur
 * identifiant Google avec au moins une autre. Une seule fiche Google collee sur
 * jusqu'a DIX entreprises :
 *     GM ETANCHEITE | SOPRAD ETANCHEITE | BENABEL ETANCHEITE | ...
 *     MARC DUVAL | ELIE DUVAL | CHARLOTTE DUVAL | NAIM DUVAL | ...
 * Toutes rapprochees sur un mot commun par l'enrichissement Apify d'avril.
 *
 * Une seule de chaque groupe peut etre la bonne, et rien ne permet de savoir
 * laquelle. On efface donc TOUT le groupe : une note absente ne coute rien,
 * une note fausse decredibilise la fiche et trompe le visiteur.
 * On efface aussi les notes au nombre d'avis invraisemblable pour un artisan.
 *
 * Le telephone, l'email et le site ne sont PAS touches : ce sont eux qui
 * permettront de reenrichir proprement (scripts/enrichir-notes-google.ts).
 *
 *   npx tsx scripts/_nettoyer-notes-partagees.ts              # simulation
 *   npx tsx scripts/_nettoyer-notes-partagees.ts --appliquer
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const APPLIQUER = process.argv.includes("--appliquer");
const SEUIL_AVIS = 300;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  // Pagination : un count exact sur 2,5 M de lignes echoue en SILENCE et
  // renvoie 0 (constate ce soir, j'ai cru qu'aucune fiche n'avait de note).
  const PAGE = 1000; let offset = 0; const toutes: any[] = [];
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("id, name, google_place_id, google_rating, google_reviews_count")
      .not("google_rating", "is", null)
      .eq("is_active", true).is("deleted_at", null)
      .range(offset, offset + PAGE - 1);
    if (error) { console.error("ERREUR:", error.message); process.exit(1); }
    const rows = data || []; if (rows.length === 0) break;
    toutes.push(...rows); offset += rows.length;
  }
  console.log(`${toutes.length} fiches actives portent une note Google\n`);

  const parId: Record<string, any[]> = {};
  toutes.forEach((p) => { if (p.google_place_id) (parId[p.google_place_id] ||= []).push(p); });

  const partagees = Object.values(parId).filter((v) => v.length > 1).flat();
  const invraisemblables = toutes.filter((p) => (p.google_reviews_count ?? 0) > SEUIL_AVIS);
  const ids = [...new Set([...partagees, ...invraisemblables].map((p) => p.id))];

  console.log(`  identifiant Google partage a plusieurs fiches : ${partagees.length}`);
  console.log(`  plus de ${SEUIL_AVIS} avis (invraisemblable pour un artisan) : ${invraisemblables.length}`);
  console.log(`  a nettoyer au total (sans doublon) : ${ids.length}\n`);

  if (!APPLIQUER) { console.log("(simulation, relancer avec --appliquer)"); return; }

  // Par lots : un IN() de 300 identifiants passe, 3 000 non.
  let total = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const lot = ids.slice(i, i + 200);
    const { error, count } = await sb.from("pros")
      .update({ google_rating: null, google_reviews_count: null,
                google_place_id: null, google_enriched_at: null }, { count: "exact" })
      .in("id", lot);
    if (error) { console.error("ERREUR ecriture :", error.message); process.exit(1); }
    total += count ?? 0;
  }
  console.log(`  ${total} fiches nettoyees.`);

  // VERIFICATION EN BASE, jamais sur le retour du script (lecon du 08/08).
  const { data: reste } = await sb.from("pros").select("id").in("id", ids.slice(0, 500))
    .not("google_rating", "is", null);
  console.log(`  verification : ${(reste || []).length} fiche(s) de l'echantillon gardent une note (doit etre 0)`);
})();
