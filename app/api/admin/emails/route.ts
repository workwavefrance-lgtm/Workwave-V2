import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { SubjectVariant } from "@/lib/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase: DB = getAdminServiceClient();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Parallel queries
  const [logsRes, seqsRes, sentTodayRes, campaignRes, bouncedRes] =
    await Promise.all([
      supabase.from("email_logs").select("status"),
      supabase.from("email_sequences").select("status"),
      supabase
        .from("email_logs")
        .select("*", { count: "exact", head: true })
        .gte("sent_at", todayStart.toISOString()),
      supabase
        .from("email_campaigns")
        .select(
          "id, name, status, daily_limit, subject_variant, total_steps, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("pros")
        .select("id, name, email")
        .eq("email_bounced", true)
        .order("name", { ascending: true })
        .limit(100),
    ]);

  // Count email logs by status
  const counts = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
  };
  for (const log of logsRes.data || []) {
    if (log.status in counts) {
      counts[log.status as keyof typeof counts]++;
    }
  }

  // Count sequences by status
  const seqCounts = {
    pending: 0,
    active: 0,
    completed: 0,
    unsubscribed: 0,
    bounced: 0,
    error: 0,
  };
  for (const seq of seqsRes.data || []) {
    if (seq.status in seqCounts) {
      seqCounts[seq.status as keyof typeof seqCounts]++;
    }
  }

  const totalDeliverable = counts.delivered + counts.opened + counts.clicked;
  const totalSentForRate =
    counts.sent + totalDeliverable + counts.bounced + counts.complained;

  // Recent logs (last 50)
  const { data: recentLogs } = await supabase
    .from("email_logs")
    .select(
      "id, pro_id, recipient_email, step, subject, status, brevo_message_id, sent_at, opened_at, clicked_at"
    )
    .order("sent_at", { ascending: false })
    .limit(50);

  // Map pro names
  let logsWithNames: Array<Record<string, unknown>> = [];
  if (recentLogs && recentLogs.length > 0) {
    const proIds = [
      ...new Set(
        recentLogs.map((l: { pro_id: number }) => l.pro_id)
      ),
    ];
    const { data: pros } = await supabase
      .from("pros")
      .select("id, name")
      .in("id", proIds);

    const proMap = new Map<number, string>(
      (pros || []).map((p: { id: number; name: string }) => [p.id, p.name])
    );

    logsWithNames = recentLogs.map((l: Record<string, unknown>) => ({
      id: l.id,
      pro_name: proMap.get(l.pro_id as number) || `Pro #${l.pro_id}`,
      recipient_email: l.recipient_email,
      step: l.step,
      subject: l.subject,
      status: l.status,
      brevo_message_id: l.brevo_message_id,
      sent_at: l.sent_at,
      opened_at: l.opened_at,
      clicked_at: l.clicked_at,
    }));
  }

  return NextResponse.json({
    stats: {
      totalSent: totalSentForRate,
      totalDelivered: totalDeliverable,
      totalOpened: counts.opened + counts.clicked,
      totalClicked: counts.clicked,
      totalBounced: counts.bounced,
      totalComplained: counts.complained,
      totalFailed: counts.failed,
      openRate:
        totalDeliverable > 0
          ? ((counts.opened + counts.clicked) / totalDeliverable) * 100
          : 0,
      clickRate:
        totalDeliverable > 0
          ? (counts.clicked / totalDeliverable) * 100
          : 0,
      bounceRate:
        totalSentForRate > 0
          ? (counts.bounced / totalSentForRate) * 100
          : 0,
      complaintRate:
        totalSentForRate > 0
          ? (counts.complained / totalSentForRate) * 100
          : 0,
      sentToday: sentTodayRes.count || 0,
    },
    sequences: seqCounts,
    campaign: campaignRes.data || null,
    recentLogs: logsWithNames,
    bouncedPros: bouncedRes.data || [],
  });
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, campaignId, value } = body as {
    action: string;
    campaignId: number;
    value?: string;
  };

  const supabase: DB = getAdminServiceClient();

  switch (action) {
    case "pause": {
      const { error } = await supabase
        .from("email_campaigns")
        .update({ status: "paused" })
        .eq("id", campaignId);

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

      await supabase.from("admin_logs").insert({
        admin_id: admin.id,
        action: "email_campaign.pause",
        entity_type: "email_campaign",
        entity_id: campaignId,
        details: { status: "paused" },
      });

      return NextResponse.json({ success: true, status: "paused" });
    }

    case "resume": {
      const { error } = await supabase
        .from("email_campaigns")
        .update({ status: "active" })
        .eq("id", campaignId);

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

      await supabase.from("admin_logs").insert({
        admin_id: admin.id,
        action: "email_campaign.resume",
        entity_type: "email_campaign",
        entity_id: campaignId,
        details: { status: "active" },
      });

      return NextResponse.json({ success: true, status: "active" });
    }

    case "update_subject": {
      const validVariants: SubjectVariant[] = ["a", "b", "c", "d", "e"];
      if (!value || !validVariants.includes(value as SubjectVariant)) {
        return NextResponse.json(
          { error: "Variante invalide" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("email_campaigns")
        .update({ subject_variant: value })
        .eq("id", campaignId);

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

      await supabase.from("admin_logs").insert({
        admin_id: admin.id,
        action: "email_campaign.update_subject",
        entity_type: "email_campaign",
        entity_id: campaignId,
        details: { subject_variant: value },
      });

      return NextResponse.json({
        success: true,
        subject_variant: value,
      });
    }

    default:
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
}
