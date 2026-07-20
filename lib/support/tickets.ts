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
export async function resolveContext(
  sb: SupabaseClient,
  email: string | null
): Promise<{ proId: number | null; projectId: number | null }> {
  if (!email) return { proId: null, projectId: null };
  let proId: number | null = null;
  let projectId: number | null = null;
  try {
    // Pro : on n'établit le lien QUE s'il est certain.
    //
    // POURQUOI : `pros.email` n'est PAS unique. Sur un échantillon de 28 137
    // fiches actives avec email (audit 20/07), 9 137 — soit 32 % — partagent
    // leur adresse avec au moins une autre fiche (jusqu'à 30 fiches sur une
    // seule adresse : e-mails de groupe type @equans.com, ou adresses de
    // service client aspirées par erreur lors de l'enrichissement Apify).
    // Prendre "la première" rattacherait à un pro sur trois l'entreprise d'un
    // TIERS : nom, ville et nombre de leads achetés s'afficheraient dans la
    // fiche du ticket, partiraient dans le prompt du brouillon IA, et
    // pourraient être envoyés par mail au mauvais destinataire (le motif exact
    // de la plainte RGPD MIROITERIE MELUSINE, mais par email cette fois).
    //
    // Règle : une seule fiche candidate -> lien sûr. Plusieurs fiches -> on ne
    // départage que si une seule est réclamée (compte réel, donc l'entreprise
    // s'est identifiée elle-même). Sinon pro_id reste null et l'admin tranche.
    const { data: pros } = await sb
      .from("pros")
      .select("id, claimed_by_user_id")
      .eq("email", email)
      .is("deleted_at", null)
      .limit(5);
    const candidates = (pros || []) as { id: number; claimed_by_user_id: string | null }[];
    if (candidates.length === 1) {
      proId = candidates[0].id;
    } else if (candidates.length > 1) {
      const claimed = candidates.filter((p) => p.claimed_by_user_id !== null);
      if (claimed.length === 1) proId = claimed[0].id;
      // sinon : ambigu -> on laisse null plutôt que d'afficher un tiers.
    }
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

  // Bornes de taille : un email entrant est une donnée NON MAÎTRISÉE. Un HTML
  // de plusieurs Mo (signature avec images en base64, mail généré) serait sinon
  // passé aux 11 regex globales de crudeStripHtml, stocké tel quel, puis
  // rechargé intégralement à chaque ouverture du ticket — le mécanisme exact
  // qui avait déjà mis l'egress Supabase à 188 % en juin.
  const MAX_HTML_CHARS = 200_000;
  const MAX_BODY_CHARS = 20_000;
  const rawBody =
    (input.text && input.text.trim()) ||
    (input.html && crudeStripHtml(input.html.slice(0, MAX_HTML_CHARS))) ||
    "(corps vide)";
  const body =
    rawBody.length > MAX_BODY_CHARS
      ? rawBody.slice(0, MAX_BODY_CHARS) + "\n\n[…] (message tronqué par Workwave)"
      : rawBody;
  // Le sujet alimente un index trigram et l'affichage : on le borne aussi.
  const subject = ((input.subject || "").trim() || null)?.slice(0, 500) || null;

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
      // On ne supprime le ticket QUE s'il est réellement vide.
      //
      // POURQUOI : la FK support_messages.ticket_id est ON DELETE CASCADE. Si
      // deux webhooks concurrents ont créé deux tickets pour le même
      // expéditeur, un second email a pu être rattaché à CE ticket entre notre
      // INSERT et notre rollback. Le supprimer à l'aveugle détruirait alors un
      // vrai email client, définitivement, sans la moindre trace — la fonction
      // renvoyant "duplicate: true" comme si tout allait bien.
      const { data: siblings } = await sb
        .from("support_messages")
        .select("id")
        .eq("ticket_id", ticket.id)
        .limit(1);
      if (!siblings || siblings.length === 0) {
        await sb.from("support_tickets").delete().eq("id", ticket.id);
      } else {
        console.error(
          `[support] rollback annulé : le ticket #${ticket.id} contient déjà un message`
        );
      }
    }
    if ((msgErr as { code?: string }).code === "23505") {
      // Cet email existe déjà en base (inséré par l'invocation concurrente) :
      // on retourne le ticket qui le porte VRAIMENT, pas celui qu'on vient
      // peut-être de supprimer.
      const { data: owner } = await sb
        .from("support_messages")
        .select("ticket_id")
        .eq("email_message_id", input.resendEmailId)
        .maybeSingle();
      const ownerId = (owner as { ticket_id: number } | null)?.ticket_id ?? ticket.id;
      return { ticketId: ownerId, created: false, reopened: false, duplicate: true };
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
