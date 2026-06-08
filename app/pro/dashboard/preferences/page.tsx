import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getLeadPreviewCount } from "@/lib/queries/leads";
import PreferencesEditor from "@/components/pro/dashboard/PreferencesEditor";

export const metadata: Metadata = {
  title: "Zone d'intervention — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const pro = await getProByUserId(user.id);
  if (!pro) redirect("/pro/reclamer");

  // Aperçu basé sur TOUTES les catégories du pro (principale + secondaires) :
  // le pro reçoit les leads de l'ensemble de ses métiers (le broadcast diffuse
  // sur category_id + secondary_category_ids).
  const allCatIds = [pro.category_id, ...(pro.secondary_category_ids || [])];
  const departmentId = pro.city?.department?.id || null;
  const previewCount = await getLeadPreviewCount(allCatIds, departmentId);

  return <PreferencesEditor previewCount={previewCount} />;
}
