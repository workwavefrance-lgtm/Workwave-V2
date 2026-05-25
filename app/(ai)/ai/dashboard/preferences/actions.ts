"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function updateAiPreferences(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ai/connexion");

  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect("/ai/connexion?error=no_pro");

  // Parse + validate
  const remoteRaw = String(formData.get("available_for_remote") || "");
  const availableForRemote = remoteRaw === "true" ? true : remoteRaw === "false" ? false : null;

  const minBudgetRaw = String(formData.get("min_budget") || "").trim();
  const minBudget = minBudgetRaw
    ? Math.min(500000, Math.max(0, parseInt(minBudgetRaw, 10) || 0))
    : null;

  const pausedRaw = String(formData.get("paused_until") || "").trim();
  let pausedUntil: string | null = null;
  if (pausedRaw) {
    const d = new Date(pausedRaw);
    if (!isNaN(d.getTime()) && d > new Date()) {
      pausedUntil = d.toISOString();
    }
  }

  await service
    .from("pros")
    .update({
      available_for_remote: availableForRemote,
      min_budget: minBudget,
      paused_until: pausedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pro.id);

  revalidatePath("/ai/dashboard/preferences");
  redirect("/ai/dashboard/preferences?saved=1");
}
