"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";

const preferencesSchema = z.object({
  intervention_radius_km: z.coerce
    .number()
    .int()
    .min(5, "Le rayon minimum est de 5 km")
    .max(100, "Le rayon maximum est de 100 km"),
  enabled_category_ids: z.array(z.coerce.number()).optional().default([]),
  min_budget: z.union([z.coerce.number().min(0), z.literal(0), z.nan()]).optional(),
  urgency_available: z.boolean().optional().default(false),
  paused_until: z.string().nullable().optional(),
});

export type PreferencesFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updatePreferences(
  _prevState: PreferencesFormState,
  formData: FormData
): Promise<PreferencesFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const pro = await getProByUserId(user.id);
  if (!pro) return { error: "Profil introuvable" };

  const rawPausedUntil = formData.get("paused_until") as string | null;
  const pausedUntil = rawPausedUntil && rawPausedUntil.length > 0 ? rawPausedUntil : null;

  // Vérifier que la date de pause est dans le futur
  if (pausedUntil && new Date(pausedUntil) <= new Date()) {
    return { fieldErrors: { paused_until: "La date de reprise doit être dans le futur" } };
  }

  const rawData = {
    intervention_radius_km: Number(formData.get("intervention_radius_km")),
    enabled_category_ids: formData.getAll("enabled_category_ids").map(Number),
    min_budget: formData.get("min_budget") ? Number(formData.get("min_budget")) : undefined,
    urgency_available: formData.get("urgency_available") === "true",
    paused_until: pausedUntil,
  };

  const parsed = preferencesSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field) fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  const { error } = await supabase
    .from("pros")
    .update({
      intervention_radius_km: data.intervention_radius_km,
      enabled_category_ids:
        data.enabled_category_ids.length > 0
          ? data.enabled_category_ids
          : null,
      min_budget:
        data.min_budget && !isNaN(data.min_budget) ? data.min_budget : null,
      urgency_available: data.urgency_available,
      paused_until: data.paused_until || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pro.id);

  if (error) return { error: "Erreur lors de la sauvegarde" };

  revalidatePath("/pro/dashboard/preferences");
  revalidatePath("/pro/dashboard");
  return { success: true };
}
