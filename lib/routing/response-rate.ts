import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Calcule le taux de réponse d'un pro sur ses 10 derniers leads.
 * Un lead est "répondu" s'il a été marqué "contacted" dans les 48h après sent_at.
 * Retourne un pourcentage (0-100), ou null si le pro n'a aucun lead.
 */
export async function calculateResponseRate(
  proId: number
): Promise<number | null> {
  const supabase = getServiceClient();

  const { data: leads } = await supabase
    .from("project_leads")
    .select("sent_at, contacted_at, status")
    .eq("pro_id", proId)
    .order("sent_at", { ascending: false })
    .limit(10);

  if (!leads || leads.length === 0) return null;

  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  let contactedInTime = 0;

  for (const lead of leads) {
    if (lead.status === "contacted" && lead.contacted_at && lead.sent_at) {
      const sentTime = new Date(lead.sent_at).getTime();
      const contactedTime = new Date(lead.contacted_at).getTime();
      if (contactedTime - sentTime <= FORTY_EIGHT_HOURS) {
        contactedInTime++;
      }
    }
  }

  return Math.round((contactedInTime / leads.length) * 100);
}

/**
 * Retourne le multiplicateur de pénalité à appliquer au score de routing.
 * - Taux >= 50% : pas de pénalité (1.0)
 * - Taux 25-49% : pénalité x0.5
 * - Taux < 25% : exclusion (0)
 * - null (pas de leads) : pas de pénalité (1.0)
 */
export function getResponseRatePenalty(responseRate: number | null): number {
  if (responseRate === null) return 1;
  if (responseRate >= 50) return 1;
  if (responseRate >= 25) return 0.5;
  return 0;
}
