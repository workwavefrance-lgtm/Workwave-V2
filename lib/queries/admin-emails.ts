import { getAdminServiceClient } from "@/lib/admin/service-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export type EmailStats = {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  complaintRate: number;
  sentToday: number;
  sequencesPending: number;
  sequencesActive: number;
  sequencesCompleted: number;
  sequencesUnsubscribed: number;
  sequencesBounced: number;
  sequencesError: number;
};

export type EmailLogRow = {
  id: number;
  pro_name: string;
  recipient_email: string;
  step: number;
  subject: string;
  status: string;
  brevo_message_id: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
};

export type ActiveCampaign = {
  id: number;
  name: string;
  status: string;
  daily_limit: number;
  subject_variant: string;
  total_steps: number;
  created_at: string;
};

export async function getEmailStats(): Promise<EmailStats> {
  const supabase: DB = getAdminServiceClient();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Compter par statut dans email_logs
  const { data: logs } = await supabase
    .from("email_logs")
    .select("status");

  const counts = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, failed: 0 };
  for (const log of logs || []) {
    if (log.status in counts) {
      counts[log.status as keyof typeof counts]++;
    }
  }

  // Emails envoyes aujourd'hui
  const { count: sentToday } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .gte("sent_at", todayStart.toISOString());

  // Sequences par statut
  const { data: seqs } = await supabase
    .from("email_sequences")
    .select("status");

  const seqCounts = { pending: 0, active: 0, completed: 0, unsubscribed: 0, bounced: 0, error: 0 };
  for (const seq of seqs || []) {
    if (seq.status in seqCounts) {
      seqCounts[seq.status as keyof typeof seqCounts]++;
    }
  }

  const totalDeliverable = counts.delivered + counts.opened + counts.clicked;
  const totalSentForRate = counts.sent + totalDeliverable + counts.bounced + counts.complained;

  return {
    totalSent: totalSentForRate,
    totalDelivered: totalDeliverable,
    totalOpened: counts.opened + counts.clicked,
    totalClicked: counts.clicked,
    totalBounced: counts.bounced,
    totalComplained: counts.complained,
    totalFailed: counts.failed,
    openRate: totalDeliverable > 0 ? ((counts.opened + counts.clicked) / totalDeliverable) * 100 : 0,
    clickRate: totalDeliverable > 0 ? (counts.clicked / totalDeliverable) * 100 : 0,
    bounceRate: totalSentForRate > 0 ? (counts.bounced / totalSentForRate) * 100 : 0,
    complaintRate: totalSentForRate > 0 ? (counts.complained / totalSentForRate) * 100 : 0,
    sentToday: sentToday || 0,
    sequencesPending: seqCounts.pending,
    sequencesActive: seqCounts.active,
    sequencesCompleted: seqCounts.completed,
    sequencesUnsubscribed: seqCounts.unsubscribed,
    sequencesBounced: seqCounts.bounced,
    sequencesError: seqCounts.error,
  };
}

export async function getActiveCampaign(): Promise<ActiveCampaign | null> {
  const supabase: DB = getAdminServiceClient();

  const { data } = await supabase
    .from("email_campaigns")
    .select("id, name, status, daily_limit, subject_variant, total_steps, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data || null;
}

export async function getRecentEmailLogs(limit = 50): Promise<EmailLogRow[]> {
  const supabase: DB = getAdminServiceClient();

  const { data: logs } = await supabase
    .from("email_logs")
    .select("id, pro_id, recipient_email, step, subject, status, brevo_message_id, sent_at, opened_at, clicked_at")
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (!logs || logs.length === 0) return [];

  // Charger les noms des pros
  const proIds = [...new Set(logs.map((l: { pro_id: number }) => l.pro_id))];
  const { data: pros } = await supabase
    .from("pros")
    .select("id, name")
    .in("id", proIds);

  const proMap = new Map<number, string>(
    (pros || []).map((p: { id: number; name: string }) => [p.id, p.name])
  );

  return logs.map((l: Record<string, unknown>) => ({
    id: l.id as number,
    pro_name: proMap.get(l.pro_id as number) || `Pro #${l.pro_id}`,
    recipient_email: l.recipient_email as string,
    step: l.step as number,
    subject: l.subject as string,
    status: l.status as string,
    brevo_message_id: l.brevo_message_id as string | null,
    sent_at: l.sent_at as string,
    opened_at: l.opened_at as string | null,
    clicked_at: l.clicked_at as string | null,
  }));
}

export async function getBouncedPros(): Promise<Array<{ id: number; name: string; email: string }>> {
  const supabase: DB = getAdminServiceClient();

  const { data } = await supabase
    .from("pros")
    .select("id, name, email")
    .eq("email_bounced", true)
    .order("name", { ascending: true })
    .limit(100);

  return data || [];
}
