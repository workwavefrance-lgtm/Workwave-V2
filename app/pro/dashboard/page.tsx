import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getLeadStatsForPro, getRecentLeadsForPro } from "@/lib/queries/leads";
import DashboardHome from "@/components/pro/dashboard/DashboardHome";

export const metadata: Metadata = {
  title: "Tableau de bord — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const pro = await getProByUserId(user.id);
  if (!pro) redirect("/pro/reclamer");

  const [stats, recentLeads] = await Promise.all([
    getLeadStatsForPro(pro.id),
    getRecentLeadsForPro(pro.id),
  ]);

  return <DashboardHome stats={stats} recentLeads={recentLeads} />;
}
