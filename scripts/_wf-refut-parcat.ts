import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const DEBUT = "2026-09-05T00:00:00+02:00";
const FIN   = "2026-09-06T00:00:00+02:00";

// Totaux "envoyes" lus dans rattrapage_denses.log (somme des lignes "Total X"
// sur les 22 blocs de departement presents dans le fichier).
const ENVOYES: Record<number, [string, number]> = {
  1:["Plombier",31208], 2:["Electricien",54432], 3:["Macon",63428], 4:["Peintre",45174],
  5:["Menuisier",41200], 6:["Carreleur",18993], 7:["Plaquiste",20257], 8:["Couvreur",15326],
  9:["Charpentier",5382], 10:["Facadier",4578], 11:["Serrurier",12220], 12:["Chauffagiste",20175],
  13:["Climaticien",20176], 14:["Terrassier",11399], 15:["Paysagiste",23895], 16:["Elagueur",6345],
  17:["Architecte",26022], 18:["Decorateur interieur",49799], 36:["Pisciniste",8314],
  37:["Vitrier",57394], 38:["Ramoneur",23147], 39:["Videosurveillance",57620],
  41:["Cuisiniste",35273], 199:["Ascensoriste",3736], 200:["Diagnostic immobilier",8481],
};

async function main() {
  console.log("cat_id | categorie                | envoyes (log) | inseres (base 05/09) | ecart");
  console.log("-------+--------------------------+---------------+----------------------+-------");
  let sumEnv = 0, sumIns = 0;
  for (const [idStr, [nom, env]] of Object.entries(ENVOYES)) {
    const id = Number(idStr);
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("category_id", id).gte("created_at", DEBUT).lt("created_at", FIN);
    if (error) { console.log(`${String(id).padStart(6)} | ${nom.padEnd(24)} | ERREUR ${error.message}`); continue; }
    if (count === null) { console.log(`${String(id).padStart(6)} | ${nom.padEnd(24)} | count NULL = ERREUR`); continue; }
    sumEnv += env; sumIns += count;
    const flag = count === 0 && env > 0 ? "  <<< ZERO INSERTION" : "";
    console.log(`${String(id).padStart(6)} | ${nom.padEnd(24)} | ${String(env).padStart(13)} | ${String(count).padStart(20)} | ${String(env-count).padStart(6)}${flag}`);
  }
  console.log("-------+--------------------------+---------------+----------------------+-------");
  console.log(`       | SOMME                    | ${String(sumEnv).padStart(13)} | ${String(sumIns).padStart(20)} | ${String(sumEnv-sumIns).padStart(6)}`);
}
main();
