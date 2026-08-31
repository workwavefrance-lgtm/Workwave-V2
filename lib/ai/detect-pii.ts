/**
 * Detection de PII (personal identifiable information) dans la description
 * d'un projet depose par un particulier.
 *
 * Objectif anti-bypass paywall : un particulier ne doit pas pouvoir mettre
 * son tel/email/site web dans la description pour bypasser le paywall BTP
 * (9,90€ pour debloquer les coordonnees). Si on detecte, on peut :
 *   1. Refuser le submit (mode strict).
 *   2. Masquer dans la version visible des pros non-unlocked (mode masquage).
 *   3. Flag admin pour review (mode soft).
 *
 * Strategie 90% : regex pour telephone FR + email + URL. Pas de detection
 * NLP de "nom + cordialement" car trop faux positifs.
 *
 * Patterns supportes :
 *   - Tel FR national : 06 12 34 56 78, 06.12.34.56.78, 06-12-34-56-78,
 *     0612345678. Premier chiffre 0[1-9], 9 chiffres suivants.
 *   - Tel FR international : +33 6 12 34 56 78, +33612345678 (avec ou sans
 *     espaces/points/tirets entre chaque paire).
 *   - Email RFC-light : x@y.z avec extensions courantes
 *   - URLs : http(s)://x.y et www.x.y, quelle que soit la casse. Plus la forme
 *     sans protocole //x.y, restreinte a une liste de TLD (cf. URL_TLDS).
 *     Un x.y nu reste volontairement NON detecte : ca bloquerait du texte
 *     metier comme "ardoise type schiste.Pose prevue en mars".
 */

// ─── Patterns ────────────────────────────────────────────────────────────

/**
 * Telephone FR national. Matche :
 *   06 12 34 56 78, 06.12.34.56.78, 06-12-34-56-78, 0612345678
 * Refuse les sequences > 10 chiffres pour eviter de matcher des SIRET.
 *
 * (?<!\d) : look-behind = pas de chiffre juste avant (anti SIRET)
 * 0[1-9]  : premier chiffre 0, second 1-9 (numero FR valide)
 * (?:[\s.\-]?\d{2}){4} : 4 paires de chiffres separees par espace/point/tiret
 * (?!\d)  : pas de chiffre apres (anti continuation longue)
 */
const PHONE_FR_NATIONAL =
  /(?<!\d)0[1-9](?:[\s.\-]?\d{2}){4}(?!\d)/g;

/**
 * Telephone FR international (+33 prefixe).
 * +33 6 12 34 56 78  /  +33612345678  /  0033 6 12 34 56 78
 */
const PHONE_FR_INTL =
  /(?:\+33|0033)[\s.\-]?[1-9](?:[\s.\-]?\d{2}){4}/g;

/**
 * Email RFC-light (suffisant pour 99% des cas legitimes).
 */
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/**
 * URLs explicites (http/https/www). Volontairement strict pour eviter les
 * faux positifs sur du texte metier.
 *
 * 31/08/2026 : ajout du drapeau `i`. Sans lui le filtre ne voyait que les
 * liens ecrits en minuscules : `HTTPS://site.fr` et `WWW.site.fr` passaient
 * au travers. Aucun risque de faux positif ajoute, un lien reste un lien
 * quelle que soit sa casse (verifie sur les 155 descriptions reelles en
 * base : 0 nouvelle detection, donc 0 depot legitime bloque en plus).
 */
const URL_EXPLICIT = /(?:https?:\/\/|www\.)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;

/**
 * Liste de TLD pour la forme SANS protocole `//site.com` uniquement.
 *
 * Pourquoi une liste fermee ici alors que URL_EXPLICIT accepte n'importe quel
 * TLD de 2+ lettres : sans le marqueur `http`/`www`, `//mot.Mot` ressemble a
 * du francais tape vite. Mesure du 31/08/2026 sur les 11 cas de test :
 * `//host.<2+ lettres>` bloque « refaire mur //plafond.Ensuite peinture »,
 * la liste fermee ne le bloque pas et attrape quand meme les 2 formes
 * d'attaque (`//monsite-pirate.com`, `//mon-chantier.fr/album`).
 *
 * L'arbitrage penche de ce cote parce que les deux erreurs n'ont pas le meme
 * prix : detectPii BLOQUE le depot cote `deposer-projet/actions.ts`, donc un
 * faux positif coute un lead perdu (la ressource rare : revenu externe 0 EUR
 * au 08/08/2026), alors qu'un TLD exotique manque ici reste inoffensif dans
 * le mail grace a l'echappement HTML pose le meme jour dans
 * `lib/email/broadcast-btp-project.ts`.
 *
 * A completer si un jour un vrai lien passe au travers, c'est sans danger.
 */
const URL_TLDS =
  "fr|com|net|org|be|ch|lu|eu|io|co|info|biz|shop|site|online|app|dev|me|tv|pro|immo|bzh|paris|store|xyz|ovh|page|link|wixsite";

