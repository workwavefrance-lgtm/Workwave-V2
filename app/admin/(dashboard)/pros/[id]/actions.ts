"use server";

import { revalidatePath } from "next/cache";
import { getAdminServiceClient } from "@/lib/admin/service-client";

/**
 * Server Actions admin pour éditer un profil pro (claimed ou non).
 *
 * updateProByAdmin : édite catégorie principale, catégories secondaires,
 *   description, contacts, ville, is_active. Bypass RLS via service client.
 *   Revalidate la page admin + la fiche publique /artisan/[slug].
 */

export type UpdateProInput = {
  proId: number;
  categoryId?: number;
  secondaryCategoryIds?: number[]; // [] = vide ; null/undefined = ne touche pas
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  cityId?: number | null;
  isActive?: boolean;
  interventionRadiusKm?: number; // 5-100 km (cf. Sprint 5)
};

export type UpdateProResult = {
  ok: boolean;
  error?: string;
};

export async function updateProByAdmin(
  input: UpdateProInput,
): Promise<UpdateProResult> {
  if (!input.proId || isNaN(input.proId)) {
    return { ok: false, error: "ID pro invalide" };
  }

  const sb = getAdminServiceClient();

  // Construction du payload — on n'inclut que les champs fournis (pas de réécriture)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { updated_at: new Date().toISOString() };

  if (input.categoryId !== undefined) {
    if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
      return { ok: false, error: "Catégorie principale invalide" };
    }
    payload.category_id = input.categoryId;
  }
  if (input.secondaryCategoryIds !== undefined) {
    // Filtre : que des entiers positifs uniques, pas la même que la principale
    const cleaned = [...new Set(input.secondaryCategoryIds.filter((id) => Number.isInteger(id) && id > 0))]
      .filter((id) => id !== (input.categoryId ?? -1));
    payload.secondary_category_ids = cleaned.length > 0 ? cleaned : null;
  }
  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null;
  }
  if (input.phone !== undefined) {
    payload.phone = input.phone?.trim() || null;
  }
  if (input.email !== undefined) {
    const e = input.email?.trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return { ok: false, error: "Format email invalide" };
    }
    payload.email = e || null;
  }
  if (input.website !== undefined) {
    payload.website = input.website?.trim() || null;
  }
  if (input.cityId !== undefined) {
    if (input.cityId !== null && (!Number.isInteger(input.cityId) || input.cityId <= 0)) {
      return { ok: false, error: "Ville invalide" };
    }
    payload.city_id = input.cityId;
  }
  if (input.isActive !== undefined) {
    payload.is_active = !!input.isActive;
  }
  if (input.interventionRadiusKm !== undefined) {
    const r = Math.round(input.interventionRadiusKm);
    if (!Number.isInteger(r) || r < 1 || r > 200) {
      return { ok: false, error: "Distance d'intervention invalide (1-200 km)" };
    }
    payload.intervention_radius_km = r;
  }

  // Récup du slug du pro pour revalidate la fiche publique
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (sb.from("pros") as any)
    .select("slug")
    .eq("id", input.proId)
    .single();
  if (!existing) {
    return { ok: false, error: "Pro introuvable" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("pros") as any)
    .update(payload)
    .eq("id", input.proId);

  if (error) {
    console.error("[admin/pros] updateProByAdmin erreur :", error.message);
    return { ok: false, error: error.message };
  }

  // Revalidations : admin + fiche publique du pro
  revalidatePath(`/admin/pros/${input.proId}`);
  revalidatePath("/admin/pros");
  if (existing.slug) {
    revalidatePath(`/artisan/${existing.slug}`);
  }

  return { ok: true };
}
