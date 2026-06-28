/**
 * Emails pour signup freelance Workwave AI :
 *   - sendAiSignupAdminNotification : admin recoit le profil avec toutes les data
 *   - sendAiSignupWelcome : user recoit confirmation "Inscription enregistree, on previent des l'ouverture"
 *
 * Tracking en BDD via ai_signups.admin_notified_at + welcome_sent_at.
 */
import { Resend } from "resend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

let _sb: SupabaseClient | null = null;
function getServiceClient() {
  if (!_sb) {
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _sb;
}

export type SignupData = {
  signupId: number;
  firstName: string;
  lastName: string;
  email: string;
  github: string | null;
  linkedin: string | null;
  categoryName: string;
  categorySlug: string;
  skills: string | null;
  bio: string | null;
  tjm: number | null;
  experienceYears: number | null;
  availability: string | null;
  location: string | null;
  plan: "free" | "premium";
};

const PLAN_LABELS = {
  free: "Gratuit (profil visible, reception des projets par email)",
  premium: "Gratuit (profil visible, reception des projets par email)",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  remote: "100% remote",
  hybrid: "Hybride (remote + bureau)",
  onsite: "Sur site uniquement",
};

// ─── ADMIN NOTIFICATION ─────────────────────────────────────────────────
export async function sendAiSignupAdminNotification(data: SignupData): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const adminEmail = "workwave.france@gmail.com";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ AI · NEW SIGNUP ]</p>

    <h1 style="font-size:22px;color:#0A0A0A;margin:0 0 8px 0;font-weight:800;letter-spacing:-0.02em;">${data.firstName} ${data.lastName}</h1>
    <p style="font-size:14px;color:#525252;margin:0 0 24px 0;">Categorie : <strong>${data.categoryName}</strong> · Plan : <strong>Gratuit (pay-per-lead 9,90€)</strong></p>

    <h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Identite :</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#999;width:130px;">Email</td><td style="color:#0A0A0A;"><a href="mailto:${data.email}" style="color:#FF6803;">${data.email}</a></td></tr>
      ${data.github ? `<tr><td style="padding:4px 0;color:#999;">GitHub</td><td style="color:#0A0A0A;"><a href="https://github.com/${data.github}" style="color:#FF6803;font-family:'SF Mono',Menlo,monospace;">@${data.github}</a></td></tr>` : ""}
      ${data.linkedin ? `<tr><td style="padding:4px 0;color:#999;">LinkedIn</td><td style="color:#0A0A0A;"><a href="${data.linkedin}" style="color:#FF6803;">${data.linkedin}</a></td></tr>` : ""}
      ${data.location ? `<tr><td style="padding:4px 0;color:#999;">Localisation</td><td style="color:#0A0A0A;">${data.location}</td></tr>` : ""}
    </table>

    <h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Profil pro :</h3>
    ${data.bio ? `<p style="font-size:13px;color:#0A0A0A;line-height:1.6;background:#FAFAFA;padding:12px;border-radius:8px;border-left:3px solid #FF6803;white-space:pre-wrap;margin:0 0 12px 0;">${data.bio}</p>` : ""}
    <table style="font-size:13px;width:100%;border-collapse:collapse;">
      ${data.skills ? `<tr><td style="padding:4px 0;color:#999;width:130px;">Skills</td><td style="color:#0A0A0A;">${data.skills}</td></tr>` : ""}
      ${data.tjm ? `<tr><td style="padding:4px 0;color:#999;">TJM indicatif</td><td style="color:#0A0A0A;font-family:'SF Mono',Menlo,monospace;">${data.tjm} €/jour</td></tr>` : ""}
      ${data.experienceYears != null ? `<tr><td style="padding:4px 0;color:#999;">Experience</td><td style="color:#0A0A0A;">${data.experienceYears} ans</td></tr>` : ""}
      ${data.availability ? `<tr><td style="padding:4px 0;color:#999;">Disponibilite</td><td style="color:#0A0A0A;">${AVAILABILITY_LABELS[data.availability] || data.availability}</td></tr>` : ""}
      <tr><td style="padding:4px 0;color:#999;">Plan choisi</td><td style="color:#0A0A0A;"><strong>${PLAN_LABELS[data.plan]}</strong></td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Workwave AI · signup #${data.signupId} · <a href="${baseUrl}/admin" style="color:#999;">Admin Dashboard</a>
    </p>
  </div>
