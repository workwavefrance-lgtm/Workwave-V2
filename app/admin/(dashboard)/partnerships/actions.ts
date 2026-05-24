"use server";

import { revalidatePath } from "next/cache";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { sendPartnershipPitch } from "@/lib/email/send-partnership-pitch";
import type {
  Partnership,
  PartnershipStatus,
  PartnershipType,
} from "@/lib/types/database";

/**
 * Server Actions pour la moderation et l'envoi cote admin.
 */

export async function sendPitchAction(
  partnershipId: number,
  templateKey?: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: fetchError } = await (sb.from("partnerships") as any)
    .select("*")
    .eq("id", partnershipId)
    .single();
  if (fetchError || !data) {
    return { ok: false, error: "Partenariat introuvable" };
  }
  const partnership = data as Partnership;

  const result = await sendPartnershipPitch({ partnership, templateKey });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  // Update tracking
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (sb.from("partnerships") as any)
    .update({
      status: "contacted",
      first_contacted_at: partnership.first_contacted_at ?? now,
      last_contacted_at: now,
      emails_sent_count: partnership.emails_sent_count + 1,
    })
    .eq("id", partnershipId);
  if (updateError) {
    console.error("[partnerships] update tracking erreur :", updateError.message);
  }

  revalidatePath("/admin/partnerships");
  return { ok: true };
}

export async function updateStatusAction(
  partnershipId: number,
  status: PartnershipStatus,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getAdminServiceClient();
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = { status };
  if (notes !== undefined) patch.response_summary = notes;
  if (status === "responded" || status === "partnership" || status === "declined") {
    patch.responded_at = now;
  }
  if (status === "partnership") patch.partnership_active_since = now;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("partnerships") as any)
    .update(patch)
    .eq("id", partnershipId);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/partnerships");
  return { ok: true };
}

export async function updateNotesAction(
  partnershipId: number,
  notes: string
): Promise<{ ok: boolean }> {
  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from("partnerships") as any)
    .update({ notes })
    .eq("id", partnershipId);
  revalidatePath("/admin/partnerships");
  return { ok: true };
}

/**
 * Ajout manuel d'un nouveau partenariat (notaire, syndic, agence immo,
 * asso quartier) que l'admin saisit a la main.
 */
export async function createPartnershipAction(input: {
  type: PartnershipType;
  name: string;
  contact_email: string;
  contact_phone?: string;
  contact_role?: string;
  city?: string;
  postal_code?: string;
  department_code?: string;
  website?: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string; id?: number }> {
  if (!input.contact_email.includes("@")) {
    return { ok: false, error: "Email invalide" };
  }
  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("partnerships") as any)
    .insert({
      type: input.type,
      name: input.name,
      contact_email: input.contact_email.toLowerCase().trim(),
      contact_phone: input.contact_phone ?? null,
      contact_role: input.contact_role ?? null,
      city: input.city ?? null,
      postal_code: input.postal_code ?? null,
      department_code: input.department_code ?? null,
      website: input.website ?? null,
      notes: input.notes ?? null,
      status: "to_contact",
    })
    .select("id")
    .single();
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/partnerships");
  return { ok: true, id: (data as { id: number }).id };
}
