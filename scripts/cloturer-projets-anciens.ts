/**
 * Cloture les projets de plus d'un mois.
 *
 * Un projet « closed » disparait du fil que voient les pros
 * (lib/queries/available-projects.ts exclut deleted et closed) : un chantier
 * d'il y a deux mois n'a plus de sens a proposer, et il decredibilise le fil.
 *
 * Par defaut le script ne fait que MESURER. Il faut --appliquer pour ecrire.
 * Il verifie l'erreur de CHAQUE ecriture et recompte en base a la fin : un
 * `.update()` Supabase qui echoue renvoie { error } sans lever d'exception, et
 * un script qui compte les lignes ENVOYEES ment (lecon du 08/08).
 *
 * Usage :
 *   npx tsx scripts/cloturer-projets-anciens.ts            (mesure seule)
 *   npx tsx scripts/cloturer-projets-anciens.ts --appliquer
 *   npx tsx scripts/cloturer-projets-anciens.ts --jours 45 --appliquer
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const sb = getServiceClient();
const APPLIQUER = process.argv.includes("--appliquer");
const JOURS = (() => {
  const i = process.argv.indexOf("--jours");
  return i >= 0 ? Number(process.argv[i + 1]) : 30;
})();

(async () => {
  const seuil = new Date(Date.now() - JOURS * 86400e3).toISOString();
  console.log(`Seuil : projets crees avant le ${seuil.slice(0, 10)} (${JOURS} jours)\n`);

  const { data, error } = await sb
    .from("projects")
    .select("id, created_at, status, description, city_id, category_id")
    .lt("created_at", seuil)
    .order("created_at", { ascending: true });
  if (error) { console.log("LECTURE EN ECHEC :", error.message); process.exit(1); }

  const tous = data || [];
  const parStatut: Record<string, number> = {};
  for (const p of tous) parStatut[p.status || "(vide)"] = (parStatut[p.status || "(vide)"] || 0) + 1;
  console.log(`${tous.length} projets de plus de ${JOURS} jours, par statut :`);
  for (const [s, n] of Object.entries(parStatut).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${s}`);

  // On ne touche PAS aux projets deja clos ni supprimes.
  const aClore = tous.filter((p) => p.status !== "closed" && p.status !== "deleted");
  console.log(`\n${aClore.length} a cloturer (les statuts closed et deleted sont laisses tels quels)`);
  if (aClore.length) {
    const plusVieux = aClore[0], plusRecent = aClore[aClore.length - 1];
    console.log(`  du ${plusVieux.created_at.slice(0, 10)} au ${plusRecent.created_at.slice(0, 10)}`);
    console.log(`  exemples : ${aClore.slice(0, 3).map((p) => `#${p.id} (${p.created_at.slice(0, 10)}, ${p.status})`).join(", ")}`);
  }

  if (!APPLIQUER) { console.log("\nMESURE SEULE. Relancer avec --appliquer pour ecrire."); return; }
  if (!aClore.length) { console.log("\nRien a faire."); return; }

  console.log("\nEcriture en cours...");
  let ok = 0;
  const echecs: string[] = [];
  for (const p of aClore) {
    // Cible par identifiant exact, jamais par condition floue (lecon du 06/08).
    const { error: e } = await sb.from("projects").update({ status: "closed" }).eq("id", p.id);
    if (e) echecs.push(`#${p.id} : ${e.message}`); else ok++;
  }
  console.log(`  ${ok} mises a jour acceptees, ${echecs.length} en echec`);
  for (const m of echecs.slice(0, 5)) console.log(`    ${m}`);

  // Preuve : on RELIT la base, on ne se fie pas au compte des ecritures.
  const { data: reste, error: e2 } = await sb
    .from("projects").select("id, status").lt("created_at", seuil)
    .not("status", "in", "(closed,deleted)");
  if (e2) console.log(`  VERIFICATION IMPOSSIBLE : ${e2.message}`);
  else console.log(`  verification en base : ${(reste || []).length} projet(s) de plus de ${JOURS} jours encore ouvert(s)`);
})();
