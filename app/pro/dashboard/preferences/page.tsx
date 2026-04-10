import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getLeadPreviewCount } from "@/lib/queries/leads";
import { getAllCategories } from "@/lib/queries/categories";
import PreferencesEditor from "@/components/pro/dashboard/PreferencesEditor";

export const metadata: Metadata = {
  title: "Préférences leads — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const [pro, categories] = await Promise.all([
    getProByUserId(user.id),
    getAllCategories(),
  ]);
  if (!pro) redirect("/pro/reclamer");

  // Catégories activées pour l'aperçu
  const enabledIds = pro.enabled_category_ids || [pro.category_id];
  const departmentId = pro.city?.department?.id || null;

  const previewCount = await getLeadPreviewCount(enabledIds, departmentId);

  return (
    <PreferencesEditor categories={categories} previewCount={previewCount} />
  );
}
