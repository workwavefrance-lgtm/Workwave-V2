"use server";

import { getAdminServiceClient } from "@/lib/admin/service-client";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export async function processUnsubscribe(
  proId: number,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!verifyUnsubscribeToken(proId, token)) {
    return { success: false, error: "Lien de désinscription invalide." };
  }

  const supabase: DB = getAdminServiceClient();

  const { error: proError } = await supabase
    .from("pros")
    .update({ do_not_contact: true })
    .eq("id", proId);

  if (proError) {
    console.error("Erreur desinscription pro:", proError);
    return { success: false, error: "Erreur technique, veuillez réessayer." };
  }

  await supabase
    .from("email_sequences")
    .update({ status: "unsubscribed" })
    .eq("pro_id", proId)
    .in("status", ["pending", "active"]);

  return { success: true };
}
