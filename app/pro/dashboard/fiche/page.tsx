import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getAllCategories } from "@/lib/queries/categories";
import FicheEditor from "@/components/pro/dashboard/FicheEditor";

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

  return (
    <FicheEditor
      categories={categories}
      profileCompletion={pro.profile_completion}
    />
  );
}
