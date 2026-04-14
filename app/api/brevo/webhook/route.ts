import { NextResponse } from "next/server";
import { getAdminServiceClient } from "@/lib/admin/service-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

/**
 * Webhook Brevo pour le tracking des emails (delivery, open, click, bounce, spam).
 * URL a configurer dans Brevo : https://workwave.fr/api/brevo/webhook?secret=BREVO_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.BREVO_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase: DB = getAdminServiceClient();

  try {
    const body = await req.json();

    const event: string = body.event;
    const messageId: string = body["message-id"];

    if (!event || !messageId) {
      return NextResponse.json({ error: "Missing event or message-id" }, { status: 400 });
    }

    // Trouver le log correspondant
    const { data: log } = await supabase
      .from("email_logs")
      .select("id, pro_id, sequence_id")
      .eq("brevo_message_id", messageId)
      .limit(1)
      .single();

    if (!log) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const now = new Date().toISOString();

    switch (event) {
      case "delivered":
        await supabase
          .from("email_logs")
          .update({ status: "delivered", delivered_at: now })
          .eq("id", log.id);
        break;

      case "opened":
      case "unique_opened":
        await supabase
          .from("email_logs")
          .update({ status: "opened", opened_at: now })
          .eq("id", log.id)
          .is("opened_at", null);
        break;

      case "click":
        await supabase
          .from("email_logs")
          .update({ status: "clicked", clicked_at: now })
          .eq("id", log.id);
        break;

      case "hard_bounce":
        await supabase
          .from("email_logs")
          .update({ status: "bounced", bounced_at: now })
          .eq("id", log.id);

        await supabase
          .from("pros")
          .update({ email_bounced: true })
          .eq("id", log.pro_id);

        await supabase
          .from("email_sequences")
          .update({ status: "bounced" })
          .eq("id", log.sequence_id);
        break;

      case "soft_bounce":
        await supabase
          .from("email_logs")
          .update({ status: "bounced", bounced_at: now, error_message: "soft_bounce" })
          .eq("id", log.id);
        break;

      case "complaint":
      case "spam": {
        await supabase
          .from("email_logs")
          .update({ status: "complained", bounced_at: now })
          .eq("id", log.id);

        await supabase
          .from("pros")
          .update({ do_not_contact: true })
          .eq("id", log.pro_id);

        await supabase
          .from("email_sequences")
          .update({ status: "unsubscribed" })
          .eq("id", log.sequence_id);

        const { data: pro } = await supabase
          .from("pros")
          .select("email")
          .eq("id", log.pro_id)
          .single();

        if (pro?.email) {
          await supabase
            .from("email_blacklist")
            .upsert(
              { email: pro.email, reason: "spam_complaint" },
              { onConflict: "email" }
            );
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ ok: true, event, message_id: messageId });
  } catch (error) {
    console.error("Erreur webhook Brevo:", error);
    return NextResponse.json({ ok: true, error: "processing_error" });
  }
}
