import type { ReactNode } from "react";

/**
 * SOURCE UNIQUE de la navigation admin (refonte 13/07).
 * Avant : 3 listes dupliquées à la main (sidebar, mobile, command-palette) déjà
 * désynchronisées (Enquête/Emails manquants sur mobile). Désormais tout lit ceci.
 *
 * `primary` = affiché dans la barre d'onglets mobile (5 max, pouce). Le reste va
 * dans la feuille « Plus ». Le sidebar desktop affiche tout, dans l'ordre.
 */
export type AdminNavItem = {
  key: string;
  label: string;
  href: string;
  exact?: boolean;
  primary?: boolean;
  icon: ReactNode;
};

const I = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    {d.split("|").map((p, i) => <path key={i} d={p} />)}
  </svg>
);

export const ADMIN_NAV: AdminNavItem[] = [
  { key: "home", label: "Accueil", href: "/admin", exact: true, primary: true,
    icon: I("M3 11l9-8 9 8|M5 10v10h14V10") },
  { key: "projects", label: "Projets", href: "/admin/projects", primary: true,
    icon: I("M4 4h16v16H4z|M8 9h8|M8 13h5") },
  { key: "pros", label: "Pros", href: "/admin/pros", primary: true,
    icon: I("M12 8a4 4 0 100-8 4 4 0 000 8z|M4 20c0-4 4-6 8-6s8 2 8 6") },
  { key: "finances", label: "Finance", href: "/admin/finances", primary: true,
    icon: I("M4 19V5|M8 19V9|M12 19V7|M16 19v-8|M20 19V4") },
  // ── secondaires (feuille « Plus » sur mobile) ──
  { key: "reviews", label: "Avis", href: "/admin/reviews",
    icon: I("M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 22l-5.2-2.9 1-5.8L3.5 9.2l5.9-.9z") },
  { key: "enquete", label: "Enquête", href: "/admin/enquete",
    icon: I("M9 5h6|M9 5a2 2 0 012-2h2a2 2 0 012 2|M5 5h14v16H5z|M9 12h6|M9 16h4") },
  { key: "leads", label: "Leads", href: "/admin/leads",
    icon: I("M4 6h16|M4 12h16|M4 18h10") },
  { key: "analytics", label: "Analytics", href: "/admin/analytics",
    icon: I("M4 20V4|M4 20h16|M8 16l3-4 3 2 4-6") },
  { key: "alerts", label: "Alertes", href: "/admin/alerts",
    icon: I("M12 3a6 6 0 00-6 6v3l-2 3h16l-2-3V9a6 6 0 00-6-6z|M10 20a2 2 0 004 0") },
  { key: "logs", label: "Logs", href: "/admin/logs",
    icon: I("M8 4h9l3 3v13H8z|M4 8v12h9|M11 11h6|M11 15h6") },
  { key: "settings", label: "Réglages", href: "/admin/settings",
    icon: I("M12 15a3 3 0 100-6 3 3 0 000 6z|M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2-1.2l-.3-2.5H10.7l-.3 2.5a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002 1.2l.3 2.5h2.6l.3-2.5a7 7 0 002-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z") },
];

export const ADMIN_NAV_PRIMARY = ADMIN_NAV.filter((i) => i.primary);
export const ADMIN_NAV_SECONDARY = ADMIN_NAV.filter((i) => !i.primary);

export function isNavActive(item: AdminNavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
