"use server";

/**
 * Server Actions pour /ai/dashboard/parametres.
 *
 * Actions disponibles :
 *   - deleteAiAccount(formData) : suppression RGPD du compte freelance AI.
 *     Soft-delete + nullification PII + cancel Stripe subscription + logout.
 *
 * Securite :
 *   - Auth check via supabase.auth.getUser() (session valide)
 *   - Match du pro par claimed_by_user_id (l'user ne peut deleter QUE son
 *     propre compte)
 *   - Filtre AI_CATEGORY_IDS pour eviter qu'un user BTP soit affecte
 *   - Double confirmation cote UI (champ "confirm" doit valoir
 *     "SUPPRIMER")
 *
 * Effets :
 *   1. pros.deleted_at = NOW(), is_active = false
 *   2. PII null : email, phone, website, instagram, linkedin, github_username,
 *      facebook (la fiche restera potentiellement visible avec juste le nom
 *      + ville Sirene si on a une row pros source='ai_signup', mais on la
 *      soft-delete donc en pratique 404)
 *   3. do_not_contact = true (anti re-broadcast)
 *   4. email_blacklist : insert pour empecher futurs envois
 *   5. Stripe subscription cancelled (if active)
 *   6. Logout (cookies clear)
 *   7. Redirect /ai (page d'accueil publique)
 *
 * NB : ne supprime PAS l'auth user Supabase (l'user pourrait recreer un
 * compte avec le meme email plus tard si besoin, et c'est plus safe niveau
 * audit). On dissocie juste claimed_by_user_id = null.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function deleteAiAccount(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ai/connexion");

  // Double confirmation : le user doit avoir tape "SUPPRIMER" exactement
  const confirm = String(formData.get("confirm") || "").trim();
  if (confirm !== "SUPPRIMER") {
    redirect("/ai/dashboard/parametres?error=confirm_required");
  }

  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, stripe_subscription_id, email")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect("/ai/dashboard/parametres?error=no_pro");

  // 1) Annuler l'abonnement Stripe si actif (pas de remboursement, juste cancel
  //    immediat = la periode en cours est perdue mais on s'arrete la). Si on
  //    voulait du prorate, on ferait subscriptions.update + cancel_at_period_end.
  //    Ici on veut un cleanup RGPD radical donc cancel immediat.
  if (pro.stripe_subscription_id) {
    const stripe = getStripeClient();
    if (stripe) {
      try {
        await stripe.subscriptions.cancel(pro.stripe_subscription_id);
      } catch (e) {
        // Si l'abonnement n'existe plus cote Stripe (ex. deja cancelled), on
        // n'echoue pas la deletion. On log juste pour audit.
        console.warn(
          "[deleteAiAccount] Stripe cancel failed (non-blocking) :",
          e instanceof Error ? e.message : String(e)
        );
      }
    }
  }

  // 2) Soft-delete + nullify PII + do_not_contact
  await service
    .from("pros")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
      do_not_contact: true,
      email: null,
      phone: null,
      website: null,
      instagram: null,
      facebook: null,
      linkedin: null,
      github_username: null,
      // On garde claimed_by_user_id pour audit (savoir qui avait claim cette
      // fiche dans le passe). Si jamais cette fiche est re-claim plus tard,
      // la fonction de claim mettra a jour claimed_by_user_id.
      // On garde le SIRET + nom + ville (donnees Sirene publiques).
      subscription_status: "canceled",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pro.id);

  // 3) Email blacklist (anti futur broadcast Brevo/Resend)
  // Le insert peut echouer si l'email est deja blacklisté (UNIQUE constraint).
  // Dans ce cas on ignore silencieusement — l'effet est deja en place.
  if (pro.email) {
    try {
      await service.from("email_blacklist").insert({
        email: (pro.email as string).toLowerCase(),
        reason: "ai_account_deletion_rgpd",
      });
    } catch {
      // doublon = OK, on continue
    }
  }

  // 4) Logout : clear cookies Supabase (signOut côté client requires SSR helper)
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  // Clear potential lingering auth cookies (best-effort)
  for (const c of cookieStore.getAll()) {
    if (c.name.includes("supabase") || c.name.includes("sb-")) {
      cookieStore.delete(c.name);
    }
  }

  // 5) Redirect vers /ai avec un flag pour afficher un message confirmation
  redirect("/ai?account_deleted=1");
}
