/**
 * Personnalisation freelance Workwave AI (Phase 12) :
 *   - palette de 8 couleurs predefinies (cool/fun mais cohérent Pixel Rise)
 *   - helpers pour avatar (initiales sur gradient) et theme (accent couleur)
 *   - badges calcules a la volee (pas de table dediee)
 *
 * Tous les composants UI doivent utiliser ces helpers pour rester coherent :
 *   - getAvatarStyle(color) -> CSS pour le cercle d'initiales
 *   - getThemeColor(color) -> hex pour CSS variable --theme-accent
 *   - getInitials(name) -> "WG" pour "Willy Gauvrit"
 *   - getBadges(pro, stats) -> liste de badges actifs
 */

export type PersonaColor =
  | "orange"
  | "blue"
  | "purple"
  | "green"
  | "pink"
  | "red"
  | "yellow"
  | "cyan";

export const PERSONA_COLORS: PersonaColor[] = [
  "orange",
  "blue",
  "purple",
  "green",
  "pink",
  "red",
  "yellow",
  "cyan",
];

export const COLOR_HEX: Record<PersonaColor, string> = {
  orange: "#FF6803",
  blue: "#2563EB",
  purple: "#7C3AED",
  green: "#16A34A",
  pink: "#EC4899",
  red: "#DC2626",
  yellow: "#EAB308",
  cyan: "#06B6D4",
};

export const COLOR_LABEL: Record<PersonaColor, string> = {
  orange: "Orange",
  blue: "Bleu",
  purple: "Violet",
  green: "Vert",
  pink: "Rose",
  red: "Rouge",
  yellow: "Jaune",
  cyan: "Cyan",
};

/**
 * Gradient stop secondaire (plus fonce 20%). Sert pour le gradient avatar.
 * On retourne la couleur "hover" qui se marie bien avec le hex principal.
 */
export const COLOR_HEX_DARKER: Record<PersonaColor, string> = {
  orange: "#E55A00",
  blue: "#1E40AF",
  purple: "#5B21B6",
  green: "#15803D",
  pink: "#BE185D",
  red: "#991B1B",
  yellow: "#A16207",
  cyan: "#0E7490",
};

/**
 * Couleur safe par defaut (si pro.avatar_color/theme_color est NULL).
 */
export const DEFAULT_COLOR: PersonaColor = "orange";

/**
 * Normalise un input string vers un PersonaColor. Si invalide → DEFAULT_COLOR.
 */
export function normalizeColor(input: string | null | undefined): PersonaColor {
  if (!input) return DEFAULT_COLOR;
  const lc = input.toLowerCase() as PersonaColor;
  return PERSONA_COLORS.includes(lc) ? lc : DEFAULT_COLOR;
}

/**
 * Genere le style CSS pour un cercle d'avatar avec gradient.
 * Utiliser via : <div style={getAvatarStyle("blue")} />
 */
export function getAvatarStyle(
  color: PersonaColor | string | null | undefined
): React.CSSProperties {
  const c = normalizeColor(color);
  const main = COLOR_HEX[c];
  const dark = COLOR_HEX_DARKER[c];
  return {
    background: `linear-gradient(135deg, ${main} 0%, ${dark} 100%)`,
    color: "white",
  };
}

/**
 * Hex de la couleur d'accent (theme_color). Utilise pour fiche publique.
 */
export function getThemeColor(
  color: PersonaColor | string | null | undefined
): string {
  return COLOR_HEX[normalizeColor(color)];
}

/**
 * Hex de la couleur d'accent hover (plus fonce 20%).
 */
export function getThemeColorHover(
  color: PersonaColor | string | null | undefined
): string {
  return COLOR_HEX_DARKER[normalizeColor(color)];
}

/**
 * Extrait les initiales d'un nom (1-2 lettres maxi).
 * "Willy Gauvrit" -> "WG"
 * "Jean-Pierre Martin" -> "JM"
 * "AMD"  -> "A"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned
    .split(/\s+/)
    .filter((p) => p.length > 0 && /[a-zA-ZÀ-ſ]/.test(p[0]));
  if (parts.length === 0) return cleaned[0].toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────
// BADGES — calcules a la volee depuis le pro + stats
// ─────────────────────────────────────────────────────────────────────

export type BadgeKind =
  | "profile_complete"
  | "premium_active"
  | "premium_3months"
  | "claimed"
  | "github_linked"
  | "linkedin_linked"
  | "top_responder"
  | "early_member"
  | "remote_friendly";

export type Badge = {
  kind: BadgeKind;
  label: string;
  emoji: string;
  description: string;
};

export type BadgeStats = {
  leadsContacted?: number;
  monthsSinceSubscription?: number;
  monthsSinceClaim?: number;
};

/**
 * Liste de tous les badges possibles avec leur metadata d'affichage.
 */
