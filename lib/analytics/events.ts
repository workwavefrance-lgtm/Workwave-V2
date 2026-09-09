// Noms d'événements trackés sur la plateforme
export const EVENTS = {
  // Particulier
  PAGE_VIEW: "page_view",
  // Tiré à l'AFFICHAGE du formulaire, sans intention : le composant est aussi
  // intégré dans les pages métier x ville, donc un simple chargement de page
  // compte ici. metadata.initialStep = écran de départ (1..4),
  // metadata.inline = true quand il démarre déjà rempli (page listing).
  // Ajouté le 09/09/2026 pour séparer « vu » de « commencé ».
  PROJECT_FORM_VIEWED: "project_form_viewed",
  // Depuis le 09/09/2026 : tiré UNE fois par montage, à la PREMIÈRE interaction
  // (clic sur un choix, frappe dans un champ). Avant, il partait au montage et
  // comptait donc chaque affichage de page listing comme un formulaire ouvert.
  PROJECT_FORM_STARTED: "project_form_started",
  PROJECT_FORM_SUBMITTED: "project_form_submitted",
  PROJECT_FORM_ABANDONED: "project_form_abandoned",
  // Écran devenu visible dans le formulaire multi-step (metadata.step = 1..4,
  // metadata.name = Métier|Quand|Projet|Coordonnées depuis le 09/09/2026 ;
  // 1..5 et Besoin|Métier|Quand|Projet|Coordonnées du 28/08 au 08/09) → mesure le
  // drop-off PAR étape pour savoir où ça coupe. Tiré à CHAQUE affichage d'un
  // écran, y compris en retour arrière ou en départ direct (page listing).
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
