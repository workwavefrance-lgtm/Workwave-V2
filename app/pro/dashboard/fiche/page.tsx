import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getAllCategories } from "@/lib/queries/categories";
import { getLeadPreviewCount } from "@/lib/queries/leads";
import FicheEditor from "@/components/pro/dashboard/FicheEditor";
import PreferencesEditor from "@/components/pro/dashboard/PreferencesEditor";

export const metadata: Metadata = {
  title: "Ma fiche — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function FichePage() {
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

  // Préférences leads regroupées dans le MÊME onglet "Ma fiche" (rayon, catégories,
  // budget, urgences, pause) — réutilise le composant + sa Server Action existants
  // (useDashboard() fournit le pro via le layout). Un seul endroit pour tout gérer.
  const enabledIds = pro.enabled_category_ids || [pro.category_id];
  const departmentId = pro.city?.department?.id || null;
  const previewCount = await getLeadPreviewCount(enabledIds, departmentId);

  return (
    <div className="space-y-10">
      <FicheEditor
        categories={categories}
        profileCompletion={pro.profile_completion}
      />
      <div className="border-t border-[var(--border-color)]" />
      <PreferencesEditor categories={categories} previewCount={previewCount} />
    </div>
  );
}
