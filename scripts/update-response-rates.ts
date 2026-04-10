/**
 * Script de mise à jour des taux de réponse des pros.
 *
 * Pour chaque pro abonné, calcule le taux de réponse (% de leads
 * contactés dans les 48h sur les 10 derniers leads) et met à jour
 * le champ response_rate en base.
 *
 * Exécution : npx tsx scripts/update-response-rates.ts
 *
 * Variables d'environnement requises :
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Récupérer tous les pros abonnés (trialing ou active)
  const { data: pros, error } = await supabase
    .from("pros")
    .select("id, name")
    .in("subscription_status", ["trialing", "active"]);

  if (error) {
    console.error("Erreur requête pros:", error);
    process.exit(1);
  }

  if (!pros || pros.length === 0) {
    console.log("Aucun pro abonné trouvé.");
    return;
  }

  console.log(`${pros.length} pro(s) abonné(s). Calcul des taux de réponse...`);

  let updated = 0;

  for (const pro of pros) {
    // Récupérer les 10 derniers leads
    const { data: leads } = await supabase
      .from("project_leads")
      .select("sent_at, contacted_at, status")
      .eq("pro_id", pro.id)
      .order("sent_at", { ascending: false })
      .limit(10);

    let rate: number | null = null;

    if (leads && leads.length > 0) {
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
      rate = Math.round((contactedInTime / leads.length) * 100);
    }

    await supabase
      .from("pros")
      .update({ response_rate: rate })
      .eq("id", pro.id);

    console.log(
      `  ${pro.name}: ${rate !== null ? `${rate}%` : "aucun lead"}`
    );
    updated++;
  }

  console.log(`\nTerminé. ${updated} pro(s) mis à jour.`);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
