import { detectAlerts } from "@/lib/queries/admin-alerts";
import AlertsClient from "./AlertsClient";

export const metadata = {
  title: "Alertes",
};

export default async function AdminAlertsPage() {
  const alerts = await detectAlerts();

  return <AlertsClient alerts={alerts} />;
}
