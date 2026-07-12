import { getAdminKPIs, getRecentActivity, getAdminTodo } from "@/lib/queries/admin-kpis";
import OverviewClient from "./OverviewClient";

export default async function AdminOverviewPage() {
  const [kpis, activity, todo] = await Promise.all([
    getAdminKPIs(),
    getRecentActivity(),
    getAdminTodo(),
  ]);

  return <OverviewClient kpis={kpis} activity={activity} todo={todo} />;
}
