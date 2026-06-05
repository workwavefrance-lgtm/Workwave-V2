/**
 * Broadcast email a TOUS les freelances tech inscrits quand un nouveau projet
 * est publie. Modele "communauté" (Codeur.com style) : tous les freelances
 * sont alertes en temps reel, Premium et gratuits.
 *
 * Le mail est identique pour tous. La differentiation se fait dans le
 * dashboard /ai/dashboard/projets :
 *   - Premium : voit les coordonnees + bouton "J'ai contacte"
 *   - Gratuit : voit le projet mais coordonnees floutees + CTA "Activer Premium"
 *
 * Volume : a 500 freelances inscrits et N projets/jour, on envoie 500N
 * mails/jour via Resend. Plan Resend Business 100€/mois = 100k mails/mois
 * suffit jusqu'a ~6 projets/jour. Au dela, batch via cron quotidien.
 *
 * Batching : on envoie par chunks de 50 emails en parallele pour respecter
 * le rate limit Resend (10 req/s). Promise.all par chunk, sleep 1s entre
 * chunks.
 */
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

let _resend: Resend | null = null;
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 14 categories acceptees Workwave AI (tech + business/creatif). On broadcast
// les projets a TOUS les freelances dans ces categories, sans distinction.
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
const CHUNK_SIZE = 50;
const CHUNK_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type BroadcastInput = {
  projectId: number;
  projectTitle: string;
  projectDescription: string;
  projectBudget: string | null;
  projectTimeline: string | null;
  projectCategoryName: string;
  isSuspicious: boolean;
};

export type BroadcastResult = {
  totalTargets: number;
  sent: number;
  failed: number;
  errors: string[];
};

/**
 * Construit le HTML de l'email (identique pour tous les destinataires).
 * Le firstName est laisse generique car on broadcast a tous.
 */
function buildEmailHtml(input: BroadcastInput, baseUrl: string): string {
  const previewDesc =
    input.projectDescription.length > 220
      ? input.projectDescription.slice(0, 220).trim() + "..."
      : input.projectDescription;

  const suspiciousBanner = input.isSuspicious
    ? `<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:12px 16px;margin:0 0 16px 0;">
        <p style="font-size:12px;color:#92400E;margin:0;font-weight:600;">
          &#9888; Projet flague par notre IA — verifiez les informations avant de contacter.
        </p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE AI &middot; NOUVEAU PROJET ]</p>

    <h1 style="font-size:24px;color:#0A0A0A;margin:0 0 8px 0;font-weight:800;letter-spacing:-0.02em;">Nouveau projet ${input.projectCategoryName}</h1>
    <p style="font-size:14px;color:#525252;line-height:1.6;margin:0 0 24px 0;">
      Un nouveau projet vient d&apos;etre publie sur Workwave AI. Connectez-vous a votre dashboard pour le consulter et y repondre.
    </p>

    ${suspiciousBanner}

    <div style="background:#FAFAFA;border-left:3px solid #FF6803;padding:20px;border-radius:8px;margin:0 0 24px 0;">
      <h2 style="font-size:18px;color:#0A0A0A;margin:0 0 12px 0;font-weight:700;">${input.projectTitle}</h2>
      <p style="font-size:13px;color:#525252;line-height:1.6;margin:0 0 16px 0;white-space:pre-wrap;">${previewDesc}</p>
      <table style="font-size:12px;width:100%;border-collapse:collapse;">
        ${input.projectBudget ? `<tr><td style="padding:4px 0;color:#999;width:90px;">Budget</td><td style="color:#0A0A0A;font-weight:600;">${input.projectBudget}</td></tr>` : ""}
        ${input.projectTimeline ? `<tr><td style="padding:4px 0;color:#999;">Delai</td><td style="color:#0A0A0A;font-weight:600;">${input.projectTimeline}</td></tr>` : ""}
      </table>
    </div>

    <a href="${baseUrl}/ai/dashboard/projets" style="display:inline-block;background:#FF6803;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:0 0 24px 0;">
      Voir le projet &rarr;
    </a>

    <p style="font-size:12px;color:#999;line-height:1.6;margin:24px 0 0 0;">
      Reponse au projet : reservee aux abonnes Premium (29,90&euro;/mois, sans engagement). <a href="${baseUrl}/ai/dashboard/abonnement" style="color:#FF6803;">Activer Premium</a>.
    </p>
    <p style="font-size:12px;color:#999;line-height:1.6;margin:8px 0 0 0;">
      Pour ne plus recevoir ces notifications, mettez votre profil en pause depuis votre <a href="${baseUrl}/ai/dashboard/preferences" style="color:#999;">dashboard</a>.
    </p>

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Workwave AI &middot; <a href="${baseUrl}/ai" style="color:#999;">workwave.fr/ai</a> &middot; projet #${input.projectId}
    </p>
  </div>
</body></html>`;
}

/**
 * Envoie le mail a un freelance unique. Retourne ok=true/false + error.
 */
async function sendOne(
  email: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [email],
      subject,
      html,
    });
    if (r.error) {
      return { ok: false, error: r.error.message || String(r.error) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Broadcast principal : selectionne TOUS les freelances AI actifs claimed
 * avec email, et envoie le mail en chunks de 50.
 *
 * Filtres durs :
 *   - category_id IN AI_CATEGORY_IDS = LES 14 categories AI (43-48 tech +
 *     79-87 business/creatif). Tout le monde recoit, pas seulement le tech
 *     (decision Willy 05/06 : "tout le monde doit recevoir").
 *   - claimed_by_user_id IS NOT NULL (compte active)
 *   - is_active = true
 *   - deleted_at IS NULL
 *   - email IS NOT NULL
 *   - paused_until IS NULL OR paused_until < NOW() (pas en pause)
 *   - source IN ('sirene', 'ai_signup') (whitelist legitime)
 */
export async function broadcastTechProject(
  input: BroadcastInput
): Promise<BroadcastResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const subject = `Nouveau projet ${input.projectCategoryName} — Workwave AI`;
  const html = buildEmailHtml(input, baseUrl);

  const sb = getServiceClient();
  const nowIso = new Date().toISOString();
  const { data: freelances, error: queryError } = await sb
    .from("pros")
    .select("id, email, name")
    .in("category_id", AI_CATEGORY_IDS)
    .in("source", ["sirene", "ai_signup"])
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null)
    .not("email", "is", null)
    .or(`paused_until.is.null,paused_until.lt.${nowIso}`);

  if (queryError) {
    console.error("[broadcastTechProject] query error:", queryError);
    return { totalTargets: 0, sent: 0, failed: 0, errors: [queryError.message] };
  }

  const targets = (freelances || []).filter(
    (f): f is { id: number; email: string; name: string } =>
      typeof f.email === "string" && f.email.length > 0
  );

  if (targets.length === 0) {
    return { totalTargets: 0, sent: 0, failed: 0, errors: [] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map((t) => sendOne(t.email, subject, html))
    );
    for (const r of results) {
      if (r.ok) {
        sent++;
      } else {
        failed++;
        if (errors.length < 10 && r.error) errors.push(r.error.slice(0, 200));
      }
    }
    // Sleep 1s entre chunks (respect rate limit Resend ~10 req/s)
    if (i + CHUNK_SIZE < targets.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  // Track le broadcast en BDD pour audit (count + dernier broadcast)
  await sb
    .from("projects")
    .update({
      broadcast_count: sent,
      broadcasted_at: new Date().toISOString(),
    })
    .eq("id", input.projectId);

  return { totalTargets: targets.length, sent, failed, errors };
}
