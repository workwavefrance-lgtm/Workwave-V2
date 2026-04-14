"use server";

import { getAdminServiceClient } from "@/lib/admin/service-client";
import { verifyGlobalUnsubscribeToken } from "@/lib/utils/unsubscribe-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export async function processGlobalUnsubscribe(
  proId: number,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!verifyGlobalUnsubscribeToken(proId, token)) {
    return { success: false, error: "Lien de désinscription invalide." };
  }

  const supabase: DB = getAdminServiceClient();

  // Recuperer l'email du pro
  const { data: pro } = await supabase
    .from("pros")
    .select("email")
    .eq("id", proId)
    .single();

  if (!pro?.email) {
    return { success: false, error: "Professionnel introuvable." };
  }

  // Marquer le pro
  await supabase
    .from("pros")
    .update({ do_not_contact: true })
    .eq("id", proId);

  // Ajouter a la blacklist globale
  await supabase
    .from("email_blacklist")
    .upsert(
      { email: pro.email, reason: "global_unsubscribe" },
      { onConflict: "email" }
    );

  // Stopper toutes les sequences actives
  await supabase
    .from("email_sequences")
    .update({ status: "unsubscribed" })
    .eq("pro_id", proId)
    .in("status", ["pending", "active"]);

  return { success: true };
}
