import { cache } from "react";
import { getServiceClient } from "@/lib/supabase/service-client";

/** Comptes identifiés comme tests, jamais des clients déduits de leur nom/email. */
export const ANALYTICS_TEST_PRO_IDS: readonly number[] = [4393, 99999, 1432477];

type ActivityIdentity = {
  pro_id?: number | null;
  user_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

function isTestProId(value: unknown): boolean {
  const id = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof id === "number" && ANALYTICS_TEST_PRO_IDS.includes(id);
}

export function isAnalyticsTestActivity(
  activity: ActivityIdentity,
  testUserIds: ReadonlySet<string> = new Set()
): boolean {
  // L'identifiant structuré prime : ne pas écarter un vrai pro sur la seule
  // présence d'une référence à un compte de test dans ses métadonnées.
  if (activity.pro_id != null) return isTestProId(activity.pro_id);
  if (activity.user_id && testUserIds.has(activity.user_id)) return true;
  return isTestProId(activity.metadata?.pro_id) || isTestProId(activity.metadata?.proId);
}

/** Les anciens claim_completed portent user_id sans pro_id. */
export const getAnalyticsTestUserIds = cache(async (): Promise<ReadonlySet<string>> => {
  const { data, error } = await getServiceClient()
    .from("pros")
    .select("claimed_by_user_id")
    .in("id", [...ANALYTICS_TEST_PRO_IDS]);
  if (error) throw new Error("Impossible de vérifier les comptes de test des statistiques.");
  return new Set(
    (data ?? []).flatMap((pro) =>
      typeof pro.claimed_by_user_id === "string" ? [pro.claimed_by_user_id] : []
    )
  );
});
