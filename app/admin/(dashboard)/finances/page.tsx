import { getBtpFinances } from "@/lib/queries/admin-finances-btp";
import FinanceView from "./FinanceView";

export const metadata = {
  title: "Finances",
};

// Centré pay-per-lead (le vrai business). On ne fait PLUS les appels Stripe live
// (getFinanceKPIs/getMrrHistory) : lents + bug de cursor MRR + 0 abonné IA. Les
// fichiers Stripe (lib/stripe/admin-finances.ts, FinancesClient) restent pour
// réactivation le jour où le vertical IA aura des abonnés.
export default async function FinancesPage() {
  const btp = await getBtpFinances();
  return <FinanceView data={btp} />;
}
