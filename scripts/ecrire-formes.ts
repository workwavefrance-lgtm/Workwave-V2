/**
 * Etape 2 sur 2 : ecrit les formes juridiques, depuis /tmp/sirene/ids-formes.csv.
 *
 * Processus COURT et REPRENABLE : il note sa progression dans un fichier, donc
 * une interruption ne fait pas repartir de zero. Ecriture par identifiant
 * (cle primaire), sans comptage exact : le comptage sur 2,4 millions de lignes
 * etait la premiere cause d'echec, la recherche par SIRET non indexe la seconde.
 *
 * Usage : npx tsx scripts/ecrire-formes.ts [--appliquer]
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import readline from "readline";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const APPLIQUER = process.argv.includes("--appliquer");
const REPRISE = "/tmp/sirene/reprise.txt";
const LOT = 400;

(async () => {
  const depuis = fs.existsSync(REPRISE) ? Number(fs.readFileSync(REPRISE, "utf8").trim()) || 0 : 0;
  if (depuis) console.log(`reprise a la ligne ${depuis.toLocaleString("fr-FR")}\n`);

  const rl = readline.createInterface({
    input: fs.createReadStream("/tmp/sirene/ids-formes.csv", { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  // On regroupe par forme AU FIL DE L'EAU : un paquet part des qu'il est plein,
  // donc la memoire reste bornee quel que soit le volume.
  const paquets = new Map<string, number[]>();
  let ligne = 0, ecrites = 0, premiere = true;

  const vider = async (forme: string) => {
    const ids = paquets.get(forme);
    if (!ids || ids.length === 0) return;
    if (APPLIQUER) {
      const { error } = await sb.from("pros").update({ forme_juridique: forme }).in("id", ids);
      if (error) { console.error(`ERREUR ligne ~${ligne} :`, error.message); process.exit(1); }
    }
    ecrites += ids.length;
    paquets.set(forme, []);
    if (ecrites % 50000 < LOT) {
      console.log(`   ${ecrites.toLocaleString("fr-FR")} ecrites`);
      fs.writeFileSync(REPRISE, String(ligne));
    }
  };

  for await (const l of rl) {
    if (premiere) { premiere = false; continue; }
    ligne++;
    if (ligne <= depuis) continue;
    const i = l.indexOf(",");
    if (i <= 0) continue;
    const id = Number(l.slice(0, i));
    const forme = l.slice(i + 1).trim();
    if (!id || !forme) continue;
    const arr = paquets.get(forme) || [];
    arr.push(id);
    paquets.set(forme, arr);
    if (arr.length >= LOT) await vider(forme);
  }
  for (const f of paquets.keys()) await vider(f);
  fs.writeFileSync(REPRISE, String(ligne));

  console.log(`\n${APPLIQUER ? "ecrites" : "seraient ecrites"} : ${ecrites.toLocaleString("fr-FR")} fiches`);
  if (!APPLIQUER) console.log("SIMULATION. Relancer avec --appliquer.");
})();
