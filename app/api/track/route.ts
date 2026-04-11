import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { track } from "@/lib/analytics/track";
import { EVENTS, type EventName } from "@/lib/analytics/events";

const ALLOWED_EVENTS = new Set<string>([
  EVENTS.PAGE_VIEW,
  EVENTS.PROJECT_FORM_STARTED,
  EVENTS.PROJECT_FORM_ABANDONED,
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, metadata } = body as {
      event: string;
      metadata?: Record<string, unknown>;
    };

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // RGPD : vérifier le consentement cookie pour les visiteurs anonymes
    const cookieStore = await cookies();
    const consent = cookieStore.get("consent_analytics")?.value;
    if (consent !== "accepted") {
      return NextResponse.json({ skipped: true });
    }

    // Extraire IP et user-agent
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    track(event as EventName, {
      metadata,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
