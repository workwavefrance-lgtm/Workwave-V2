/**
 * Filtre du résumé de projet affiché publiquement (home, cartes « projets
 * déposés récemment »).
 *
 * 🔴 20/09/2026 — le résumé produit par la qualification IA N'EST PAS anonyme,
 * contrairement à ce que `lib/queries/recent-projects.ts` affirmait. Mesuré sur
 * les 25 derniers projets publiables : un résumé nommait le déposant ET
 * l'artisan (« Un particulier, Benoît Rigard, souhaite faire réparer son toit
 * par un couvreur nommé Julien Benayon »). Le garde-fou d'origine ne bloquait
 * que l'email et les suites de chiffres, donc ce texte serait parti tel quel
 * sur la home, page indexée par Google.
 *
 * Fonction pure, sans dépendance : elle se teste seule
 * (`tests/safe-teaser.test.mjs`).
 */

/** Mots qui introduisent un nom de personne : « nommé X », « M. X »… */
const NOM_INTRODUIT =
  /(?:\bnomm[ée]{1,2}s?|\bappel[ée]{1,2}s?|\bpr[ée]nomm[ée]{1,2}s?|\bs'appelle|\bse nomme|\bM\.|\bMme\b|\bMlle\b|\bMonsieur\b|\bMadame\b)\s+[A-ZÀ-Ý]/;

/** Email, ou suite de chiffres de longueur téléphonique. */
const CONTACT = /\d[\d .]{7,}\d/;

/** Minuscules sans accents, ponctuation réduite à des espaces, bordée d'espaces. */
function normaliser(texte: string): string {
  return ` ${texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/**
 * Le résumé cite-t-il le prénom du déposant ? `first_name` peut contenir un
 * prénom seul ou « Prénom Nom » : chaque mot d'au moins 3 lettres est testé.
 * Un prénom qui est aussi un mot courant (Pierre, Rose) écarte le résumé à
 * tort : c'est voulu, le repli est la phrase générique, jamais une fuite.
 */
function citeLeDeposant(resume: string, firstName: string | null): boolean {
  const mots = normaliser(String(firstName ?? ""))
    .split(" ")
    .filter((m) => m.length >= 3);
  if (mots.length === 0) return false;
  const cible = normaliser(resume);
  return mots.some((m) => cible.includes(` ${m} `));
}

/**
 * Renvoie le résumé affichable, ou "" si quoi que ce soit dans le texte peut
 * identifier une personne. L'appelant retombe alors sur une phrase générique.
 *
 * ⚠️ `firstName` sert UNIQUEMENT à la comparaison, ici. Il ne doit jamais être
 * renvoyé ni ajouté à un objet exposé publiquement.
 */
export function safeTeaser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiQualification: any,
  firstName: string | null,
  maxLength = 140
): string {
  const s = String(aiQualification?.summary ?? "").trim();
  if (!s) return "";
  if (s.includes("@") || CONTACT.test(s)) return "";
  if (NOM_INTRODUIT.test(s)) return "";
  if (citeLeDeposant(s, firstName)) return "";
  if (s.length <= maxLength) return s;
  // Coupe sur le dernier espace pour ne jamais tronquer un mot en deux.
  const coupe = s.slice(0, maxLength - 3);
  const espace = coupe.lastIndexOf(" ");
  return (espace > 40 ? coupe.slice(0, espace) : coupe).trimEnd() + "…";
}
