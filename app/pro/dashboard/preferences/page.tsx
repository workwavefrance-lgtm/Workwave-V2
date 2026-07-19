import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLeadPreviewCount } from "@/lib/queries/leads";
import { getDashboardContext } from "@/lib/pro/dashboard-context";
import PreferencesEditor from "@/components/pro/dashboard/PreferencesEditor";

export const metadata: Metadata = {
  title: "Zone d'intervention — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function PreferencesPage() {
  // Mémoïsé par le layout : aucun aller-retour auth ni requête en plus.
  const { pro } = await getDashboardContext();
  if (!pro) redirect("/pro/connexion");

  // Aperçu basé sur TOUTES les catégories du pro (principale + secondaires) :
  // le pro reçoit les leads de l'ensemble de ses métiers (le broadcast diffuse
  // sur category_id + secondary_category_ids).
  const allCatIds = [pro.category_id, ...(pro.secondary_category_ids || [])];
  // Zone = rayon Haversine (comme le broadcast + la page Leads), fallback dépt.
  const previewCount = await getLeadPreviewCount(
    allCatIds,
    pro.city?.latitude ?? null,
    pro.city?.longitude ?? null,
    pro.intervention_radius_km ?? 200,
    pro.city?.department?.id ?? null
  );

  return <PreferencesEditor previewCount={previewCount} />;
}
