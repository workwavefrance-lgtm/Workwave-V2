import { acquisitionContext, analyticsAccepted } from "./acquisition-client";
import { safeEventMetadata } from "./acquisition";
import { EVENTS } from "./events";

type ClientEvent =
  | typeof EVENTS.PROJECT_CTA_CLICKED
  | typeof EVENTS.PAGE_VIEW
  | typeof EVENTS.PROJECT_FORM_VIEWED
  | typeof EVENTS.PROJECT_FORM_STARTED
  | typeof EVENTS.PROJECT_FORM_ABANDONED
  | typeof EVENTS.PROJECT_STEP_REACHED
  | typeof EVENTS.PHONE_CLICK;

/**
 * Client-side fire-and-forget tracking.
 * Envoie l'événement au serveur via /api/track.
 * Le serveur vérifie le consentement RGPD.
 */
export function trackClient(
  event: ClientEvent,
  metadata?: Record<string, unknown>
) {
  const acquisition = acquisitionContext();
  if (!analyticsAccepted()) return;
  fetch("/api/track", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, metadata: safeEventMetadata(metadata), acquisition }),
  }).catch(() => {});
}
