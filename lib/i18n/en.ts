/**
 * Dictionnaire ANGLAIS — chrome partage Workwave AI (header, footer, labels
 * communs). Les corps de page specifiques (home, etc.) sont ecrits en anglais
 * natif directement dans les pages ; ce dictionnaire ne couvre que ce qui est
 * REELLEMENT partage entre plusieurs surfaces (nav, footer, switcher, chips).
 *
 * `Dictionary` est derive de cet objet : fr.ts doit en respecter la forme.
 */

export const en = {
  nav: {
    postProject: "Post a project",
    forFreelances: "For freelances",
    pricing: "Pricing",
    login: "Log in",
    loginSignup: "Log in / Sign up",
    findFreelance: "Find a freelance",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "Workwave AI — Home",
    primaryNavAria: "Main navigation",
    mobileNavAria: "Mobile menu",
  },
  langSwitch: {
    label: "Change language",
    toFr: "FR · Français",
    toEn: "EN · English",
    current: "EN",
  },
  footer: {
    tagline:
      "The freelance platform connecting clients with vetted freelancers in tech, AI, data, design, marketing and more — across Europe, the Gulf and beyond.",
    clients: "Clients",
    freelances: "Freelances",
    company: "Workwave",
    postProject: "Post a project",
    findFreelance: "Find a freelance",
    howItWorks: "How it works",
    whyUs: "Why Workwave",
    pricing: "Pricing",
    signup: "Sign up",
    login: "Log in",
    about: "About",
    terms: "Terms",
    legal: "Legal",
    contact: "Contact",
    rights: "All rights reserved.",
    btpQuestion: "Looking for a construction pro in France?",
  },
  common: {
    free: "Free",
    noCommission: "0% commission",
    freeSignup: "Free sign-up",
    getStarted: "Get started",
    learnMore: "Learn more",
    poweredByAi: "AI-matched in 24h",
  },
};

// Pas de `as const` : les valeurs s'elargissent en `string`, donc `Dictionary`
// decrit la FORME (cles + string) que fr.ts doit respecter, sans imposer les
// mots anglais comme types litteraux.
export type Dictionary = typeof en;
