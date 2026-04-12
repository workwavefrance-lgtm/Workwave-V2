import { getFinanceKPIs, getMrrHistory } from "@/lib/stripe/admin-finances";
import FinancesClient from "./FinancesClient";

export const metadata = {
  title: "Finances",
};

export default async function FinancesPage() {
  const [kpis, mrrHistory] = await Promise.all([
    getFinanceKPIs(),
    getMrrHistory(),
  ]);

  return <FinancesClient kpis={kpis} mrrHistory={mrrHistory} />;
}
