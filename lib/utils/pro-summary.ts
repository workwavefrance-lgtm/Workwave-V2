/**
 * Construit une phrase courte "Pourquoi choisir [nom]" pour les cards
 * de la page listing "Top X meilleurs [metier] a [ville]".
 *
 * Strategie hierarchique (du plus riche au plus generique) :
 *   A. Description Apify/Google >= 80 chars → premiere phrase nettoyee
 *   B. Sinon, construction dynamique depuis :
 *        - certifications (ex: "certifie RGE et Qualibat")
 *        - rge_certified (officiel ADEME)
 *        - founded_year (anciennete)
 *        - claimed (fiche geree par le pro)
 *        - has_decennale / has_rc_pro
 *   C. Fallback ultime : juste "[metier] à [ville]"
 *
 * On evite TOUT appel LLM en live : heuristique pure, instantanee,
 * gratuite. Cf. plan 24/05/2026 — l'enrichissement IA en batch sera
 * un sprint distinct si necessaire (6 pros sur 226k ont une description
 * actuellement, donc les cas A sont rares).
 */
// ProCardData = niveau "card" (egress reduit, cf. lib/queries/pros.ts).
// ProWithRelations (fiche) reste structurellement assignable.
import type { ProCardData } from "@/lib/types/database";

const MAX_SUMMARY_LENGTH = 180;

/**
 * Extrait la premiere phrase d'un texte (jusqu'au premier ".", "!",
 * "?" ou saut de ligne). Trim, nettoie les espaces multiples.
 * Retourne null si rien d'utilisable (< 30 chars).
 */
function extractFirstSentence(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 30) return null;

  // Coupe au premier delim + espace OU fin de ligne
  const match = cleaned.match(/^(.{30,}?[.!?])(\s|$)/);
  let first = match ? match[1] : cleaned;

  // Si la 1ere phrase est trop longue, tronque a MAX_SUMMARY_LENGTH au
  // dernier espace
  if (first.length > MAX_SUMMARY_LENGTH) {
    const truncated = first.slice(0, MAX_SUMMARY_LENGTH);
    const lastSpace = truncated.lastIndexOf(" ");
    first = (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated) + "…";
  }

  return first;
}

/**
 * Liste lisible des certifications d'un pro.
 * Ex : ["RGE", "Qualibat", "QualiPAC"] -> "RGE, Qualibat et QualiPAC"
 */
function formatCertifications(certs: string[]): string | null {
  if (!certs || certs.length === 0) return null;
  if (certs.length === 1) return certs[0];
  if (certs.length === 2) return `${certs[0]} et ${certs[1]}`;
  return `${certs.slice(0, -1).join(", ")} et ${certs[certs.length - 1]}`;
}

/**
 * Construit un fallback depuis les signaux structures.
 * Renvoie toujours une chaine non vide.
 */
function buildStructuredFallback(pro: ProCardData): string {
  const parts: string[] = [];
  const categoryName = (pro.category?.name ?? "Professionnel").toLowerCase();
  const cityName = pro.city?.name ?? null;
  const base = cityName ? `${capitalize(categoryName)} à ${cityName}` : capitalize(categoryName);

  // Anciennete (Sirene)
  const currentYear = new Date().getFullYear();
  const foundedYear = pro.founded_year ?? null;
  let ancientete: string | null = null;
  if (foundedYear && foundedYear > 1900 && foundedYear <= currentYear) {
    const years = currentYear - foundedYear;
    if (years >= 2) {
      ancientete = `depuis ${years} ans`;
    } else if (years === 1) {
      ancientete = "depuis 1 an";
    } else {
      ancientete = "récemment installé";
    }
  }

  // Certifications
  const certs = pro.certifications ?? [];
  const certsLabel = formatCertifications(certs);

  // Construction par paliers : on assemble selon ce qu'on a
  if (certsLabel && ancientete) {
    return `${base} ${ancientete}, certifié ${certsLabel}.`;
  }
  if (certsLabel) {
    return `${base}, certifié ${certsLabel}.`;
  }
  if (ancientete) {
    parts.push(`${base} ${ancientete}`);
  } else {
    parts.push(base);
  }

  // Assurances (signal de pro serieux)
  const assurances: string[] = [];
  if (pro.has_decennale) assurances.push("garantie décennale");
  if (pro.has_rc_pro) assurances.push("RC Pro");
  if (assurances.length > 0) {
    parts.push(`(${assurances.join(", ")})`);
  }

  // RGE officiel ADEME
  if (pro.rge_certified) {
    parts.push("— RGE certifié ADEME");
  }

  return parts.join(" ") + ".";
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Point d'entree principal.
 */
export function buildProSummary(pro: ProCardData): string {
  // A. Description riche -> premiere phrase
  if (pro.description && pro.description.length >= 80) {
    const extracted = extractFirstSentence(pro.description);
    if (extracted) return extracted;
  }

  // B/C. Fallback structure
  return buildStructuredFallback(pro);
}

/**
 * Petit helper pour les badges visuels en card. Renvoie 1-3 badges
 * texte courts selon les certifications/labels du pro.
 *
 * Priorite d'affichage (top-down) :
 *   1. Avis Workwave (★ X.X (N avis Workwave)) — preuve la plus forte
 *   2. Avis Google (★ X.X (N avis)) — alternative si pas Workwave
 *   3. RGE certifié — signal de qualite
 *   4. Profil vérifié — claimed
 *   5. Certif notable
 *   6. Anciennete (10+ ans)
 *
 * Max 3 badges pour rester lisible.
 */
export function buildProBadges(pro: ProCardData): string[] {
  const badges: string[] = [];

  // Avis Workwave (verifies, le plus fort)
  if (
    pro.workwave_reviews_count > 0 &&
    pro.workwave_reviews_avg !== null
  ) {
    badges.push(
      `★ ${pro.workwave_reviews_avg.toFixed(1)} (${pro.workwave_reviews_count} avis Workwave)`
    );
  }

  // Avis Google (importes)
  if (
    pro.google_rating &&
    pro.google_rating >= 4.0 &&
    (pro.google_reviews_count ?? 0) >= 3
  ) {
    badges.push(`★ ${pro.google_rating} (${pro.google_reviews_count} avis Google)`);
  }

  if (pro.rge_certified) badges.push("RGE certifié");
  if (pro.claimed_by_user_id && badges.length < 3) badges.push("Profil vérifié");

  // 1 certif notable si pas deja affichee
  const certs = pro.certifications ?? [];
  if (certs.length > 0 && !pro.rge_certified && badges.length < 3) {
    badges.push(certs[0]);
  }

  // Anciennete tres remarquable (10+ ans)
  const foundedYear = pro.founded_year ?? null;
  if (
    foundedYear &&
    new Date().getFullYear() - foundedYear >= 10 &&
    badges.length < 3
  ) {
    badges.push(`${new Date().getFullYear() - foundedYear} ans d'expérience`);
  }

  return badges.slice(0, 3);
}
