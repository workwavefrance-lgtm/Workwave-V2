// Noms d'événements trackés sur la plateforme
export const EVENTS = {
  // Particulier
  PAGE_VIEW: "page_view",
  PROJECT_FORM_STARTED: "project_form_started",
  PROJECT_FORM_SUBMITTED: "project_form_submitted",
  PROJECT_FORM_ABANDONED: "project_form_abandoned",

  // Pro
  CLAIM_STARTED: "claim_started",
  CLAIM_COMPLETED: "claim_completed",
  SUBSCRIPTION_COMPLETED: "subscription_completed",
  LEAD_CONTACTED: "lead_contacted",
  DASHBOARD_VISIT: "dashboard_visit",
  PRO_PROFILE_UPDATED: "pro_profile_updated",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
