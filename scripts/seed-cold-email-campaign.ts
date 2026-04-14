/**
 * Initialise une campagne de cold email et cree les sequences pour les pros eligibles.
 *
 * Usage :
 *   npx tsx scripts/seed-cold-email-campaign.ts
 *   npx tsx scripts/seed-cold-email-campaign.ts --limit 10    # test avec 10 pros
 *   npx tsx scripts/seed-cold-email-campaign.ts --dry-run     # affiche sans inserer
 *
 * Prerequis : migration 06-cold-emails.sql executee.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit"));
  const limit = limitArg
    ? parseInt(args[args.indexOf(limitArg) + 1] || "0", 10)
    : 0;
  const dryRun = args.includes("--dry-run");

  console.log("=== Seed Cold Email Campaign ===");
  if (dryRun) console.log("[DRY RUN] Aucune insertion ne sera faite.");

  // 1. Verifier qu'il n'y a pas de campagne active
  const { data: existingActive } = await supabase
    .from("email_campaigns")
    .select("id, name, status")
    .eq("status", "active")
    .limit(1)
    .single();

  if (existingActive) {
    console.log(
      `\nUne campagne active existe deja : "${existingActive.name}" (id=${existingActive.id}).`
    );
    console.log("Mettez-la en pause ou completez-la avant d'en creer une nouvelle.");
    process.exit(1);
  }

  // 2. Creer la campagne
  const campaignName = `Campagne ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;

  if (!dryRun) {
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        name: campaignName,
        description: "Premiere campagne cold email - invitation a reclamer sa fiche Workwave",
        status: "active",
        total_steps: 3,
        daily_limit: 200,
        subject_variant: "b",
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      console.error("Erreur creation campagne:", campaignError?.message);
      process.exit(1);
    }

    console.log(`\nCampagne creee : "${campaignName}" (id=${campaign.id})`);

    // 3. Charger les pros eligibles
    let query = supabase
      .from("pros")
      .select("id, email, name")
      .not("email", "is", null)
      .eq("do_not_contact", false)
      .eq("email_bounced", false)
      .is("claimed_by_user_id", null)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("id", { ascending: true });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: pros, error: prosError } = await query;

    if (prosError) {
      console.error("Erreur chargement pros:", prosError.message);
      process.exit(1);
    }

    if (!pros || pros.length === 0) {
      console.log("Aucun pro eligible trouve.");
      process.exit(0);
    }

    console.log(`${pros.length} pros eligibles trouves.`);

    // 4. Verifier la blacklist
    const emails = pros
      .map((p: { email: string | null }) => p.email)
      .filter(Boolean) as string[];

    const { data: blacklisted } = await supabase
      .from("email_blacklist")
      .select("email")
      .in("email", emails);

    const blacklistSet = new Set(
      (blacklisted || []).map((b: { email: string }) => b.email)
    );

    const eligiblePros = pros.filter(
      (p: { email: string | null }) => p.email && !blacklistSet.has(p.email)
    );

    if (blacklistSet.size > 0) {
      console.log(`${blacklistSet.size} pros exclus (blacklist). ${eligiblePros.length} restants.`);
    }

    // 5. Creer les sequences
    // Calculer le premier envoi : prochain jour ouvre 9h-11h Paris
    const now = new Date();
    const nextSendAt = getNextBusinessDay(now);

    const sequences = eligiblePros.map((p: { id: number }) => ({
      campaign_id: campaign.id,
      pro_id: p.id,
      current_step: 0,
      status: "active",
      next_send_at: nextSendAt.toISOString(),
    }));

    // Insert par batch de 500
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < sequences.length; i += batchSize) {
      const batch = sequences.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("email_sequences")
        .insert(batch);

      if (insertError) {
        console.error(
          `Erreur insertion batch ${i / batchSize + 1}:`,
          insertError.message
        );
        continue;
      }
      inserted += batch.length;
    }

    console.log(`\n${inserted} sequences creees.`);
    console.log(`Premier envoi prevu : ${nextSendAt.toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`);
    console.log(`\nResume :`);
    console.log(`  Campagne : ${campaignName}`);
    console.log(`  Campagne ID : ${campaign.id}`);
    console.log(`  Pros eligibles : ${eligiblePros.length}`);
    console.log(`  Sequences creees : ${inserted}`);
    console.log(`  Subject variant : b`);
    console.log(`  Daily limit : 200 (warm-up: 20 en S1)`);
    console.log(`  Total steps : 3`);
  } else {
    // Dry run : juste compter les pros
    let query = supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .not("email", "is", null)
      .eq("do_not_contact", false)
      .eq("email_bounced", false)
      .is("claimed_by_user_id", null)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { count } = await query;

    console.log(`\n[DRY RUN] Campagne : "${campaignName}"`);
    console.log(`[DRY RUN] Pros eligibles : ${count || 0}`);
    console.log("[DRY RUN] Aucune donnee inseree.");
  }
}

function getNextBusinessDay(from: Date): Date {
  const d = new Date(from);
  // Avancer d'un jour minimum
  d.setDate(d.getDate() + 1);

  // Boucler jusqu'a un jour ouvre
  while (true) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) break;
    d.setDate(d.getDate() + 1);
  }

  // Heure aleatoire entre 9h et 11h Paris (UTC+1 ou UTC+2)
  // On met en UTC : 7h ou 8h UTC selon l'heure d'ete
  const hour = 7 + Math.floor(Math.random() * 2); // 7 ou 8 UTC
  const minute = Math.floor(Math.random() * 60);
  d.setUTCHours(hour, minute, 0, 0);

  return d;
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
