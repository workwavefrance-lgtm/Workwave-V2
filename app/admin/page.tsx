import { getAdminKPIs, getRecentActivity, getSparklineData } from "@/lib/queries/admin-kpis";
import OverviewClient from "./OverviewClient";

export default async function AdminOverviewPage() {
  const [kpis, activity, sparkline] = await Promise.all([
    getAdminKPIs(),
    getRecentActivity(),
    getSparklineData(),
  ]);

  return (
    <OverviewClient kpis={kpis} activity={activity} sparkline={sparkline} />
  );
}
