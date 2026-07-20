/**
 * DÉTECTION DES CONVERSATIONS À RISQUE — test.
 *
 * C'est la pièce qui décide de ce que Willy VERRA. Un faux négatif ici, et un
 * dérapage passe inaperçu sans que personne ne s'en doute — le journal donnera
 * même une fausse impression de sécurité (« rien à relire » alors qu'il y avait
 * quelque chose). D'où un test qui insiste sur les formulations réelles :
 * fautes de frappe, accents manquants, familier.
 *
 * Fonction pure : ni base, ni réseau, ni IA. Instantané.
 *
 *   npx tsx scripts/_test-lea-journal.ts
 */
import { detecterFlags, type LeaFlag } from "../lib/support/lea-journal";

let ko = 0;

function attendu(nom: string, params: Parameters<typeof detecterFlags>[0], flags: LeaFlag[]) {
  // tirage forcé à 1 : jamais d'échantillon aléatoire, le test reste déterministe.
  const obtenu = detecterFlags({ ...params, tirage: 1 });
  const manquants = flags.filter((f) => !obtenu.includes(f));
  const ok = manquants.length === 0;
  if (!ok) ko++;
  console.log(`  ${ok ? "✅" : "❌"} ${nom}`);
  console.log(`     attendu ${JSON.stringify(flags)} · obtenu ${JSON.stringify(obtenu)}`);
}

function aucun(nom: string, message: string) {
  const obtenu = detecterFlags({
    messagesVisiteur: [message],
    reponseLea: "Bien sûr, voici comment faire.",
    tirage: 1,
  });
  const ok = obtenu.length === 0;
  if (!ok) ko++;
  console.log(`  ${ok ? "✅" : "❌"} ${nom}`);
  console.log(`     attendu aucun motif · obtenu ${JSON.stringify(obtenu)}`);
}

console.log("\n=== DOIT ÊTRE DÉTECTÉ ===\n");

attendu("menace CNIL", { messagesVisiteur: ["Je saisis la CNIL"], reponseLea: "ok" }, ["juridique"]);
attendu("avocat", { messagesVisiteur: ["mon avocat va vous contacter"], reponseLea: "ok" }, ["juridique"]);
attendu("sans accent ni majuscule", { messagesVisiteur: ["je vais porter plainte"], reponseLea: "ok" }, ["juridique"]);
attendu("mise en demeure", { messagesVisiteur: ["ceci vaut mise en demeure"], reponseLea: "ok" }, ["juridique"]);
attendu("remboursement", { messagesVisiteur: ["remboursez moi mes 9,90"], reponseLea: "ok" }, ["remboursement"]);
attendu("accusation d'arnaque", { messagesVisiteur: ["votre site est une arnaque"], reponseLea: "ok" }, ["remboursement"]);
attendu("c'est du vol", { messagesVisiteur: ["c'est du vol votre truc"], reponseLea: "ok" }, ["remboursement"]);
attendu("colère (scandale)", { messagesVisiteur: ["c'est scandaleux"], reponseLea: "ok" }, ["colere"]);
attendu("insulte", { messagesVisiteur: ["bande de connards"], reponseLea: "ok" }, ["colere"]);
attendu("insulte au pluriel", { messagesVisiteur: ["bande de connasses"], reponseLea: "ok" }, ["colere"]);
attendu("escroc", { messagesVisiteur: ["vous etes des escrocs"], reponseLea: "ok" }, ["colere"]);
attendu("menace de nuire", { messagesVisiteur: ["je vais vous pourrir sur les avis google"], reponseLea: "ok" }, ["colere"]);
attendu(
  "demande le numéro du dirigeant",
  { messagesVisiteur: ["donnez moi le numero du dirigeant"], reponseLea: "ok" },
  ["donnees"]
);
attendu(
  "demande les coordonnées d'un artisan",
  { messagesVisiteur: ["je veux les coordonnees de cet artisan"], reponseLea: "ok" },
  ["donnees"]
);
attendu(
  "Léa a refusé",
  { messagesVisiteur: ["une question"], reponseLea: "Je ne peux pas vous communiquer cette information." },
  ["refus"]
);
attendu(
  "Léa n'a pas accès",
  { messagesVisiteur: ["ou en est mon dossier"], reponseLea: "Je n'ai pas accès aux dossiers clients." },
  ["refus"]
);
attendu(
  "escalade",
  { messagesVisiteur: ["aidez moi"], reponseLea: "C'est transmis.", escalade: true },
  ["escalade"]
);
attendu(
  "cumul de plusieurs motifs",
  {
    messagesVisiteur: ["c'est du vol, je saisis la CNIL et mon avocat, bande d'escrocs"],
    reponseLea: "Je ne peux pas vous rembourser.",
  },
  ["juridique", "remboursement", "colere", "refus"]
);

console.log("\n=== NE DOIT PAS ÊTRE DÉTECTÉ (sinon le journal se noie) ===\n");

aucun("recherche d'artisan", "bonjour je cherche un plombier a poitiers");
aucun("question tarif", "c'est un abonnement votre truc ?");
aucun("code non reçu", "je n'ai pas recu le code de verification");
aucun("aucun projet", "je ne recois aucun projet depuis un mois");
aucun("simple bonjour", "bonjour");
aucun("mot 'vol' dans un contexte anodin", "je cherche un artisan pour poser un volet roulant");

console.log("\n=== ÉCHANTILLON ALÉATOIRE ===\n");
{
  const dans = detecterFlags({
    messagesVisiteur: ["bonjour je cherche un plombier"],
    reponseLea: "Bien sûr",
    tirage: 0.01,
  });
  const dehors = detecterFlags({
    messagesVisiteur: ["bonjour je cherche un plombier"],
    reponseLea: "Bien sûr",
    tirage: 0.5,
  });
  const ok = dans.includes("echantillon") && dehors.length === 0;
  if (!ok) ko++;
  console.log(`  ${ok ? "✅" : "❌"} 3 % des conversations ordinaires sont conservées`);
  console.log(`     tirage 0.01 -> ${JSON.stringify(dans)} · tirage 0.5 -> ${JSON.stringify(dehors)}`);

  // Un incident ne doit JAMAIS être étiqueté "échantillon" : sinon il se
  // retrouve noyé dans l'onglet le moins regardé.
  const incident = detecterFlags({
    messagesVisiteur: ["je saisis la CNIL"],
    reponseLea: "ok",
    tirage: 0.001,
  });
  const ok2 = !incident.includes("echantillon") && incident.includes("juridique");
  if (!ok2) ko++;
  console.log(`  ${ok2 ? "✅" : "❌"} un incident n'est jamais classé en simple échantillon`);
  console.log(`     ${JSON.stringify(incident)}`);
}

console.log("\n=== BILAN ===");
console.log(ko === 0 ? "  tout est vert" : `  ${ko} échec(s)`);
if (ko > 0) process.exit(1);
