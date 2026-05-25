"use server";

import { redirect } from "next/navigation";

/**
 * STUB Phase 7 : le backend auth (Supabase magic link) est en attente
 * Phase 8 (modele Premium Stripe + creation de compte freelance).
 *
 * En attendant, ce Server Action existe juste pour eviter le HTTP 405
 * sur POST /ai/connexion (QA agent finding P1 du 25/05/2026).
 *
 * Comportement : ignore l'email entre, redirige vers /ai avec un
 * query param ?soon=login que la page peut detecter pour afficher une
 * banner "Connexion bientot disponible".
 *
 * A remplacer en Phase 8 par : magic link Resend + Supabase Auth.
 */
export async function submitConnexionStub(_formData: FormData): Promise<void> {
  redirect("/ai?soon=login");
}
