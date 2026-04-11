import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { EventName } from "./events";

type TrackOptions = {
  userId?: string;
  proId?: number;
  projectId?: number;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Fire-and-forget event tracking.
 * Insère dans la table `events` via le service client (bypass RLS).
 *
 * RGPD : si proId ou userId est défini (pro connecté), l'event passe toujours
 * (cadre contractuel). Pour les visiteurs anonymes, le caller doit vérifier
 * le consentement cookie avant d'appeler track().
 */
export function track(eventName: EventName, options: TrackOptions = {}) {
  try {
    const db = getAdminServiceClient();
    Promise.resolve(
      db.from("events").insert({
        event_name: eventName,
        user_id: options.userId || null,
        pro_id: options.proId || null,
        project_id: options.projectId || null,
        metadata: options.metadata || null,
        session_id: options.sessionId || null,
        ip_address: options.ipAddress || null,
        user_agent: options.userAgent || null,
      } as never)
    ).catch(() => {});
  } catch {
    // Fire-and-forget : on ne bloque jamais le flux principal
  }
}
