import { EVENTS } from "./events";

type ClientEvent =
  | typeof EVENTS.PAGE_VIEW
  | typeof EVENTS.PROJECT_FORM_STARTED
  | typeof EVENTS.PROJECT_FORM_ABANDONED;

/**
 * Client-side fire-and-forget tracking.
 * Envoie l'événement au serveur via /api/track.
 * Le serveur vérifie le consentement RGPD.
 */
export function trackClient(
  event: ClientEvent,
  metadata?: Record<string, unknown>
) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, metadata }),
  }).catch(() => {});
}
