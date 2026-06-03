// Noms d'événements trackés sur la plateforme
export const EVENTS = {
  // Particulier
  PAGE_VIEW: "page_view",
  PROJECT_FORM_STARTED: "project_form_started",
  PROJECT_FORM_SUBMITTED: "project_form_submitted",
  PROJECT_FORM_ABANDONED: "project_form_abandoned",
  // Étape atteinte dans le formulaire multi-step (metadata.step = 2|3|4,
  // metadata.name = Ville|Projet|Contact) → mesure le drop-off PAR étape
  // pour savoir où les ~92 % abandonnent.
  PROJECT_STEP_REACHED: "project_step_reached",
  // Clic sur le numéro de téléphone d'une fiche (tap-to-call) = le pro est
  // contacté en direct, hors tunnel "déposer un projet". Mesure le bypass.
  PHONE_CLICK: "phone_click",

  // Pro
  CLAIM_STARTED: "claim_started",
  CLAIM_COMPLETED: "claim_completed",
  SUBSCRIPTION_COMPLETED: "subscription_completed",
  LEAD_CONTACTED: "lead_contacted",
  DASHBOARD_VISIT: "dashboard_visit",
  PRO_PROFILE_UPDATED: "pro_profile_updated",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
