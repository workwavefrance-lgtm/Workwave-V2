/**
 * Filtre du résumé public de projet. Lancer : npx tsx tests/safe-teaser.test.ts
 *
 * Le cas « Benoît Rigard » est réel : projet du 26/08/2026, mesuré le
 * 20/09/2026 sur la base de production. Il serait parti sur la home sans ce
 * filtre.
 */
import { safeTeaser } from "@/lib/utils/safe-teaser";

let passes = 0;
const echecs: string[] = [];

function verifie(intitule: string, obtenu: unknown, attendu: unknown) {
  if (JSON.stringify(obtenu) === JSON.stringify(attendu)) {
    passes++;
  } else {
    echecs.push(`${intitule}\n    attendu : ${JSON.stringify(attendu)}\n    obtenu  : ${JSON.stringify(obtenu)}`);
  }
}

const resume = (summary: string) => ({ summary });

// --- Cas qui doivent être ÉCARTÉS ---------------------------------------
verifie(
  "cas réel : le résumé nomme le déposant et l'artisan",
  safeTeaser(
    resume(
      "Un particulier, Benoît Rigard, souhaite faire réparer son toit par un couvreur nommé Julien Benayon, dans la ville de Saint-Loup, dans les meilleurs délais."
    ),
    "Benoît"
  ),
  ""
);
verifie(
  "nom introduit par « nommé », déposant inconnu",
  safeTeaser(resume("Le client cherche un couvreur nommé Julien Benayon."), null),
  ""
);
verifie("civilité M.", safeTeaser(resume("Le chantier de M. Duval à Poitiers."), null), "");
verifie("civilité Madame", safeTeaser(resume("Madame Leroy souhaite un devis."), null), "");
verifie("« s'appelle »", safeTeaser(resume("Le voisin s'appelle Martin et veut la même chose."), null), "");
verifie(
  "prénom du déposant cité, avec accent et casse différente",
  safeTeaser(resume("BENOIT souhaite refaire sa toiture."), "Benoît"),
  ""
);
verifie(
  "prénom du déposant en deuxième mot de first_name",
  safeTeaser(resume("Rigard souhaite refaire sa toiture."), "Benoît Rigard"),
  ""
);
verifie("email", safeTeaser(resume("Écrire à jean@exemple.fr pour le devis."), null), "");
verifie("téléphone", safeTeaser(resume("Rappeler au 06 12 34 56 78 avant midi."), null), "");
verifie("résumé vide", safeTeaser(resume("   "), null), "");
verifie("qualification absente", safeTeaser(null, null), "");
verifie("qualification sans résumé", safeTeaser({ keywords: ["toiture"] }, null), "");

// --- Cas qui doivent PASSER ---------------------------------------------
const piscine = "Pose d'un carrelage autour d'une piscine, réalisation souhaitée dans le mois.";
verifie("résumé propre", safeTeaser(resume(piscine), "Sophie"), piscine);
verifie(
  "prénom court (moins de 3 lettres) ignoré",
  safeTeaser(resume("Le client veut un devis de peinture."), "Li"),
  "Le client veut un devis de peinture."
);
verifie(
  "commune composée non confondue avec un nom",
  safeTeaser(resume("Vidage d'un appartement à Saint-Amand-Montrond, nettoyage inclus."), "Julie"),
  "Vidage d'un appartement à Saint-Amand-Montrond, nettoyage inclus."
);
verifie(
  "surface et dimensions non prises pour un téléphone",
  safeTeaser(resume("Cloisons en placo d'un appartement de 60 m², avec 2 portes à galandage."), "Marc"),
  "Cloisons en placo d'un appartement de 60 m², avec 2 portes à galandage."
);

// --- Troncature ----------------------------------------------------------
const long =
  "Le client souhaite faire maçonner sa cheminée, reprendre les bavettes et les solins, effectuer un suivi de sa couverture en ardoise ancienne et poser un velux.";
const tronque = safeTeaser(resume(long), "Anne");
verifie("troncature : longueur", tronque.length <= 140, true);
verifie("troncature : finit par une ellipse", tronque.endsWith("…"), true);
verifie("troncature : ne coupe pas un mot en deux", /\s…$|[\wÀ-ÿ)»]…$/.test(tronque), true);
verifie(
  "troncature : le mot coupé n'est pas un fragment",
  long.startsWith(tronque.slice(0, -1).trimEnd()),
  true
);
verifie("pile 140 caractères : pas de troncature", safeTeaser(resume("a".repeat(140)), null), "a".repeat(140));

// --- Résultat ------------------------------------------------------------
console.log(`\n${passes} vérifications passées, ${echecs.length} en échec`);
if (echecs.length > 0) {
  for (const e of echecs) console.error("  ✗ " + e);
  process.exit(1);
}
console.log("✓ filtre du résumé public : tout est vert");
