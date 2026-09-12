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
  const { error: proError } = await supabase
    .from("pros")
    .update({ do_not_contact: true })
    .eq("id", proId);

  // Ajouter a la blacklist globale
  const { error: blacklistError } = await supabase
    .from("email_blacklist")
    .upsert(
      { email: pro.email, reason: "global_unsubscribe" },
      { onConflict: "email" }
    );

  // Stopper toutes les sequences actives
  const { error: sequencesError } = await supabase
    .from("email_sequences")
    .update({ status: "unsubscribed" })
    .eq("pro_id", proId)
    .in("status", ["pending", "active"]);

  // Conserver chaque opposition réussie même si une autre écriture échoue.
  // Ces opérations sont idempotentes : une nouvelle tentative les complète.
  if (proError || blacklistError || sequencesError) {
    return { success: false, error: "La désinscription n’a pas pu être entièrement enregistrée. Veuillez réessayer." };
  }

  return { success: true };
}
