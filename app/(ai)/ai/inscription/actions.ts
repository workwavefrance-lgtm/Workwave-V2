"use server";

import { redirect } from "next/navigation";

/**
 * STUB Phase 7 : le backend inscription freelance (Supabase Auth +
 * creation de pro + setup Stripe Premium) est en attente Phase 8.
 *
 * En attendant, ce Server Action existe juste pour eviter le HTTP 405
 * sur POST /ai/inscription (QA agent finding P1 du 25/05/2026).
 *
 * Comportement : ignore les donnees entrees, redirige vers /ai avec
 * ?soon=signup que la page peut detecter pour afficher une banner.
 *
 * A remplacer en Phase 8 par : magic link + creation de compte +
 * checkout Stripe pour le plan Premium 29,90€/mois (optionnel).
 */
export async function submitInscriptionStub(_formData: FormData): Promise<void> {
  redirect("/ai?soon=signup");
}
