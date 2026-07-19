/**
 * Support maison — helper tickets.
 *
 * Cœur de la boîte de réception : transforme une demande (email entrant, chat
 * Léa escaladé, formulaire) en TICKET traçable + fil de messages, relié au pro
 * et au projet existants quand on peut les retrouver via l'email.
 *
 * Robustesse (exigence 1 -> 1M) :
 *   - IDEMPOTENT : dédup par `email_message_id` (id Resend de l'email). Un même
 *     email rejoué par le webhook ne crée jamais 2 messages. Défense en base
 *     (UNIQUE partiel) + catch 23505 côté code.
 *   - THREADING : un nouvel email d'un expéditeur regroupé dans son ticket
 *     ouvert/en attente le plus récent ; sinon nouveau ticket.
 *   - service_role (bypass RLS) — jamais appelé depuis un contexte client.
 *   - best-effort sur la résolution pro/projet : un échec ne bloque pas la
 *     création du ticket.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
export type SupportTicketSource = "email" | "chat" | "form" | "admin";
export type SupportAuthorRole = "client" | "pro" | "agent" | "ai" | "system";

export type SupportTicket = {
  id: number;
  source: SupportTicketSource;
  status: SupportTicketStatus;
  subject: string | null;
  requester_email: string | null;
  requester_name: string | null;
  pro_id: number | null;
  project_id: number | null;
  user_id: string | null;
  category: string | null;
  priority: "normal" | "urgent";
  is_legal: boolean;
  access_token: string | null;
  last_message_at: string;
  admin_notified_at: string | null;
  admin_notification_error: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  id: number;
  ticket_id: number;
  author_role: SupportAuthorRole;
  body: string;
  is_internal: boolean;
  email_message_id: string | null;
  created_at: string;
};

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Extrait { email, name } d'un "Prénom Nom <email@x.com>" ou "email@x.com". */
export function parseEmailFrom(raw: string): { email: string | null; name: string | null } {
  if (!raw) return { email: null, name: null };
  const m = raw.match(/<([^>]+)>/);
  if (m) {
    const name = raw.slice(0, m.index).trim().replace(/^"|"$/g, "").trim();
    return { email: m[1].trim().toLowerCase(), name: name || null };
  }
  const trimmed = raw.trim();
  return { email: /@/.test(trimmed) ? trimmed.toLowerCase() : null, name: null };
}

/** Retire grossièrement le HTML pour un fallback texte lisible (v1). */
function crudeStripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Résout (best-effort) le pro et le projet liés à un email, pour le contexte. */
async function resolveContext(
  sb: SupabaseClient,
  email: string | null
): Promise<{ proId: number | null; projectId: number | null }> {
  if (!email) return { proId: null, projectId: null };
  let proId: number | null = null;
  let projectId: number | null = null;
  try {
    // Pro : on préfère une fiche réclamée (compte réel) mais on accepte toute
    // fiche active portant cet email. nullsFirst:false => claimed d'abord.
    const { data: pro } = await sb
      .from("pros")
      .select("id, claimed_by_user_id")
      .eq("email", email)
      .is("deleted_at", null)
      .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (pro) proId = (pro as { id: number }).id;
  } catch {
    /* best-effort */
  }
  try {
    const { data: project } = await sb
      .from("projects")
      .select("id")
      .eq("email", email)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (project) projectId = (project as { id: number }).id;
  } catch {
    /* best-effort */
  }
  return { proId, projectId };
}

export type IngestEmailInput = {
  /** Identifiant unique de l'email côté Resend (clé d'idempotence). */
  resendEmailId: string;
  /** En-tête From brut ("Nom <email>"). */
  fromRaw: string;
  subject: string | null;
  text: string | null;
  html: string | null;
};

export type IngestEmailResult = {
  ticketId: number;
  created: boolean; // true = nouveau ticket, false = message ajouté à un ticket existant
  reopened: boolean; // true = un ticket résolu/fermé a été rouvert
  duplicate: boolean; // true = email déjà ingéré (idempotence), aucune écriture
};

/**
 * Ingère un email entrant en ticket. Idempotent sur `resendEmailId`.
 * Retourne null en cas d'échec dur (le webhook peut alors continuer son
 * forward Gmail sans planter).
 */
