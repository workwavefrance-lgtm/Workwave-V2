// ============================================
// Admin user
// ============================================

export type AdminRole = "admin" | "superadmin";

export type Admin = {
  id: number;
  userId: string;
  email: string;
  role: AdminRole;
};

// ============================================
// KPI
// ============================================

export type KPIDelta = {
  value: number;
  percentage: number;
  direction: "up" | "down" | "flat";
};

export type KPICard = {
  label: string;
  value: number;
  formattedValue: string;
  delta: KPIDelta | null;
  sparklineData: number[];
};

// ============================================
// Admin logs
// ============================================

export type AdminLogAction =
  | "pro.update"
  | "pro.delete"
  | "pro.impersonate"
  | "pro.subscription_update"
  | "project.update"
  | "project.route_manually"
  | "lead.update"
  | "alert.acknowledge"
  | "admin.add"
  | "admin.remove";

export type AdminLog = {
  id: number;
  admin_id: number;
  action: AdminLogAction;
  entity_type: string | null;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

// ============================================
// Events (analytics tracking)
// ============================================

export type EventName =
  | "page_view"
  | "project_form_started"
  | "project_form_submitted"
  | "project_form_abandoned"
  | "claim_started"
  | "claim_completed"
  | "subscription_started"
  | "subscription_completed"
  | "lead_email_opened"
  | "lead_contacted"
  | "dashboard_visit"
  | "pro_profile_updated";

export type TrackingEvent = {
  id: number;
  event_name: EventName;
  user_id: string | null;
  pro_id: number | null;
  project_id: number | null;
  metadata: Record<string, unknown> | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

// ============================================
// Alerts
// ============================================

export type AlertSeverity = "critical" | "warning" | "info";

export type AlertType =
  | "conversion_drop"
  | "orphan_projects"
  | "unresponsive_pros"
  | "api_errors"
  | "payment_failures";

export type Alert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedAt: string;
  acknowledgedAt: string | null;
  data: Record<string, unknown>;
};

// ============================================
// Finance (Stripe)
// ============================================

export type MRRDataPoint = {
  month: string;
  mrr: number;
};

export type StripeTransaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerName: string;
  customerEmail: string;
  description: string | null;
  created: string;
  invoiceUrl: string | null;
};

export type FinanceKPIs = {
  mrr: number;
  arr: number;
  activeSubscribers: number;
  churnRate: number;
  ltv: number;
};

// ============================================
// Table filters
// ============================================

export type SortDirection = "asc" | "desc";

export type TableSort = {
  column: string;
  direction: SortDirection;
};

export type DatePeriod = "7d" | "30d" | "90d" | "12m" | "all";
