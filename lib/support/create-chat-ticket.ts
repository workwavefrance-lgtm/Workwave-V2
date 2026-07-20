/**
 * Ouverture d'un ticket depuis le chat de Léa.
 *
 * Pendant du canal email (ingestInboundEmailAsTicket), mais avec une contrainte
 * inversée : par email on CONNAÎT l'expéditeur, dans un chat public on ne sait
 * rien du visiteur. L'email est donc demandé dans la conversation et il est
 * OBLIGATOIRE ici — sans lui le ticket serait une impasse : la route de réponse
 * de l'admin refuse d'envoyer quand `requester_email` est vide, et personne ne
 * pourrait jamais répondre à la personne.
 */
import { createHash } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveContext, type SupportTicket } from "./tickets";

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Validation d'email volontairement simple : on écarte les saisies absurdes,
 *  on ne cherche pas à valider la RFC (un email valide mais inexistant passera
 *  de toute façon, seul l'envoi réel tranchera). */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export type ChatTicketInput = {
  email: string;
  name?: string | null;
  subject: string;
  /** Reformulation de la demande par Léa, à la première personne du visiteur. */
  resume: string;
  /** Fil de la conversation, déjà mis en forme par l'appelant. */
  transcript: string;
  /** Page depuis laquelle le visiteur écrit. */
  pathname?: string | null;
  /** Identifiant de conversation (UUID côté navigateur), clé d'idempotence. */
  conversationId: string;
};

export type ChatTicketResult = {
  ticketId: number;
  created: boolean;
  duplicate: boolean;
};

const MAX_SUBJECT = 120;
const MAX_RESUME = 2_000;
const MAX_TRANSCRIPT = 8_000;

export async function createTicketFromChat(
  input: ChatTicketInput
): Promise<ChatTicketResult | null> {
  const email = input.email.trim().toLowerCase();
  if (!looksLikeEmail(email)) return null;

  const sb = getServiceClient();
  const nowIso = new Date().toISOString();

  const subject = (input.subject || "").trim().slice(0, MAX_SUBJECT) || "Demande via le chat";
  const resume = (input.resume || "").trim().slice(0, MAX_RESUME) || "(demande vide)";
  const transcript = (input.transcript || "").slice(0, MAX_TRANSCRIPT);

  // Clé d'idempotence.
  //
  // On ne peut PAS se contenter de l'identifiant de conversation : un visiteur
  // peut légitimement escalader deux sujets différents dans le même échange, et
  // la deuxième demande serait alors rejetée comme un doublon — donc perdue.
  // On y ajoute une empreinte de la demande : deux demandes identiques dans la
  // même conversation sont un vrai doublon (double clic, reprise réseau), deux
  // demandes différentes n'en sont pas.
  const fingerprint = createHash("sha1").update(resume).digest("hex").slice(0, 12);
  const messageKey = `chat:${input.conversationId}:${fingerprint}`;

  // 1) Déjà enregistré ? (index unique sur email_message_id)
  {
    const { data: existing } = await sb
      .from("support_messages")
      .select("ticket_id")
      .eq("email_message_id", messageKey)
      .maybeSingle();
    if (existing) {
      return {
        ticketId: (existing as { ticket_id: number }).ticket_id,
        created: false,
        duplicate: true,
      };
    }
  }

  // 2) Threading : même règle que le canal email (match EXACT, jamais ilike —
  //    un '_' ou un '%' dans une adresse serait un joker et mélangerait deux
  //    clients). Un ticket CLOS n'est pas rouvert : on en crée un nouveau.
  let ticket: SupportTicket | null = null;
  {
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
  if (!ticket) {
    // resolveContext n'attache un pro que si le lien est CERTAIN (l'email n'est
    // pas unique dans `pros` : 32 % des fiches partagent leur adresse). On le
    // réutilise tel quel pour ne pas réintroduire la fuite corrigée le 20/07.
    const { proId, projectId } = await resolveContext(sb, email);
    const { data: inserted, error: insErr } = await sb
      .from("support_tickets")
      .insert({
        source: "chat",
        status: "open",
        subject,
        requester_email: email,
        requester_name: (input.name || "").trim().slice(0, 120) || null,
        pro_id: proId,
        project_id: projectId,
        last_message_at: nowIso,
      })
      .select("*")
      .single();
    if (insErr || !inserted) {
      console.error("[support/chat] création ticket échec:", insErr?.message);
      return null;
    }
    ticket = inserted as SupportTicket;
    created = true;
  }

  // 3) Message visible : la demande reformulée. C'est ce que l'admin lit en
  //    premier, et la seule chose sur laquelle tourne le brouillon IA.
  const { error: msgErr } = await sb.from("support_messages").insert({
    ticket_id: ticket.id,
    author_role: "client",
    body: resume,
    is_internal: false,
    email_message_id: messageKey,
  });
  if (msgErr) {
    if (created) {
      // Même précaution que le canal email : la clé étrangère est en cascade,
      // on ne supprime que si le ticket est réellement vide (un autre message
      // a pu s'y attacher entre-temps).
      const { data: siblings } = await sb
        .from("support_messages")
        .select("id")
        .eq("ticket_id", ticket.id)
        .limit(1);
      if (!siblings || siblings.length === 0) {
        await sb.from("support_tickets").delete().eq("id", ticket.id);
      }
    }
    if ((msgErr as { code?: string }).code === "23505") {
      const { data: owner } = await sb
        .from("support_messages")
        .select("ticket_id")
        .eq("email_message_id", messageKey)
        .maybeSingle();
      return {
        ticketId: (owner as { ticket_id: number } | null)?.ticket_id ?? ticket.id,
        created: false,
        duplicate: true,
      };
    }
    console.error("[support/chat] insert message échec:", msgErr.message);
    return null;
  }

  // 4) Note INTERNE : le fil de la conversation, pour que l'admin voie le
  //    contexte réel. is_internal = true n'est pas cosmétique : le brouillon IA
  //    exclut physiquement les notes internes, donc le texte écrit par le
  //    visiteur n'entre jamais dans le prompt de rédaction.
  //
  //    Uniquement à la CRÉATION du ticket. Un visiteur peut escalader deux
  //    sujets dans le même échange ; réécrire le fil à chaque fois empilerait
  //    des copies quasi identiques de plusieurs milliers de caractères dans le
  //    ticket — exactement ce qu'on vient de borner ailleurs. Les demandes
  //    suivantes s'ajoutent en messages visibles, qui se lisent à la suite.
  if (created) {
    const contextLine = input.pathname ? `Page : ${input.pathname}\n\n` : "";
    await sb.from("support_messages").insert({
      ticket_id: ticket.id,
      author_role: "ai",
      body: `Conversation avec Léa (assistante du site).\n${contextLine}${transcript}`,
      is_internal: true,
      email_message_id: null,
    });
  }

  // 5) Réactivation si le ticket dormait, et horodatage de la dernière activité.
  const update: Record<string, unknown> = { last_message_at: nowIso };
  if (!created && ticket.status !== "open") {
    update.status = "open";
    update.resolved_at = null;
    update.closed_at = null;
  }
  await sb.from("support_tickets").update(update).eq("id", ticket.id);

  return { ticketId: ticket.id, created, duplicate: false };
}
