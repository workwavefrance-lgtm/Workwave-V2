/**
 * Etape 1 sur 2 : produit un fichier identifiant,forme.
 *
 * POURQUOI DEUX PROCESSUS. Le script d'un seul tenant lisait 2,44 millions de
 * fiches (20 minutes), gardait tout en memoire, puis ecrivait. Il echouait
 * systematiquement des la premiere ecriture ("statement timeout") alors que la
 * MEME ecriture, testee isolement, passe en 250 ms pour 500 lignes. On separe
 * donc la lecture de l'ecriture : chaque processus est court, et le travail
 * devient reprenable si quelque chose s'arrete.
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import readline from "readline";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

(async () => {
  console.log("1. Lecture du fichier extrait de l'INSEE...");
  const forme = new Map<string, string>();
  const rl = readline.createInterface({
    input: fs.createReadStream("/tmp/sirene/formes.csv", { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let premiere = true;
  for await (const l of rl) {
    if (premiere) { premiere = false; continue; }
    const i = l.indexOf(",");
    if (i > 0) forme.set(l.slice(0, i), l.slice(i + 1).trim());
  }
  console.log(`   ${forme.size.toLocaleString("fr-FR")} SIRET avec une forme juridique\n`);

  console.log("2. Correspondance avec nos identifiants...");
  const out = fs.createWriteStream("/tmp/sirene/ids-formes.csv", { encoding: "utf8" });
  out.write("id,forme\n");
  let dernier = 0, lues = 0, ecrites = 0;
  while (true) {
    const { data, error } = await sb.from("pros").select("id, siret")
      .eq("is_active", true).is("deleted_at", null).not("siret", "is", null)
      .gt("id", dernier).order("id", { ascending: true }).limit(1000);
    if (error) { console.error("   ERREUR de lecture :", error.message); process.exit(1); }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      lues++;
      const f = forme.get(r.siret!);
      if (f) { out.write(`${r.id},${f}\n`); ecrites++; }
    }
    dernier = rows[rows.length - 1].id;
    if (lues % 500000 < 1000) console.log(`   ${lues.toLocaleString("fr-FR")} fiches lues, ${ecrites.toLocaleString("fr-FR")} appariees`);
  }
  await new Promise((r) => out.end(r));
  console.log(`\ntermine : ${ecrites.toLocaleString("fr-FR")} fiches appariees sur ${lues.toLocaleString("fr-FR")}`);
  console.log("ecrit : /tmp/sirene/ids-formes.csv");
})();