export async function ingestInboundEmailAsTicket(
  input: IngestEmailInput
): Promise<IngestEmailResult | null> {
  const sb = getServiceClient();
  const { email, name } = parseEmailFrom(input.fromRaw);
  const nowIso = new Date().toISOString();

  const body =
    (input.text && input.text.trim()) ||
    (input.html && crudeStripHtml(input.html)) ||
    "(corps vide)";
  const subject = (input.subject || "").trim() || null;

  // 1) Idempotence : cet email a-t-il déjà été ingéré ?
  {
    const { data: existing } = await sb
      .from("support_messages")
      .select("ticket_id")
      .eq("email_message_id", input.resendEmailId)
      .maybeSingle();
    if (existing) {
      return {
        ticketId: (existing as { ticket_id: number }).ticket_id,
        created: false,
        reopened: false,
        duplicate: true,
      };
    }
  }

  // 2) Threading : ticket NON-CLOS le plus récent de cet expéditeur.
  //    Match EXACT (.eq) : jamais ilike -> les '_' / '%' d'un email seraient des
  //    jokers LIKE (mauvais fil + fuite PII inter-clients). requester_email est
  //    toujours stocké en minuscules (parseEmailFrom). On rattache à open/pending
  //    /resolved (resolved -> réactivé au step 5) ; un ticket CLOS = nouveau ticket.
  let ticket: SupportTicket | null = null;
  if (email) {
    const { data: openTicket } = await sb
      .from("support_tickets")
      .select("*")
      .eq("requester_email", email)
      .in("status", ["open", "pending", "resolved"])
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (openTicket) ticket = openTicket as SupportTicket;
  }

  let created = false;
  let reopened = false;

  // 3) Sinon : nouveau ticket (avec contexte pro/projet résolu).
  if (!ticket) {
    const { proId, projectId } = await resolveContext(sb, email);
    const { data: inserted, error: insErr } = await sb
      .from("support_tickets")
      .insert({
        source: "email",
        status: "open",
        subject,
        requester_email: email,
        requester_name: name,
        pro_id: proId,
        project_id: projectId,
        last_message_at: nowIso,
      })
      .select("*")
      .single();
    if (insErr || !inserted) {
      console.error("[support] création ticket échec:", insErr?.message);
      return null;
    }
    ticket = inserted as SupportTicket;
    created = true;
  }

  // 4) Ajoute le message. Échec 23505 = un autre webhook a inséré CE MÊME email
  //    en parallèle (idempotence niveau base). Si on venait de CRÉER le ticket
  //    dans cette invocation, il est orphelin (0 message) -> on le supprime pour
  //    ne pas polluer la file "Ouverts".
  const { error: msgErr } = await sb.from("support_messages").insert({
    ticket_id: ticket.id,
    author_role: "client",
    body,
    is_internal: false,
    email_message_id: input.resendEmailId,
  });
  if (msgErr) {
    if (created) {
      await sb.from("support_tickets").delete().eq("id", ticket.id);
    }
    if ((msgErr as { code?: string }).code === "23505") {
      return { ticketId: ticket.id, created: false, reopened: false, duplicate: true };
    }
    console.error("[support] insert message échec:", msgErr.message);
    return null;
  }

  // 5) Met à jour le ticket : dernière activité + RÉACTIVATION. Tout message
  //    client remet un ticket non-ouvert dans la file "Ouverts" (pending -> open :
  //    le client a répondu, balle dans notre camp ; resolved -> open + efface les
  //    horodatages de résolution/fermeture obsolètes).
  const update: Record<string, unknown> = { last_message_at: nowIso };
  if (!created && ticket.status !== "open") {
    update.status = "open";
    update.resolved_at = null;
    update.closed_at = null;
    reopened = true;
  }
  const { error: updErr } = await sb
    .from("support_tickets")
    .update(update)
    .eq("id", ticket.id);
  if (updErr) {
    console.error("[support] update ticket (étape 5) échec:", updErr.message);
  }

  return { ticketId: ticket.id, created, reopened, duplicate: false };
}

/**
 * Marque un ticket comme "admin notifié" (audit-trail, jamais de perte
 * silencieuse). Pour les tickets email, la notification est le forward Gmail
 * de la route inbound : on l'enregistre ici une fois le forward réussi.
 * N'écrase pas une valeur déjà posée (idempotent).
 */
export async function markTicketAdminNotified(ticketId: number): Promise<void> {
  const sb = getServiceClient();
  await sb
    .from("support_tickets")
    .update({ admin_notified_at: new Date().toISOString() })
    .eq("id", ticketId)
    .is("admin_notified_at", null);
}

/**
 * Applique le résultat du tri IA (catégorie / urgence / flag légal) à un ticket.
 * Best-effort : un échec ne remet jamais en cause le ticket lui-même.
 */
export async function updateTicketTriage(
  ticketId: number,
  triage: { category: string; priority: "normal" | "urgent"; isLegal: boolean }
): Promise<void> {
  const sb = getServiceClient();
  const { error } = await sb
    .from("support_tickets")
    .update({
      category: triage.category,
      priority: triage.priority,
      is_legal: triage.isLegal,
    })
    .eq("id", ticketId);
  if (error) {
    console.error("[support] update tri échec :", error.message);
  }
}