export const BADGE_CATALOG: Record<BadgeKind, Omit<Badge, "kind">> = {
  profile_complete: {
    emoji: "✨",
    label: "Profil complet",
    description: "Tous les champs du profil sont remplis.",
  },
  premium_active: {
    emoji: "★",
    label: "Premium actif",
    description: "Abonnement Premium en cours, peut repondre aux projets.",
  },
  premium_3months: {
    emoji: "🏆",
    label: "Premium 3+ mois",
    description: "Membre Premium fidele depuis plus de 3 mois.",
  },
  claimed: {
    emoji: "✓",
    label: "Fiche verifiee",
    description: "Profil reclame et email verifie.",
  },
  github_linked: {
    emoji: "</>",
    label: "GitHub connecte",
    description: "Profil GitHub link sur la fiche.",
  },
  linkedin_linked: {
    emoji: "in",
    label: "LinkedIn connecte",
    description: "Profil LinkedIn link sur la fiche.",
  },
  top_responder: {
    emoji: "⚡",
    label: "Top responder",
    description: "A contacte plus de 10 clients via Workwave.",
  },
  early_member: {
    emoji: "🚀",
    label: "Membre des debuts",
    description: "Membre Workwave AI depuis plus de 6 mois.",
  },
  remote_friendly: {
    emoji: "🌍",
    label: "Remote OK",
    description: "Disponible en 100% remote.",
  },
};

/**
 * Calcule la liste des badges actifs pour un pro donne.
 *
 * Entree typee laxiste pour eviter de cascader les types Supabase ici.
 * Tous les champs sont optionnels. Le helper ignore les missing fields.
 */
export function getBadges(
  pro: {
    name?: string | null;
    description?: string | null;
    skills?: string | null;
    github_username?: string | null;
    linkedin?: string | null;
    years_experience?: number | null;
    hourly_rate?: number | null;
    claimed_by_user_id?: string | null;
    claimed_at?: string | null;
    subscription_product?: string | null;
    subscription_status?: string | null;
    available_for_remote?: boolean | null;
    created_at?: string | null;
  },
  stats?: BadgeStats
): Badge[] {
  const out: Badge[] = [];
  const add = (kind: BadgeKind) =>
    out.push({ kind, ...BADGE_CATALOG[kind] });

  // claimed
  if (pro.claimed_by_user_id) add("claimed");

  // Premium AI actif
  const isPremium =
    pro.subscription_product === "ai" &&
    (pro.subscription_status === "active" ||
      pro.subscription_status === "trialing");
  if (isPremium) add("premium_active");

  // Premium 3+ mois (utilise stats.monthsSinceSubscription si fourni)
  if (
    isPremium &&
    stats?.monthsSinceSubscription != null &&
    stats.monthsSinceSubscription >= 3
  ) {
    add("premium_3months");
  }

  // Profil complet (bio + skills + github OR linkedin + xp + tjm)
  const hasBio = !!pro.description && pro.description.length >= 80;
  const hasSkills = !!pro.skills && pro.skills.length >= 10;
  const hasSocial = !!pro.github_username || !!pro.linkedin;
  const hasXp = pro.years_experience != null;
  const hasRate = pro.hourly_rate != null;
  if (hasBio && hasSkills && hasSocial && hasXp && hasRate) {
    add("profile_complete");
  }

  // GitHub / LinkedIn separes (mini-badges)
  if (pro.github_username) add("github_linked");
  if (pro.linkedin) add("linkedin_linked");

  // Top responder (10+ leads contacted)
  if (stats?.leadsContacted != null && stats.leadsContacted >= 10) {
    add("top_responder");
  }

  // Early member (claim > 6 mois)
  if (
    stats?.monthsSinceClaim != null &&
    stats.monthsSinceClaim >= 6
  ) {
    add("early_member");
  }

  // Remote friendly
  if (pro.available_for_remote === true) add("remote_friendly");

  return out;
}

/**
 * Helper : convertit un timestamp ISO en nombre de mois depuis maintenant.
 * Retourne null si timestamp invalide.
 */
export function monthsSince(isoTimestamp: string | null | undefined): number | null {
  if (!isoTimestamp) return null;
  const then = new Date(isoTimestamp);
  if (isNaN(then.getTime())) return null;
  const now = new Date();
  const ms = now.getTime() - then.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.4));
}
