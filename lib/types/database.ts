export type Category = {
  id: number;
  slug: string;
  name: string;
  vertical: "btp" | "domicile" | "personne" | "tech";
  parent_id: number | null;
  description: string | null;
  seo_keywords: string[] | null;
  naf_codes: string[];
};

export type Department = {
  id: number;
  code: string;
  name: string;
  region: string;
  /** ISO 3166-1 alpha-2 : "FR" (défaut) ou "BE" (provinces belges, codes alpha WHT/WLG/WNA/WBR/WLX/BRU). */
  country: string;
};

export type City = {
  id: number;
  department_id: number;
  name: string;
  slug: string;
  postal_code: string | null;
  /** France : code INSEE. Belgique : code NIS (5 chiffres aussi) — la clé logique est (country, insee_code). */
  insee_code: string | null;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  /** ISO 3166-1 alpha-2 : "FR" (défaut) ou "BE". */
  country: string;
};

export type CityWithDepartment = City & {
  department: Department;
};

// ============================================
// Types pour le profil pro enrichi (Sprint 5)
// ============================================

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "free"
  | "suspended";

export type SubscriptionPlan = "monthly" | "annual";

export type DaySchedule = {
  open: boolean;
  from: string; // "09:00"
  to: string; // "18:00"
};

export type OpeningHours = {
  lundi: DaySchedule;
  mardi: DaySchedule;
  mercredi: DaySchedule;
  jeudi: DaySchedule;
  vendredi: DaySchedule;
  samedi: DaySchedule;
  dimanche: DaySchedule;
};

export type Certification =
  | "RGE"
  | "Qualibat"
  | "Qualigaz"
  | "QualiPAC"
  | "QualiPV"
  | "QualiSol"
  | "QualiBois"
  | "Artisan d'Art"
  | "Eco-Artisan"
  | "Handibat"
  | "PRO de la Performance Énergétique";

export type PaymentMethod = "CB" | "virement" | "cheque" | "especes";

// Qualification RGE officielle source ADEME (sync via scripts/match-rge-pros.ts)
// Une entreprise peut avoir plusieurs RgeQualification (Qualibat 5111 + 5232 + ...)
export type RgeQualification = {
  nom: string;
  code: string | null;
  organisme: string | null;
  domaine: string | null;
  meta_domaine: string | null;
  date_fin: string;
};

export type Specialty = {
  category_id: number;
  specialties: string[];
};

// ============================================
// Table pros
// ============================================

export type Pro = {
  id: number;
  slug: string;
  name: string;
  siret: string | null;
  siren: string | null;
  category_id: number;
  address: string | null;
  city_id: number | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  photos: string[];
  source: "sirene" | "pagesjaunes" | "manual" | "ai_signup";
  naf_code: string | null;
  created_at: string;
  updated_at: string;
  // Réclamation
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  // Suppression RGPD
  deleted_at: string | null;
  // Abonnement Stripe
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  // Profil enrichi
  founded_year: number | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  opening_hours: OpeningHours | null;
  languages: string[] | null;
  certifications: Certification[];
  rge_number: string | null;
  // RGE officiel ADEME (sync auto via scripts/match-rge-pros.ts)
  rge_certified: boolean;
  rge_qualifications: RgeQualification[];
  rge_synced_at: string | null;
  // Sirene v3 enrichi (sync auto via scripts/enrich-sirene-v3.ts)
  founding_date: string | null;
  effectif_range: string | null;
  etat_admin: "A" | "C" | "F" | null;
  sirene_synced_at: string | null;
  has_rc_pro: boolean;
  has_decennale: boolean;
  payment_methods: PaymentMethod[];
  free_quote: boolean;
  // Services et catégories
  secondary_category_ids: number[] | null;
  specialties: Specialty[];
  hourly_rate: number | null;
  travel_fee: number | null;
  min_budget: number | null;
  urgency_available: boolean;
  // Préférences leads
  intervention_radius_km: number;
  enabled_category_ids: number[] | null;
  paused_until: string | null;
  // Statut activité
  is_active: boolean;
  // Cold email
  do_not_contact: boolean;
  email_bounced: boolean;
  first_email_sent_at: string | null;
  prenom_dirigeant: string | null;
  nom_dirigeant: string | null;
  // Enrichissement Google Places (cf. scripts/enrich-pros-google-places.ts)
  google_place_id: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  google_enriched_at: string | null;
  // Avis natifs Workwave (sollicites par cron J+7 post-projet)
  workwave_reviews_avg: number | null;
  workwave_reviews_count: number;
  // Champs calculés
  profile_completion: number;
  response_rate: number | null;
  // Tech / Workwave AI freelance (cf. CLAUDE.md Phase 8)
  skills: string | null;
  github_username: string | null;
  years_experience: number | null;
  available_for_remote: boolean | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  subscription_product: "btp" | "ai" | null;
  // Personnalisation Phase 12 (cool/fun) — palette 8 couleurs
  avatar_color:
    | "orange"
    | "blue"
    | "purple"
    | "green"
    | "pink"
    | "red"
    | "yellow"
    | "cyan"
    | null;
  theme_color:
    | "orange"
    | "blue"
    | "purple"
    | "green"
    | "pink"
    | "red"
    | "yellow"
    | "cyan"
    | null;
};

