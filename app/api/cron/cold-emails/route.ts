import { NextResponse } from "next/server";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { sendColdEmail } from "@/lib/email/send-cold-email";
import {
  isBusinessHours,
  computeDailyLimit,
  computeNextBusinessSendTime,
  checkAutoPause,
} from "@/lib/email/warm-up";
import type { SubjectVariant } from "@/lib/types/database";

export const maxDuration = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export async function GET(req: Request) {
  // 1. AUTH
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = process.env.COLD_EMAIL_DRY_RUN === "true";
  const supabase: DB = getAdminServiceClient();

  // 2. HEURES D'ENVOI
  if (!isBusinessHours()) {
    return NextResponse.json({
      message: "Hors heures d'envoi (8h-19h L-V, hors feries)",
      dry_run: dryRun,
    });
  }

  // 3. CAMPAGNE ACTIVE
  const { data: campaign } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .single();

  if (!campaign) {
    return NextResponse.json({ message: "Aucune campagne active" });
  }

  // 4. AUTO-PAUSE (bounce > 3% ou complaint > 0.3%)
  const autoPause = await checkAutoPause(supabase, campaign.id);
  if (autoPause.shouldPause) {
    await supabase
      .from("email_campaigns")
      .update({ status: "paused" })
      .eq("id", campaign.id);

    return NextResponse.json({
      message: `PAUSE AUTO: ${autoPause.reason}`,
      bounce_rate: autoPause.bounceRate,
      complaint_rate: autoPause.complaintRate,
    });
  }

  // 5. WARM-UP : LIMITE DYNAMIQUE
  const effectiveLimit = computeDailyLimit(
    campaign.created_at,
    campaign.daily_limit
  );

  // 6. LIMITE QUOTIDIENNE
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count: sentToday } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .gte("sent_at", todayStart.toISOString());

  const remaining = effectiveLimit - (sentToday || 0);
  if (remaining <= 0) {
    return NextResponse.json({
      message: "Limite quotidienne atteinte",
      sent_today: sentToday,
      effective_limit: effectiveLimit,
      dry_run: dryRun,
    });
  }

  // 7. SEQUENCES ELIGIBLES (batch = limite quotidienne restante)
  // On fait une query simple puis on join manuellement
  const batchSize = remaining;

  const { data: sequences } = await supabase
    .from("email_sequences")
    .select("id, pro_id, current_step")
    .eq("campaign_id", campaign.id)
    .eq("status", "active")
    .lte("next_send_at", new Date().toISOString())
    .order("next_send_at", { ascending: true })
    .limit(batchSize);

  if (!sequences || sequences.length === 0) {
    return NextResponse.json({
      message: "Aucune sequence a traiter",
      sent_today: sentToday,
      effective_limit: effectiveLimit,
      dry_run: dryRun,
    });
  }

  // Charger les pros correspondants
  const proIds = sequences.map((s: { pro_id: number }) => s.pro_id);
  const { data: pros } = await supabase
    .from("pros")
    .select("id, email, name, slug, prenom_dirigeant, do_not_contact, email_bounced, claimed_by_user_id, is_active, deleted_at, category_id, city_id")
    .in("id", proIds);

  // Charger categories et villes
  const catIds = [...new Set((pros || []).map((p: { category_id: number }) => p.category_id).filter(Boolean))];
  const cityIds = [...new Set((pros || []).map((p: { city_id: number | null }) => p.city_id).filter(Boolean))];

  const { data: categories } = catIds.length > 0
    ? await supabase.from("categories").select("id, name").in("id", catIds)
    : { data: [] };

  const { data: cities } = cityIds.length > 0
    ? await supabase.from("cities").select("id, name").in("id", cityIds)
    : { data: [] };

  const catMap = new Map<number, string>((categories || []).map((c: { id: number; name: string }) => [c.id, c.name]));
  const cityMap = new Map<number, string>((cities || []).map((c: { id: number; name: string }) => [c.id, c.name]));
  const proMap = new Map<number, Record<string, unknown>>((pros || []).map((p: { id: number }) => [p.id, p]));

  // 8. Verifier la blacklist
  const proEmails = (pros || [])
    .map((p: { email: string | null }) => p.email)
    .filter(Boolean) as string[];

  const { data: blacklisted } = proEmails.length > 0
    ? await supabase.from("email_blacklist").select("email").in("email", proEmails)
    : { data: [] };

  const blacklistSet = new Set(
    (blacklisted || []).map((b: { email: string }) => b.email)
  );

  // 9. BOUCLE SEQUENTIELLE
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const seq of sequences) {
    const pro = proMap.get(seq.pro_id) as Record<string, unknown> | undefined;

    if (!pro || !pro.email) {
      skipped++;
      continue;
    }
    if (pro.do_not_contact || pro.email_bounced) {
      skipped++;
      continue;
    }
    if (!pro.is_active || pro.deleted_at) {
      skipped++;
      continue;
    }
    if (pro.claimed_by_user_id) {
      await supabase
        .from("email_sequences")
        .update({ status: "completed" })
        .eq("id", seq.id);
      skipped++;
      continue;
    }
    if (blacklistSet.has(pro.email as string)) {
      await supabase
        .from("email_sequences")
        .update({ status: "unsubscribed" })
        .eq("id", seq.id);
      skipped++;
      continue;
    }

    const nextStep = seq.current_step + 1;
    const cityName: string = cityMap.get(pro.city_id as number) || "Vienne";

    try {
      const result = await sendColdEmail({
        proId: pro.id as number,
        proName: pro.name as string,
        proEmail: pro.email as string,
        prenomDirigeant: (pro.prenom_dirigeant as string) || null,
        cityName,
        slug: pro.slug as string,
        step: nextStep,
        subjectVariant: (campaign.subject_variant as SubjectVariant) || "b",
        dryRun,
      });

      // Log succes
      await supabase.from("email_logs").insert({
        sequence_id: seq.id,
        pro_id: pro.id,
        campaign_id: campaign.id,
        step: nextStep,
        brevo_message_id: result.messageId,
        subject: result.subject,
        recipient_email: result.recipientEmail,
        status: "sent",
      });

      // Mettre a jour la sequence
      const isCompleted = nextStep >= (campaign.total_steps || 3);
      const nextSendAt = isCompleted
        ? null
        : computeNextBusinessSendTime(
            new Date(),
            nextStep === 1 ? 3 : 7
          ).toISOString();

      await supabase
        .from("email_sequences")
        .update({
          current_step: nextStep,
          last_sent_at: new Date().toISOString(),
          next_send_at: nextSendAt,
          status: isCompleted ? "completed" : "active",
        })
        .eq("id", seq.id);

      if (nextStep === 1) {
        await supabase
          .from("pros")
          .update({ first_email_sent_at: new Date().toISOString() })
          .eq("id", pro.id)
          .is("first_email_sent_at", null);
      }

      sent++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await supabase.from("email_logs").insert({
        sequence_id: seq.id,
        pro_id: pro.id,
        campaign_id: campaign.id,
        step: nextStep,
        status: "failed",
        error_message: errorMessage,
        recipient_email: dryRun
          ? "workwave.france@gmail.com"
          : (pro.email as string),
      });

      await supabase
        .from("email_sequences")
        .update({ status: "error" })
        .eq("id", seq.id);

      failed++;
      console.error(
        `Echec envoi email pro ${pro.id} step ${nextStep}:`,
        errorMessage
      );
    }

    // Sleep anti-bulk : 1 a 3 secondes entre chaque email
    // (Brevo gere le pacing de delivrabilite cote serveur)
    if (sent + failed + skipped < sequences.length) {
      await sleep(randomBetween(1000, 3000));
    }
  }

  return NextResponse.json({
    processed: sequences.length,
    sent,
    failed,
    skipped,
    daily_total: (sentToday || 0) + sent,
    effective_limit: effectiveLimit,
    dry_run: dryRun,
    bounce_rate: autoPause.bounceRate,
    complaint_rate: autoPause.complaintRate,
  });
}
