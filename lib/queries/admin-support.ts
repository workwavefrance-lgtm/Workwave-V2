import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { SupportTicket, SupportMessage } from "@/lib/support/tickets";

/**
 * Requêtes admin de la boîte de réception support.
 * service_role (bypass RLS). Volume tickets modeste -> count exact OK
 * (l'index (status, last_message_at) rend le listing filtré instantané).
 */

export type AdminTicketsFilters = {
  status?: string; // all | open | pending | resolved | closed
  search?: string;
  page?: number;
  pageSize?: number;
};

const STATUSES = ["open", "pending", "resolved", "closed"] as const;

export const getAdminTickets = cache(async (filters: AdminTicketsFilters = {}) => {
  const db = getAdminServiceClient();
  const { status = "open", search = "", page = 1, pageSize = 25 } = filters;

  let q = db.from("support_tickets").select("*", { count: "exact" });
  if (status && status !== "all" && STATUSES.includes(status as (typeof STATUSES)[number])) {
    q = q.eq("status", status);
  }
  if (search) {
    // Neutralise les jokers LIKE (% _ \) ET les caractères de structure du filtre
    // PostgREST ( , ( ) ) pour éviter tout parsing cassé / injection de filtre.
    // On garde lettres, chiffres, @ . - et espaces.
    const s = search
      .replace(/[%_\\(),]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
    if (s) {
      q = q.or(
        `requester_email.ilike.%${s}%,requester_name.ilike.%${s}%,subject.ilike.%${s}%`
      );
    }
  }
  q = q.order("last_message_at", { ascending: false });
  const from = (page - 1) * pageSize;
  q = q.range(from, from + pageSize - 1);

  const { data, count } = await q;
  return {
    data: (data || []) as unknown as SupportTicket[],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  };
});

export const getTicketStatusCounts = cache(async (): Promise<Record<string, number>> => {
  const db = getAdminServiceClient();
  const out: Record<string, number> = {};
  await Promise.all(
    STATUSES.map(async (s) => {
      const { count } = await db
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", s);
      out[s] = count || 0;
    })
  );
  return out;
});

export type TicketProContext = {
  id: number;
  name: string;
  slug: string | null;
  subscription_status: string | null;
  category: string | null;
  city: string | null;
} | null;

export type TicketProjectContext = {
  id: number;
  category: string | null;
  city: string | null;
  status: string | null;
  created_at: string;
};

export type TicketPastTicket = {
  id: number;
  subject: string | null;
  status: string;
  created_at: string;
};

export type AdminTicketDetail = {
  ticket: SupportTicket;
  messages: SupportMessage[];
  context: {
    pro: TicketProContext;
    projects: TicketProjectContext[];
    unlocks: number;
    pastTickets: TicketPastTicket[];
  };
};

export async function getAdminTicketById(id: number): Promise<AdminTicketDetail | null> {
  const db = getAdminServiceClient();

  const { data: ticketRow } = await db
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!ticketRow) return null;
  const ticket = ticketRow as unknown as SupportTicket;

  const { data: messageRows } = await db
    .from("support_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });
  const messages = (messageRows || []) as unknown as SupportMessage[];

  // Contexte pro
  let pro: TicketProContext = null;
  if (ticket.pro_id) {
    const { data } = await db
      .from("pros")
      .select("id, name, slug, subscription_status, categories(name), cities(name)")
      .eq("id", ticket.pro_id)
      .maybeSingle();
    if (data) {
      const d = data as unknown as {
        id: number;
        name: string;
        slug: string | null;
        subscription_status: string | null;
        categories: { name: string } | null;
        cities: { name: string } | null;
      };
      pro = {
        id: d.id,
        name: d.name,
        slug: d.slug,
        subscription_status: d.subscription_status,
        category: d.categories?.name ?? null,
        city: d.cities?.name ?? null,
      };
    }
  }

  // Projets déposés par cet email (particulier)
  let projects: TicketProjectContext[] = [];
  if (ticket.requester_email) {
    const { data } = await db
      .from("projects")
      .select("id, status, created_at, categories(name), cities(name)")
      .eq("email", ticket.requester_email)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(5);
    projects = ((data || []) as unknown as Array<{
      id: number;
      status: string | null;
      created_at: string;
      categories: { name: string } | null;
      cities: { name: string } | null;
    }>).map((p) => ({
      id: p.id,
      status: p.status,
      created_at: p.created_at,
      category: p.categories?.name ?? null,
      city: p.cities?.name ?? null,
    }));
  }

  // Nombre de leads débloqués par ce pro
  let unlocks = 0;
  if (ticket.pro_id) {
    const { count } = await db
      .from("lead_unlocks")
      .select("id", { count: "exact", head: true })
      .eq("pro_id", ticket.pro_id);
    unlocks = count || 0;
  }

  // Tickets passés du même expéditeur
  let pastTickets: TicketPastTicket[] = [];
  if (ticket.requester_email) {
    const { data } = await db
      .from("support_tickets")
      .select("id, subject, status, created_at")
      .eq("requester_email", ticket.requester_email)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(6);
    pastTickets = (data || []) as unknown as TicketPastTicket[];
  }

  return { ticket, messages, context: { pro, projects, unlocks, pastTickets } };
}
