"use server";

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

/**
 * Server Action /ai/connexion :
 *   1. Valide email
 *   2. Check si l'email existe dans ai_signups (status pending/validated)
 *      ou dans pros (compte deja active Phase 8+)
 *   3. Si trouve : envoie email "Compte pas encore actif" avec timeline
 *   4. Si pas trouve : envoie email "Compte introuvable, voulez-vous
 *      vous inscrire ?"
 *   5. Redirect vers /ai/connexion/succes?email=...
 *
 * Phase 8 viendra ajouter : magic link Supabase Auth pour login reel.
 */

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function submitConnexion(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    redirect("/ai/connexion?error=invalid_email");
  }

  const sb = getServiceClient();

  // Check signup
  const { data: signup } = await sb
    .from("ai_signups")
    .select("id, first_name, status")
    .eq("email", email)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  let subject: string;
  let html: string;

  if (signup) {
    if (signup.status === "validated") {
      subject = "Connexion Workwave AI — votre acces";
      html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#F7F7F7;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px 0;">Bonjour ${signup.first_name},</h1>
    <p style="font-size:14px;line-height:1.6;color:#525252;">Votre compte Workwave AI est valide. La connexion sera disponible des l'ouverture du dashboard freelance (Phase 8 — bientot).</p>
    <p style="font-size:13px;color:#999;margin-top:24px;">Une question ? Repondez a ce mail.</p>
  </div>
</body></html>`;
    } else {
      subject = "Workwave AI — votre inscription est enregistree";
      html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#F7F7F7;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px 0;">Bonjour ${signup.first_name},</h1>
    <p style="font-size:14px;line-height:1.6;color:#525252;">Votre inscription Workwave AI est bien enregistree. Vous etes parmi les premiers freelances de la plateforme — le dashboard freelance ouvre tres bientot et vous recevrez les instructions de connexion par mail des l'ouverture.</p>
    <p style="font-size:13px;color:#999;margin-top:24px;">Une question ? Repondez a ce mail.</p>
  </div>
</body></html>`;
    }
  } else {
    subject = "Workwave AI — compte introuvable";
    html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#F7F7F7;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px 0;">Compte introuvable</h1>
    <p style="font-size:14px;line-height:1.6;color:#525252;">Aucun compte Workwave AI n'est associe a cette adresse email (${email}).</p>
    <p style="font-size:14px;line-height:1.6;color:#525252;margin-top:16px;">Voulez-vous <a href="${baseUrl}/ai/inscription" style="color:#FF6803;font-weight:600;">creer un compte freelance</a> ?</p>
  </div>
</body></html>`;
  }

  // Send email (best effort, ne bloque pas le redirect)
  try {
    await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [email],
      subject,
      html,
    });
  } catch (e) {
    console.error("[submitConnexion] email error:", e);
  }

  redirect(`/ai/connexion/succes?email=${encodeURIComponent(email)}`);
}