// ============================================
// Avis natifs Workwave (pro_reviews)
// ============================================

export type ProReviewStatus = "pending" | "published" | "rejected" | "expired";

export type ProReview = {
  id: number;
  pro_id: number;
  project_id: number | null;
  particulier_email: string;
  particulier_name: string;
  rating: number; // 1-5
  comment: string | null;
  token: string;
  status: ProReviewStatus;
  verified: boolean;
  requested_at: string;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// Partenariats locaux (mairies, notaires, etc.)
// ============================================

export type PartnershipType =
  | "mairie"
  | "office_tourisme"
  | "notaire"
  | "agence_immo"
  | "syndic"
  | "cci"
  | "chambre_metiers"
  | "association_quartier"
  | "autre";

export type PartnershipStatus =
  | "to_contact"
  | "contacted"
  | "follow_up_due"
  | "responded"
  | "partnership"
  | "declined"
  | "invalid";

export type Partnership = {
  id: number;
  type: PartnershipType;
  name: string;
  organization: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_role: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  postal_code: string | null;
  city: string | null;
  department_code: string | null;
  status: PartnershipStatus;
  first_contacted_at: string | null;
  last_contacted_at: string | null;
  responded_at: string | null;
  partnership_active_since: string | null;
  emails_sent_count: number;
  notes: string | null;
  response_summary: string | null;
  backlink_url: string | null;
  backlink_observed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProWithRelations = Pro & {
  category: Category;
  city: CityWithDepartment | null;
};

// Niveau "card" : sous-ensemble de ProWithRelations chargé par PRO_SELECT_CARD
// (listings /[metier]/[location], pros similaires, recherche, top-pros).
// Contient UNIQUEMENT les champs consommés par ProCard / TopProCard /
// pro-summary / computeProScore / le schema ItemList des listings.
// Réduction egress Supabase mesurée : ~3,4 Ko -> ~1,1 Ko par row (11/06/2026).
// NB : ProWithRelations reste structurellement assignable à ProCardData,
// donc les composants cards acceptent les deux niveaux.
export type ProCardData = Pick<
  Pro,
  | "id"
  | "slug"
  | "name"
  | "address"
  | "postal_code"
  | "phone"
  | "description"
  | "logo_url"
  | "claimed_by_user_id"
  | "category_id"
  | "city_id"
  | "google_rating"
  | "google_reviews_count"
  | "google_place_id"
  | "workwave_reviews_avg"
  | "workwave_reviews_count"
  | "founded_year"
  | "certifications"
  | "rge_certified"
  | "has_decennale"
  | "has_rc_pro"
  | "photos"
  | "profile_completion"
> & {
  category: Pick<Category, "id" | "slug" | "name" | "vertical"> | null;
  city: Pick<City, "id" | "name" | "slug"> | null;
};

export type PaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ResolvedLocation =
  | { type: "department"; department: Department }
  | { type: "city"; city: CityWithDepartment };

// ============================================
// Table projects
// ============================================

export type ProjectUrgency = "today" | "this_week" | "this_month" | "not_urgent";
export type ProjectBudget = "lt500" | "500_2000" | "2000_5000" | "5000_15000" | "gt15000" | "unknown";
export type ProjectStatus = "new" | "routed" | "unrouted" | "suspicious" | "closed" | "deleted";

export type AiQualification = {
  suggested_category: string;
  category_match: boolean;
  urgency_assessment: string;
  real_urgency: ProjectUrgency;
  budget_realistic: boolean;
  budget_comment: string;
  keywords: string[];
  summary: string;
  suspicion_score: number;
};

export type Project = {
  id: number;
  first_name: string;
  email: string;
  phone: string;
  category_id: number;
  city_id: number;
  description: string;
  urgency: ProjectUrgency;
  budget: ProjectBudget;
  ai_qualification: AiQualification | null;
  status: ProjectStatus;
  suspicion_score: number | null;
  deletion_token: string | null;
  created_at: string;
};

// ============================================
// Table project_leads
// ============================================

export type ProjectLeadStatus = "sent" | "opened" | "contacted" | "not_relevant" | "expired";

export type ProjectLead = {
  id: number;
  project_id: number;
  pro_id: number;
  sent_at: string;
  opened_at: string | null;
  contacted_at: string | null;
  not_relevant: boolean;
  status: ProjectLeadStatus;
};

export type ProjectLeadWithRelations = ProjectLead & {
  project: Project;
  pro: Pro;
};

// ============================================
// Table claim_attempts
// ============================================

export type ClaimAttemptStatus = "pending" | "verified" | "blocked" | "expired";

export type ClaimAttemptType = "claim" | "deletion";

export type ClaimAttempt = {
  id: number;
  siret: string;
  email: string;
  ip: string | null;
  success: boolean;
  error_reason: string | null;
  verification_code_hash: string | null;
  code_expires_at: string | null;
  attempts_count: number;
  status: ClaimAttemptStatus;
  type: ClaimAttemptType;
  created_at: string;
};

// ============================================
// Table cancellation_feedback
// ============================================

export type CancellationReason = "too_expensive" | "not_enough_leads" | "lead_quality" | "other";

export type CancellationFeedback = {
  id: number;
  pro_id: number;
  reason: CancellationReason;
  feedback: string | null;
  created_at: string;
};

// ============================================
// Cold email system
// ============================================

export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type SubjectVariant = "a" | "b" | "c" | "d" | "e";

export type EmailCampaign = {
  id: number;
  name: string;
  description: string | null;
  status: CampaignStatus;
  total_steps: number;
  daily_limit: number;
  subject_variant: SubjectVariant;
  created_at: string;
  updated_at: string;
};

export type EmailSequenceStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "unsubscribed"
  | "bounced"
  | "error";

export type EmailSequence = {
  id: number;
  campaign_id: number;
  pro_id: number;
  current_step: number;
  status: EmailSequenceStatus;
  next_send_at: string | null;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailLogStatus =
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "failed";

export type EmailLog = {
  id: number;
  sequence_id: number;
  pro_id: number;
  campaign_id: number;
  step: number;
  brevo_message_id: string | null;
  subject: string | null;
  recipient_email: string | null;
  status: EmailLogStatus;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  retry_count: number;
  created_at: string;
};

export type EmailBlacklist = {
  id: number;
  email: string;
  reason: string | null;
  created_at: string;
};

export type ProSurveyResponse = {
  id: string;
  created_at: string;
  metier: string;
  taille: string | null;
  departement: string | null;
  taches_chrono: string[];
  heures_admin: string | null;
  corvee_libre: string | null;
  outils_actuels: string | null;
  outils_detail: string | null;
  outils_essayes: string | null;
  prenom: string | null;
  contact: string | null;
  consent: boolean;
  source: string | null;
};
