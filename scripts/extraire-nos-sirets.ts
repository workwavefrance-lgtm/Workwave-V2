/**
 * Ecrit la liste de NOS SIRET dans un fichier, une fois pour toutes.
 *
 * POURQUOI UN FICHIER. La premiere version de l'enrichissement Sirene relisait
 * les 2,5 millions de SIRET depuis la base a CHAQUE lancement : une heure
 * perdue avant meme d'ouvrir le fichier de l'INSEE, et repayee a chaque
 * relance. Ces SIRET ne changent pas d'une minute a l'autre.
 *
 * POURQUOI UN CURSEUR ET PAS UN DECALAGE. La version precedente paginait avec
 * `.range(offset, offset+999)` SANS tri. Sur 2 561 requetes etalees sur une
 * heure, Postgres ne garantit aucun ordre stable : la fenetre glisse et
 * reserve des lignes deja vues. Symptome mesure : plus de 2,4 millions de
 * lignes lues pour 1 622 741 SIRET distincts. On avance donc par
 * `id > dernier_vu`, qui utilise l'index et ne peut ni sauter ni repeter.
 *
 * Usage : npx tsx scripts/extraire-nos-sirets.ts [fichier de sortie]
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SORTIE = process.argv[2] || "/tmp/sirene/nos-sirets.txt";
const PAGE = 1000;

(async () => {
  const flux = fs.createWriteStream(SORTIE, { encoding: "utf8" });
  const distincts = new Set<string>();
  let dernierId = 0;
  let lignes = 0;

  console.log("Extraction des SIRET, par curseur sur l'identifiant...");
  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select("id, siret")
      .not("siret", "is", null)
      .eq("is_active", true)
      .is("deleted_at", null)
      .gt("id", dernierId)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (error) {
      console.error("ERREUR:", error.message);
      process.exit(1);
    }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      lignes++;
      if (r.siret && !distincts.has(r.siret)) {
        distincts.add(r.siret);
        flux.write(r.siret + "\n");
      }
    }
    dernierId = rows[rows.length - 1].id;
    if (lignes % 200000 < PAGE) {
      console.log(`   ${lignes.toLocaleString("fr-FR")} fiches lues, ${distincts.size.toLocaleString("fr-FR")} SIRET distincts`);
    }
  }
  await new Promise((r) => flux.end(r));

  const doublons = lignes - distincts.size;
  console.log(`\nfiches lues        : ${lignes.toLocaleString("fr-FR")}`);
  console.log(`SIRET distincts    : ${distincts.size.toLocaleString("fr-FR")}`);
  console.log(`fiches en doublon  : ${doublons.toLocaleString("fr-FR")}${doublons > 0 ? "  <-- meme SIRET sur plusieurs fiches" : ""}`);
  console.log(`\necrit : ${SORTIE}`);
})();
