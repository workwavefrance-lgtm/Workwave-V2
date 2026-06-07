import { getAdminAnalytics } from "@/lib/queries/admin-events";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics",
};

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics(30);

  return <AnalyticsClient initialAnalytics={analytics} initialPeriod="30d" />;
}
