import type { SupabaseClient } from "@supabase/supabase-js";

export type DeliveryKind = "initial" | "j1" | "j3";
export type ProjectEmail = {
  project_id: number;
  pro_id: number;
  kind: DeliveryKind;
  recipient_email: string;
  subject: string;
  html: string;
};
export type Delivery = ProjectEmail & {
  first_attempt_at: string;
  sent_at: string | null;
  provider_id: string | null;
};
export interface DeliveryStore {
  prepare(email: ProjectEmail, now: string): Promise<Delivery>;
  markSent(delivery: Delivery, providerId: string, now: string): Promise<void>;
  markError(delivery: Delivery, reason: string): Promise<void>;
}
export type ProjectEmailSender = (
  email: ProjectEmail,
  idempotencyKey: string
) => Promise<{ id: string }>;

export function deliveryKind(input: { relanceKind?: "j1" | "j3"; isRelance?: boolean }): DeliveryKind {
  return input.relanceKind ?? (input.isRelance ? "j3" : "initial");
}

// Resend conserve les clés 24 h. Une marge d'une heure évite de franchir la
// limite pendant un appel lent. Après, un résultat incertain exige une revue.
const SAFE_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;

export async function deliverProjectEmail(
  store: DeliveryStore,
  send: ProjectEmailSender,
  email: ProjectEmail,
  now: () => Date = () => new Date()
): Promise<{ ok: true; reused: boolean; sentAt: string } | { ok: false; error: string }> {
  let delivery: Delivery | undefined;
  try {
    // La contrainte primaire choisit le payload du premier appel concurrent.
    delivery = await store.prepare(email, now().toISOString());
    if (delivery.sent_at) return { ok: true, reused: true, sentAt: delivery.sent_at };
    const age = now().getTime() - new Date(delivery.first_attempt_at).getTime();
    if (!Number.isFinite(age) || age >= SAFE_RETRY_WINDOW_MS) {
      throw new Error("delivery_needs_review: résultat non confirmé avant expiration de la clé Resend");
    }
    if (delivery.recipient_email !== email.recipient_email) {
      throw new Error("delivery_needs_review: adresse destinataire modifiée pendant la reprise");
    }
    const key = `workwave-project/${email.project_id}/${email.pro_id}/${email.kind}`;
    const result = await send(delivery, key);
    if (!result.id) throw new Error("Resend n'a pas confirmé d'identifiant d'envoi");
    const sentAt = now().toISOString();
    await store.markSent(delivery, result.id, sentAt);
    return { ok: true, reused: false, sentAt };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (delivery) {
      try { await store.markError(delivery, reason.slice(0, 500)); }
      catch { /* L'erreur remonte au broadcast même si son journal est indisponible. */ }
    }
    return { ok: false, error: reason };
  }
}

export function createDeliveryStore(sb: SupabaseClient): DeliveryStore {
  return {
    async prepare(email, now) {
      const { error } = await sb.from("project_email_deliveries").upsert(
        { ...email, first_attempt_at: now },
        { onConflict: "project_id,pro_id,kind", ignoreDuplicates: true }
      );
      if (error) throw new Error(`Journal de diffusion indisponible : ${error.message}`);
      const { data, error: readError } = await sb.from("project_email_deliveries")
        .select("*")
        .eq("project_id", email.project_id).eq("pro_id", email.pro_id).eq("kind", email.kind)
        .single();
      if (readError || !data) throw new Error(`Lecture diffusion impossible : ${readError?.message ?? "ligne absente"}`);
      return data as Delivery;
    },
    async markSent(delivery, providerId, now) {
      const { error } = await sb.from("project_email_deliveries")
        .update({
          sent_at: now, provider_id: providerId, last_error: null,
          // Une confirmation persistée suffit : plus besoin du corps de mail.
          recipient_email: "", subject: "", html: "",
        })
        .eq("project_id", delivery.project_id).eq("pro_id", delivery.pro_id).eq("kind", delivery.kind);
      if (error) throw new Error(`Confirmation de diffusion non sauvegardée : ${error.message}`);
    },
    async markError(delivery, reason) {
      const { error } = await sb.from("project_email_deliveries")
        .update({
          last_error: reason,
          ...(reason.startsWith("delivery_needs_review:")
            ? { recipient_email: "", subject: "", html: "" }
            : {}),
        })
        .eq("project_id", delivery.project_id).eq("pro_id", delivery.pro_id).eq("kind", delivery.kind)
        .is("sent_at", null);
      if (error) throw new Error(error.message);
    },
  };
}
