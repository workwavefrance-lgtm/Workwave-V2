import {
  getEmailStats,
  getActiveCampaign,
  getRecentEmailLogs,
  getBouncedPros,
} from "@/lib/queries/admin-emails";
import EmailsClient from "./EmailsClient";

export const metadata = {
  title: "Emails",
};

export default async function AdminEmailsPage() {
  const [stats, campaign, recentLogs, bouncedPros] = await Promise.all([
    getEmailStats(),
    getActiveCampaign(),
    getRecentEmailLogs(50),
    getBouncedPros(),
  ]);

  return (
    <EmailsClient
      initialStats={stats}
      initialCampaign={campaign}
      initialLogs={recentLogs}
      initialBouncedPros={bouncedPros}
    />
  );
}
