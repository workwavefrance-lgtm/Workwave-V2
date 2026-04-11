export type CommandItem = {
  id: string;
  label: string;
  href?: string;
  shortcut?: string;
  icon?: string; // "nav" | "action" | "search"
  group: string;
};

export const STATIC_COMMANDS: CommandItem[] = [
  // Navigation
  { id: "nav-overview", label: "Overview", href: "/admin", group: "Navigation", icon: "nav" },
  { id: "nav-pros", label: "Professionnels", href: "/admin/pros", group: "Navigation", icon: "nav" },
  { id: "nav-projects", label: "Projets", href: "/admin/projects", group: "Navigation", icon: "nav" },
  { id: "nav-leads", label: "Leads", href: "/admin/leads", group: "Navigation", icon: "nav" },
  { id: "nav-finances", label: "Finances", href: "/admin/finances", group: "Navigation", icon: "nav" },
  { id: "nav-analytics", label: "Analytics", href: "/admin/analytics", group: "Navigation", icon: "nav" },
  { id: "nav-alerts", label: "Alertes", href: "/admin/alerts", group: "Navigation", icon: "nav" },
  { id: "nav-logs", label: "Logs", href: "/admin/logs", group: "Navigation", icon: "nav" },
  { id: "nav-settings", label: "Settings", href: "/admin/settings", group: "Navigation", icon: "nav" },
  // Actions
  { id: "action-stripe", label: "Ouvrir Stripe Dashboard", href: "https://dashboard.stripe.com", group: "Actions", icon: "action" },
];
