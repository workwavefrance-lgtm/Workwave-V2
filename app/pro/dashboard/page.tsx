import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getProDashboardData } from "@/lib/queries/leads";
import DashboardHome from "@/components/pro/dashboard/DashboardHome";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";

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
  if (!pro) redirect("/pro");

  // Tracking dashboard visit (fire-and-forget)
  track(EVENTS.DASHBOARD_VISIT, {
    userId: user.id,
    proId: pro.id,
  });

  // Accueil pay-per-lead : données dynamiques (projets matchant les catégories
  // principale + secondaires du pro + son département). Cf. getProDashboardData.
  const dashboardData = await getProDashboardData({
    proId: pro.id,
    categoryIds: Array.from(
      new Set<number>([
        pro.category_id,
        ...((pro.secondary_category_ids as number[] | null) || []),
      ])
    ),
    lat: pro.city?.latitude ?? null,
    lng: pro.city?.longitude ?? null,
    radiusKm: pro.intervention_radius_km ?? 200,
    departmentId: pro.city?.department_id ?? null,
  });

  return <DashboardHome data={dashboardData} />;
}
