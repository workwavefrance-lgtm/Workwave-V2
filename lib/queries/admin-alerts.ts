import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

export type Alert = {
  id: string;
  severity: "critical" | "warning";
  title: string;
  description: string;
  detected_at: string;
};

export const detectAlerts = cache(async (): Promise<Alert[]> => {
  const db = getAdminServiceClient();
  const alerts: Alert[] = [];

  // Check for unrouted projects (older than 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: unrouted } = await db
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "unrouted")
    .lt("created_at", yesterday);

  if ((unrouted || 0) > 0) {
    alerts.push({
      id: "unrouted-projects",
      severity: "warning",
      title: `${unrouted} projet${(unrouted || 0) > 1 ? "s" : ""} non routé${(unrouted || 0) > 1 ? "s" : ""} depuis +24h`,
      description:
        "Des projets n'ont pas pu être routés. Vérifiez les catégories et les pros éligibles.",
      detected_at: new Date().toISOString(),
    });
  }

  // Check for past_due subscriptions
  const { count: pastDue } = await db
    .from("pros")
    .select("*", { count: "exact", head: true })
    .eq("subscription_status", "past_due");

  if ((pastDue || 0) > 0) {
    alerts.push({
      id: "past-due",
      severity: "critical",
      title: `${pastDue} abonnement${(pastDue || 0) > 1 ? "s" : ""} impayé${(pastDue || 0) > 1 ? "s" : ""}`,
      description:
        "Des pros ont des paiements en échec. Stripe effectue des relances automatiques.",
      detected_at: new Date().toISOString(),
    });
  }

  // Check for suspicious projects
  const { count: suspicious } = await db
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "suspicious");

  if ((suspicious || 0) > 0) {
    alerts.push({
      id: "suspicious-projects",
      severity: "warning",
      title: `${suspicious} projet${(suspicious || 0) > 1 ? "s" : ""} suspect${(suspicious || 0) > 1 ? "s" : ""} en attente`,
      description:
        "Des projets marqués suspects par l'IA nécessitent une vérification manuelle avant routage.",
      detected_at: new Date().toISOString(),
    });
  }

  // Check for pros with low response rate
  const { count: unresponsive } = await db
    .from("pros")
    .select("*", { count: "exact", head: true })
    .in("subscription_status", ["active", "trialing"])
    .lt("response_rate" as never, 0.25);

  if ((unresponsive || 0) > 0) {
    alerts.push({
      id: "unresponsive-pros",
      severity: "warning",
      title: `${unresponsive} pro${(unresponsive || 0) > 1 ? "s" : ""} avec taux de réponse < 25%`,
      description:
        "Ces professionnels ont été déclassés dans le scoring de routing.",
      detected_at: new Date().toISOString(),
    });
  }

  // Sort: critical first
  alerts.sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (a.severity !== "critical" && b.severity === "critical") return 1;
    return 0;
  });

  return alerts;
});
