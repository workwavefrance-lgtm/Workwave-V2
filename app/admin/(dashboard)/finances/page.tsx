import { getFinanceKPIs, getMrrHistory } from "@/lib/stripe/admin-finances";
import { getBtpFinances } from "@/lib/queries/admin-finances-btp";
import FinancesClient from "./FinancesClient";
import BtpFinanceSection from "./BtpFinanceSection";

export const metadata = {
  title: "Finances",
};

export default async function FinancesPage() {
  const [kpis, mrrHistory, btp] = await Promise.all([
    getFinanceKPIs(),
    getMrrHistory(),
    getBtpFinances(),
  ]);

  return (
    <div className="p-6 space-y-10">
      {/* BTP — pay-per-lead (CA réel via lead_unlocks) */}
      <BtpFinanceSection data={btp} />
      {/* IA — abonnements Premium (Stripe) */}
      <FinancesClient kpis={kpis} mrrHistory={mrrHistory} />
    </div>
  );
}
