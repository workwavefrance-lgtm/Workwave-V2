import { emailContent, renderEmail, escapeEmail, emailParagraph, emailButton, emailDetails } from "@/lib/email/design";

/**
 * Broadcast email a TOUS les freelances tech inscrits quand un nouveau projet
 * est publie. Modele pay-per-lead : tous les freelances sont alertes en temps
 * reel. Pour voir les coordonnees du client et le contacter, ils debloquent
 * le projet a 9,90 EUR depuis leur dashboard /ai/dashboard/projets.
 * Pas d'abonnement, sans engagement.
 *
 * Le mail est identique pour tous les destinataires.
 *
 * Volume : a 500 freelances inscrits et N projets/jour, on envoie 500N
 * mails/jour via Resend. Plan Resend Business 100€/mois = 100k mails/mois
 * suffit jusqu'a ~6 projets/jour. Au dela, batch via cron quotidien.
 *
 * Envois par deux, espacés d'une seconde. Le journal par destinataire
 * permet la reprise si le fournisseur refuse malgré tout un pic de débit.
 */
import { Resend } from "resend";
import { createDeliveryStore, deliverProjectEmail, type ProjectEmail } from "./project-delivery";

let _resend: Resend | null = null;
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// 14 categories acceptees Workwave AI (tech + business/creatif). On broadcast
// les projets a TOUS les freelances dans ces categories, sans distinction.
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { getServiceClient } from "@/lib/supabase/service-client";
const CHUNK_SIZE = 2;
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
export function buildEmailHtml(input: BroadcastInput, baseUrl: string): string {

  return renderEmail({
    title: "Un nouveau projet.", subtitle: "À découvrir selon votre expertise.", category: "Workwave AI",
    body: emailParagraph("Une nouvelle demande a été publiée. Retrouvez les informations dans votre espace pour décider si elle correspond à votre expertise et à vos disponibilités.")
      + emailDetails([["Catégorie", input.projectCategoryName], ...(input.projectBudget ? [["Budget", input.projectBudget] as [string, unknown]] : []), ...(input.projectTimeline ? [["Délai", input.projectTimeline] as [string, unknown]] : [])])
      + (input.isSuspicious ? emailParagraph("Cette demande présente un signal à vérifier avant de débloquer les coordonnées.") : "")
      + emailButton("Consulter le projet", `${baseUrl}/ai/dashboard/projets`)
      + emailParagraph("Consultez le tarif et les éventuelles offres disponibles dans votre espace avant de débloquer les coordonnées. Sans abonnement ni engagement.")
      + `<p style="font-size:12px;line-height:1.7"><a style="color:#596670" href="${escapeEmail(`${escapeEmail(baseUrl)}/ai/dashboard/preferences`)}">Gérer mes notifications</a></p>`,
  });
}

/**
 * Envoie le mail a un freelance unique. Retourne ok=true/false + error.
 */
async function sendOne(
  email: ProjectEmail,
  idempotencyKey: string
): Promise<{ id: string }> {
  const r = await getResendClient().emails.send({
    from: "Workwave AI <contact@workwave.fr>",
    to: [email.recipient_email],
    subject: email.subject,
    ...emailContent(email.html),
  }, { idempotencyKey });
  if (r.error || !r.data?.id) throw new Error(r.error?.message || "Resend : réponse sans identifiant");
  return { id: r.data.id };
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
  const subject = `Nouveau projet ${input.projectCategoryName} · Workwave AI`;
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
    .eq("do_not_contact", false)
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
  let newlyConfirmed = 0;
  let failed = 0;
  const errors: string[] = [];
  const deliveryStore = createDeliveryStore(sb);

  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map((t) => deliverProjectEmail(deliveryStore, sendOne, {
        project_id: input.projectId, pro_id: t.id, kind: "initial",
        recipient_email: t.email, subject, html,
      }))
    );
    for (const r of results) {
      if (r.ok) {
        sent++;
        if (!r.reused) newlyConfirmed++;
      } else {
        failed++;
        if (errors.length < 10 && r.error) errors.push(r.error.slice(0, 200));
      }
    }
    // Pause entre groupes pour borner le débit du flux.
    if (i + CHUNK_SIZE < targets.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  // Track le broadcast en BDD pour audit (count + dernier broadcast)
  const { count: confirmedCount, error: countError } = await sb.from("project_email_deliveries")
    .select("pro_id", { count: "exact", head: true })
    .eq("project_id", input.projectId).eq("kind", "initial").not("sent_at", "is", null);
  if (countError) throw new Error(countError.message);
  const { error: updateError } = await sb
    .from("projects")
    .update({
      broadcast_count: confirmedCount ?? 0,
      ...(failed === 0 && sent > 0 ? { broadcasted_at: new Date().toISOString() } : {}),
    })
    .eq("id", input.projectId);
  if (updateError) throw new Error(updateError.message);

  return { totalTargets: targets.length, sent: newlyConfirmed, failed, errors };
}