/**
 * URL sans protocole : `//site.com`, `//mon-chantier.fr/album`.
 * Forme valide en HTML (« protocol-relative ») que le filtre historique
 * laissait passer alors qu'elle sert exactement au meme usage que http://.
 *
 * `(?<![:\w])` = le `//` doit ouvrir un mot :
 *   - `(?<!:)` evite de recompter le `//` de `https://evil.com`, deja capture
 *     par URL_EXPLICIT (sinon la meme URL apparaissait 2 fois dans foundUrls).
 *   - `(?<!\w)` laisse passer la prose metier collee a un mot ou un chiffre :
 *     « chantier 2//3 du mur », « cuisine//salle de bain ».
 *
 * Le chemin final `(?:\/[^\s]*)?` ne change RIEN a la decision de bloquer (il
 * est optionnel et vient apres le domaine) : il sert au masquage, pour que
 * cleanedText remplace `//site.fr/album` en entier et ne laisse pas traîner
 * un « [masque]/album » a l'ecran du pro non deverrouille.
 */
const URL_PROTOCOL_RELATIVE = new RegExp(
  `(?<![:\\w])\\/\\/[a-zA-Z0-9\\-]+(?:\\.[a-zA-Z0-9\\-]+)*\\.(?:${URL_TLDS})\\b(?:\\/[^\\s]*)?`,
  "gi"
);

// ─── Types ────────────────────────────────────────────────────────────────

export type PiiDetectionResult = {
  hasPii: boolean;
  foundPhones: string[];
  foundEmails: string[];
  foundUrls: string[];
  cleanedText: string; // PII remplacees par [...]
};

// ─── Fonction principale ─────────────────────────────────────────────────

/**
 * Detecte les PII dans un texte. Retourne :
 *   - hasPii : true si au moins une PII trouvee
 *   - found{Phones,Emails,Urls} : les valeurs trouvees (utile pour log/audit)
 *   - cleanedText : version masquee a afficher aux pros non-unlocked
 *
 * Le cleanedText remplace chaque match par "[masque]" :
 *   "Bonjour appelez moi au 06 12 34 56 78"
 *   -> "Bonjour appelez moi au [masque]"
 */
export function detectPii(text: string): PiiDetectionResult {
  if (!text || text.length === 0) {
    return {
      hasPii: false,
      foundPhones: [],
      foundEmails: [],
      foundUrls: [],
      cleanedText: text || "",
    };
  }

  const foundPhones: string[] = [];
  const foundEmails: string[] = [];
  const foundUrls: string[] = [];
  let cleaned = text;

  // Detecter telephones (national + international)
  const phoneMatches = [
    ...(text.match(PHONE_FR_NATIONAL) || []),
    ...(text.match(PHONE_FR_INTL) || []),
  ];
  for (const phone of phoneMatches) {
    foundPhones.push(phone);
  }

  // Detecter emails
  const emailMatches = text.match(EMAIL) || [];
  for (const email of emailMatches) {
    foundEmails.push(email);
  }

  // Detecter URLs : forme explicite (http/https/www) + forme sans protocole
  // (//site.com). Les deux ne se recouvrent pas : le look-behind `(?<!:)` de
  // URL_PROTOCOL_RELATIVE empeche de compter deux fois un `https://…`.
  const urlMatches = [
    ...(text.match(URL_EXPLICIT) || []),
    ...(text.match(URL_PROTOCOL_RELATIVE) || []),
  ];
  for (const url of urlMatches) {
    foundUrls.push(url);
  }

  // Remplacer (ordre : URLs d'abord, puis emails, puis tels pour eviter
  // de masquer un email partiellement quand il contient un chiffre)
  cleaned = cleaned.replace(URL_EXPLICIT, "[masque]");
  cleaned = cleaned.replace(URL_PROTOCOL_RELATIVE, "[masque]");
  cleaned = cleaned.replace(EMAIL, "[masque]");
  cleaned = cleaned.replace(PHONE_FR_INTL, "[masque]");
  cleaned = cleaned.replace(PHONE_FR_NATIONAL, "[masque]");

  return {
    hasPii: foundPhones.length + foundEmails.length + foundUrls.length > 0,
    foundPhones,
    foundEmails,
    foundUrls,
    cleanedText: cleaned,
  };
}

/**
 * Construit un message d'erreur user-friendly pour bloquer un submit
 * quand PII detectee. Pas trop accusatoire : on suggere la solution.
 */
export function formatPiiErrorMessage(result: PiiDetectionResult): string {
  if (!result.hasPii) return "";
  const items: string[] = [];
  if (result.foundPhones.length > 0) items.push("numero de telephone");
  if (result.foundEmails.length > 0) items.push("adresse email");
  if (result.foundUrls.length > 0) items.push("lien web");
  const what = items.join(", ");
  return `Merci de retirer ${what} de la description. Vos coordonnees seront automatiquement partagees aux freelances qui debloquent votre demande : pas besoin de les ecrire ici. (Les coordonnees dans la description rendent votre demande moins claire et risquent un blocage par notre IA anti-spam.)`;
}
