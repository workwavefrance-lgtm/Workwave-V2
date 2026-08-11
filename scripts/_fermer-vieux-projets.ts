/**
 * Ferme les projets deposes AVANT une date donnee.
 *
 * POURQUOI : les projets de mai-juin restaient proposes aux pros dans leur
 * dashboard — des chantiers morts depuis des semaines. Un pro qui debloque un
 * lead de deux mois paie 9,90 € pour rien, et perd confiance.
 *
 * CE QUE "closed" CHANGE (depuis le commit qui accompagne ce script) :
 *   - le projet disparait du feed du dashboard pro et des projets disponibles
 *   - les crons de relance et de rattrapage de diffusion l'ignorent
 *   - il reste VISIBLE dans l'admin (c'est l'historique)
 *   - un lead DEJA PAYE reste accessible au pro qui l'a achete
 *
 * USAGE
 *   npx tsx scripts/_fermer-vieux-projets.ts              # simulation
 *   npx tsx scripts/_fermer-vieux-projets.ts --appliquer  # ecrit en base
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const AVANT = "2026-07-01T00:00:00Z";
const APPLIQUER = process.argv.includes("--appliquer");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

(async () => {
  // On ne touche QU'AUX projets encore ouverts : jamais un "deleted" (RGPD),
  // jamais un "closed" (deja fait), jamais un "suspicious" (a arbitrer a la main).
  const { data, error } = await sb
    .from("projects")
    .select("id, created_at, status, vertical")
    .lt("created_at", AVANT)
    .in("status", ["new", "routed", "unrouted"])
    .order("created_at", { ascending: true });
  if (error) { console.error("ERREUR lecture :", error.message); process.exit(1); }

  const cibles = data || [];
  console.log(`${cibles.length} projet(s) a fermer (deposes avant le ${AVANT.slice(0, 10)})\n`);
  cibles.forEach((p: { id: number; created_at: string; status: string; vertical: string }) =>
    console.log(`  #${String(p.id).padStart(3)}  ${p.created_at.slice(0, 10)}  ${p.status}  ${p.vertical}`));

  if (!APPLIQUER) {
    console.log("\n(simulation — relancer avec --appliquer pour ecrire)");
    return;
  }
  if (cibles.length === 0) { console.log("\nrien a faire."); return; }

  const ids = cibles.map((p: { id: number }) => p.id);
  // count:"exact" + lecture de l'erreur : un UPDATE qui echoue renvoie { error }
  // SILENCIEUSEMENT (lecon du 08/08). On ne conclut jamais sur le nombre envoye.
  const { error: errUp, count } = await sb
    .from("projects")
    .update({ status: "closed" }, { count: "exact" })
    .in("id", ids);
  if (errUp) { console.error("\nERREUR ecriture :", errUp.message); process.exit(1); }
  console.log(`\n${count} ligne(s) mise(s) a jour.`);

  // VERIFICATION EN BASE, pas sur le retour du script.
  const { data: restants } = await sb
    .from("projects").select("id")
    .lt("created_at", AVANT).in("status", ["new", "routed", "unrouted"]);
  console.log(`verification : ${(restants || []).length} projet(s) encore ouvert(s) avant cette date.`);
  if ((restants || []).length > 0) { console.error("INCOMPLET"); process.exit(1); }
})();
