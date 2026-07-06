import type { SupabaseClient } from "@supabase/supabase-js";
import { sendFreeUnlockAlert } from "@/lib/email/send-free-unlock-alert";

/**
 * Offre de lancement — les N premiers déblocages de lead sont OFFERTS.
 *
 * Implémentation SANS migration : un déblocage offert est une row lead_unlocks
 * normale avec `amount_cents = 0` et un `stripe_payment_intent_id` marqueur
 * (`free_<proId>_<projectId>`). L'idempotence reste garantie par la contrainte
 * UNIQUE (project_id, pro_id). Le webhook Stripe n'est PAS impliqué.
 *
 * Suivi : `SELECT * FROM lead_unlocks WHERE amount_cents = 0` = tous les offerts.
 * Script de suivi : scripts/_suivi-leads-offerts.ts
 */
export const FREE_UNLOCK_COUNT = 2;

/**
 * Nombre de déblocages offerts restants pour un pro (0 quand l'offre est consommée).
 * On ne compte QUE les déblocages gratuits (amount_cents = 0) : un pro qui a déjà
 * PAYÉ un lead garde ses 2 crédits offerts intacts (sinon le compteur "X/2" ment —
 * cas réel ATSAF 06/07 : 1 unlock payé + 1er offert affichait "2/2 consommé").
 */
export async function getFreeUnlocksRemaining(
  service: SupabaseClient,
  proId: number
): Promise<number> {
  const { count, error } = await service
    .from("lead_unlocks")
    .select("id", { count: "exact", head: true })
    .eq("pro_id", proId)
    .eq("amount_cents", 0);
  // En cas d'erreur de lecture, on considère l'offre consommée (fail-safe :
  // on préfère envoyer vers Stripe que d'offrir un lead par erreur).
  if (error) return 0;
  return Math.max(0, FREE_UNLOCK_COUNT - (count || 0));
}

/**
 * Débloque un projet GRATUITEMENT (offre 2 premiers leads).
 * Retourne "granted" (ok), "already" (déjà débloqué — idempotent) ou "error".
 * L'alerte admin est envoyée en best-effort (tracée en console si échec),
 * mais TOUJOURS awaitée (leçon 24/05 : pas de promise détachée en Server Action).
 */
export async function grantFreeUnlock(
  service: SupabaseClient,
  opts: {
    proId: number;
    projectId: number;
    proName: string;
    vertical: "btp" | "tech";
    freeRemainingBefore: number;
  }
): Promise<"granted" | "already" | "error"> {
  const { error } = await service.from("lead_unlocks").insert({
    project_id: opts.projectId,
    pro_id: opts.proId,
    stripe_payment_intent_id: `free_${opts.proId}_${opts.projectId}`,
    stripe_checkout_session_id: null,
    amount_cents: 0,
    currency: "eur",
    paid_at: new Date().toISOString(),
  } as never);

  if (error) {
    // 23505 = UNIQUE violation → déjà débloqué (double-clic, replay) : idempotent.
    if (error.code === "23505") return "already";
    console.error("[free-unlock] insert error:", error.message);
    return "error";
  }

  // Notif admin (règle 28/04 : tout événement business critique notifie l'admin
  // dans le même commit). Best-effort : un échec d'email ne casse pas le déblocage.
  try {
    await sendFreeUnlockAlert({
      proId: opts.proId,
      proName: opts.proName,
      projectId: opts.projectId,
      vertical: opts.vertical,
      freeUsed: FREE_UNLOCK_COUNT - opts.freeRemainingBefore + 1,
      freeTotal: FREE_UNLOCK_COUNT,
    });
  } catch (e) {
    console.error("[free-unlock] admin alert failed:", e);
  }

  return "granted";
}
