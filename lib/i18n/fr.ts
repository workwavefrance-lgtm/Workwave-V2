/**
 * Dictionnaire FRANCAIS — chrome partage Workwave AI. Respecte la forme de
 * `Dictionary` (derivee de en.ts). Les valeurs reprennent les libelles FR deja
 * presents dans les composants AiHeader/AiFooter pour une bascule sans regression.
 */

import type { Dictionary } from "./en";

export const fr: Dictionary = {
  nav: {
    postProject: "Déposer un projet",
    forFreelances: "Pour freelances",
    pricing: "Tarifs",
    login: "Connexion",
    loginSignup: "Connexion / Inscription",
    findFreelance: "Trouver un freelance",
    menu: "Menu",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    homeAria: "Workwave AI — Accueil",
    primaryNavAria: "Navigation principale",
    mobileNavAria: "Menu mobile",
  },
  langSwitch: {
    label: "Changer de langue",
    toFr: "FR · Français",
    toEn: "EN · English",
    current: "FR",
  },
  footer: {
    tagline:
      "Plateforme de mise en relation entre porteurs de projet et freelances tech, IA, data, design, marketing et plus — en France, en Europe et au-delà.",
    clients: "Clients",
    freelances: "Freelances",
    company: "Workwave",
    postProject: "Déposer un projet",
    findFreelance: "Trouver un freelance",
    howItWorks: "Comment ça marche",
    whyUs: "Pourquoi nous",
    pricing: "Tarifs",
    signup: "S'inscrire",
    login: "Connexion",
    about: "À propos",
    terms: "CGU",
    legal: "Mentions légales",
    contact: "Contact",
    rights: "Tous droits réservés.",
    btpQuestion: "Vous cherchez un artisan BTP ?",
  },
  common: {
    free: "Gratuit",
    noCommission: "0% de commission",
    freeSignup: "Inscription gratuite",
    getStarted: "Commencer",
    learnMore: "En savoir plus",
    poweredByAi: "Matching IA en 24h",
  },
};
