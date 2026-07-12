"use server";

import { revalidatePath } from "next/cache";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { verifyAdmin } from "@/lib/admin/auth";

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

/**
 * Suppression RGPD d'une fiche (art. 17) depuis l'admin — remplace les scripts
 * _rgpd-*.ts. Pattern « suppression complète » : soft-delete (is_active=false +
 * deleted_at + do_not_contact + nullify PII) → la fiche publique retourne 404,
 * Google désindexe. + blacklist de l'email du plaignant (ne plus jamais contacter).
 * verifyAdmin() + audit admin_logs (durcissement Phase 1).
 */
export async function deleteProRgpd(input: {
  proId: number;
  blacklistEmail?: string;
  reason?: string;
}): Promise<UpdateProResult> {
  const admin = await verifyAdmin();
  if (!admin) return { ok: false, error: "Non autorisé" };

  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pro } = await (sb.from("pros") as any)
    .select("slug, email, claimed_by_user_id")
    .eq("id", input.proId)
    .single();
  if (!pro) return { ok: false, error: "Pro introuvable" };
  if (pro.claimed_by_user_id) {
    return {
      ok: false,
      error: "Fiche RÉCLAMÉE : gérer l'abonnement/remboursement avant toute suppression.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("pros") as any)
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      do_not_contact: true,
      phone: null,
      email: null,
      website: null,
    })
    .eq("id", input.proId);
  if (error) {
    console.error("[admin/pros] deleteProRgpd erreur :", error.message);
    return { ok: false, error: error.message };
  }

  // Blacklist de l'email du plaignant (celui saisi, sinon l'email de la fiche).
  const emailToBlacklist = (input.blacklistEmail || pro.email || "").trim().toLowerCase();
  if (emailToBlacklist) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb.from("email_blacklist") as any).upsert(
      { email: emailToBlacklist, reason: input.reason || "rgpd_deletion_admin" },
      { onConflict: "email" }
    );
  }

  // Audit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from("admin_logs") as any).insert({
    admin_id: admin.id,
    action: "rgpd_delete_pro",
    entity_type: "pro",
    entity_id: input.proId,
    details: { blacklistEmail: emailToBlacklist || null, reason: input.reason || null },
  });

  revalidatePath(`/admin/pros/${input.proId}`);
  revalidatePath("/admin/pros");
  if (pro.slug) revalidatePath(`/artisan/${pro.slug}`);

  return { ok: true };
}
