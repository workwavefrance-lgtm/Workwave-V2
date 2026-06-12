/**
 * Cron quotidien : relance feedback J+3.
 *  - particuliers : projets créés il y a 3-5 jours, jamais relancés
 *  - pros : fiches réclamées il y a 3-5 jours, jamais relancées
 * Idempotent via feedback_request_sent_at (audit trail, leçon 23/05) ; le
 * marquage précède l'envoi possible-échec ? Non : on marque APRÈS envoi OK,
 * et on borne à 200/run pour rester sous maxDuration même à forte échelle.
 * Auth : Bearer CRON_SECRET (Vercel cron natif).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendFeedbackRequest } from "@/lib/email/send-feedback-request";

export const maxDuration = 300;
const BATCH = 200;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const from = new Date(Date.now() - 5 * 86400_000).toISOString();
  const to = new Date(Date.now() - 3 * 86400_000).toISOString();
  let sentParticuliers = 0;
  let sentPros = 0;

  // Particuliers (projets non supprimés, jamais relancés)
  const { data: projects, error: pErr } = await sb
    .from("projects")
    .select("id, email")
    .is("feedback_request_sent_at", null)
    .neq("status", "deleted")
    .gte("created_at", from)
    .lte("created_at", to)
    .limit(BATCH);
  if (pErr) console.error("[feedback-relance] projects:", pErr.message);
  for (const p of projects || []) {
    if (!p.email) continue;
    try {
      await sendFeedbackRequest({ email: p.email, audience: "particulier" });
      await sb.from("projects").update({ feedback_request_sent_at: new Date().toISOString() }).eq("id", p.id);
      sentParticuliers++;
    } catch (e) {
      console.error(`[feedback-relance] projet #${p.id}:`, e);
    }
  }

  // Pros réclamés (hors do_not_contact)
  const { data: pros, error: prErr } = await sb
    .from("pros")
    .select("id, email")
    .is("feedback_request_sent_at", null)
    .not("claimed_by_user_id", "is", null)
    .eq("do_not_contact", false)
    .gte("claimed_at", from)
    .lte("claimed_at", to)
    .limit(BATCH);
  if (prErr) console.error("[feedback-relance] pros:", prErr.message);
  for (const p of pros || []) {
    if (!p.email) continue;
    try {
      await sendFeedbackRequest({ email: p.email, audience: "pro" });
      await sb.from("pros").update({ feedback_request_sent_at: new Date().toISOString() }).eq("id", p.id);
      sentPros++;
    } catch (e) {
      console.error(`[feedback-relance] pro #${p.id}:`, e);
    }
  }

  return NextResponse.json({ ok: true, sentParticuliers, sentPros });
}