</body></html>`;

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [adminEmail],
      replyTo: data.email,
      subject: `[AI Signup] ${data.firstName} ${data.lastName} — ${data.categoryName} (${data.plan})`,
      html,
    });
    if (r.error) {
      console.error("[sendAiSignupAdminNotification] Resend error:", r.error);
      await getServiceClient().from("ai_signups").update({
        admin_notification_error: r.error.message || String(r.error),
      }).eq("id", data.signupId);
      return;
    }
    await getServiceClient().from("ai_signups").update({
      admin_notified_at: new Date().toISOString(),
      admin_notification_error: null,
    }).eq("id", data.signupId);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendAiSignupAdminNotification] exception:", msg);
    await getServiceClient().from("ai_signups").update({
      admin_notification_error: msg,
    }).eq("id", data.signupId);
  }
}

// ─── WELCOME USER ─────────────────────────────────────────────────────────
export async function sendAiSignupWelcome(
  data: SignupData,
  locale: Locale = "fr"
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  // Variante EN : pointe vers le tunnel anglais sur le gTLD workwaveai.co,
  // pay-per-lead uniquement. Le freelance US recoit un mail anglais.
  if (locale === "en") {
    const aiBase = "https://www.workwaveai.co/en/ai";
    const enHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE AI ]</p>
    <h1 style="font-size:26px;color:#0A0A0A;margin:0 0 12px 0;font-weight:800;letter-spacing:-0.02em;">Welcome, ${data.firstName}!</h1>
    <p style="font-size:15px;color:#525252;line-height:1.6;margin:0 0 24px 0;">Your freelance <strong>${data.categoryName}</strong> account on Workwave AI is live. As soon as a project is posted, you get an email in real time. Community model: every freelancer sees every project, you pick the ones you want.</p>
    <h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Your profile:</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse;background:#FAFAFA;padding:16px;border-radius:8px;">
      <tr><td style="padding:6px 12px;color:#999;width:160px;">Email</td><td style="color:#0A0A0A;padding:6px 0;">${data.email}</td></tr>
      <tr><td style="padding:6px 12px;color:#999;">Category</td><td style="color:#0A0A0A;padding:6px 0;">${data.categoryName}</td></tr>
      ${data.tjm ? `<tr><td style="padding:6px 12px;color:#999;">Indicative day rate</td><td style="color:#0A0A0A;padding:6px 0;font-family:'SF Mono',Menlo,monospace;">${data.tjm}/day</td></tr>` : ""}
      <tr><td style="padding:6px 12px;color:#999;">Plan</td><td style="color:#0A0A0A;padding:6px 0;"><strong>Free (profile visible, $0/mo)</strong></td></tr>
    </table>
    <h3 style="font-size:14px;color:#525252;margin:32px 0 12px 0;">Next steps:</h3>
    <ol style="font-size:14px;color:#525252;line-height:1.7;padding-left:20px;margin:0 0 24px 0;">
      <li>Sign in to your dashboard at <a href="${aiBase}/connexion" style="color:#FF6803;">workwaveai.co/en/ai</a> (6-digit code sent by email)</li>
      <li>Complete your profile (bio, stack, GitHub, LinkedIn) to stand out</li>
      <li>You will receive every matching project by email in real time</li>
    </ol>
    <div style="text-align:center;margin:32px 0;">
      <a href="${aiBase}/connexion" style="display:inline-block;background:#FF6803;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Go to my dashboard &rarr;</a>
    </div>
    <p style="font-size:13px;color:#525252;line-height:1.6;margin:24px 0 0 0;">A question? Just reply to this email, we're on the other end.</p>
    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">Workwave AI · <a href="${aiBase}" style="color:#999;">workwaveai.co</a></p>
  </div>
</body></html>`;
    try {
      const r = await getResendClient().emails.send({
        from: "Workwave AI <contact@workwave.fr>",
        to: [data.email],
        subject: `Welcome to Workwave AI, ${data.firstName}!`,
        html: enHtml,
      });
      if (r.error) {
        console.error("[sendAiSignupWelcome EN] Resend error:", r.error);
        return;
      }
      await getServiceClient().from("ai_signups").update({
        welcome_sent_at: new Date().toISOString(),
      }).eq("id", data.signupId);
    } catch (e: unknown) {
      console.error("[sendAiSignupWelcome EN] exception:", e);
    }
    return;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE AI ]</p>

    <h1 style="font-size:26px;color:#0A0A0A;margin:0 0 12px 0;font-weight:800;letter-spacing:-0.02em;">Bienvenue ${data.firstName} !</h1>
    <p style="font-size:15px;color:#525252;line-height:1.6;margin:0 0 24px 0;">Votre compte freelance <strong>${data.categoryName}</strong> sur Workwave AI est actif. Des qu&rsquo;un projet tech est publie, vous recevez un email en temps reel. Modele communaute : tous les freelances voient tous les projets, vous choisissez ceux qui vous interessent.</p>

    <h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Recap de votre profil :</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse;background:#FAFAFA;padding:16px;border-radius:8px;">
      <tr><td style="padding:6px 12px;color:#999;width:140px;">Email</td><td style="color:#0A0A0A;padding:6px 0;">${data.email}</td></tr>
      <tr><td style="padding:6px 12px;color:#999;">Categorie</td><td style="color:#0A0A0A;padding:6px 0;">${data.categoryName}</td></tr>
      ${data.tjm ? `<tr><td style="padding:6px 12px;color:#999;">TJM indicatif</td><td style="color:#0A0A0A;padding:6px 0;font-family:'SF Mono',Menlo,monospace;">${data.tjm} €/jour</td></tr>` : ""}
      <tr><td style="padding:6px 12px;color:#999;">Plan</td><td style="color:#0A0A0A;padding:6px 0;"><strong>${PLAN_LABELS[data.plan]}</strong></td></tr>
    </table>

    <h3 style="font-size:14px;color:#525252;margin:32px 0 12px 0;">Prochaines etapes :</h3>
    <ol style="font-size:14px;color:#525252;line-height:1.7;padding-left:20px;margin:0 0 24px 0;">
      <li>Connectez-vous a votre dashboard via <a href="${baseUrl}/ai/connexion" style="color:#FF6803;">workwave.fr/ai/connexion</a> (code a 6 chiffres envoye par mail)</li>
      <li>Completez votre profil (bio, stack, GitHub, LinkedIn) pour gagner des badges</li>
      <li>Vous recevez par mail chaque projet tech publie en temps reel. Debloque ceux qui vous interessent a 9,90€ l&rsquo;unite pour voir les coordonnees du client et le contacter.</li>
    </ol>

    <div style="text-align:center;margin:32px 0;">
      <a href="${baseUrl}/ai/connexion" style="display:inline-block;background:#FF6803;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Acceder a mon dashboard &rarr;
      </a>
    </div>

    <p style="font-size:13px;color:#525252;line-height:1.6;margin:24px 0 0 0;">
      Une question ? Repondez directement a ce mail, on est sur l&rsquo;autre bout.
    </p>

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Workwave AI · <a href="${baseUrl}/ai" style="color:#999;">workwave.fr/ai</a>
    </p>
  </div>
</body></html>`;

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [data.email],
      subject: `Bienvenue sur Workwave AI, ${data.firstName} !`,
      html,
    });
    if (r.error) {
      console.error("[sendAiSignupWelcome] Resend error:", r.error);
      return;
    }
    await getServiceClient().from("ai_signups").update({
      welcome_sent_at: new Date().toISOString(),
    }).eq("id", data.signupId);
  } catch (e: unknown) {
    console.error("[sendAiSignupWelcome] exception:", e);
  }
}
