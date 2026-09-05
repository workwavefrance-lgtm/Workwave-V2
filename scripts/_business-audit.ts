/**
 * Audit BUSINESS brutal : où en est-on vraiment ?
 * - Trafic (GSC API hors scope ici, on regarde la BDD)
 * - Clients payants Stripe (BTP + AI)
 * - Dépôts projets (BTP + AI), routing, broadcast, unlock
 * - Inscriptions pros (BTP claims + AI signups)
 * - Funnel conversion par étape
 * - MRR estimé
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const today = new Date().toISOString().slice(0, 10);
const days = (n: number) => new Date(Date.now() - n * 86400e3).toISOString();

function pct(n: number, d: number): string {
  if (d === 0) return "0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

async function header(title: string) {
  console.log(`\n══════════ ${title} ══════════`);
}

async function main() {
  console.log(`Audit business Workwave · ${today}`);

  // 1. POOL TOTAL
  await header("1. POOL · combien de pros / projets en BDD ?");
  const { count: totalPros } = await sb.from("pros").select("*", { count: "estimated", head: true });
  const { count: claimedPros } = await sb.from("pros").select("*", { count: "exact", head: true }).not("claimed_by_user_id", "is", null);
  const { count: aiSignups } = await sb.from("pros").select("*", { count: "exact", head: true }).eq("source", "ai_signup");
  console.log(`  Pros totaux (estimé)         : ${(totalPros ?? 0).toLocaleString("fr")}`);
  console.log(`  Pros RÉCLAMÉS (claimed)       : ${claimedPros ?? 0} ← clients potentiels`);
  console.log(`  Pros AI freelance (signups)   : ${aiSignups ?? 0} ← entrants AI`);

  // 2. STRIPE PAYANTS : c'est le seul truc qui compte
  await header("2. CLIENTS PAYANTS Stripe");
  const { data: paying } = await sb.from("pros")
    .select("id, name, subscription_status, subscription_plan, subscription_product, current_period_end, trial_ends_at")
    .in("subscription_status", ["trialing", "active", "past_due"])
    .order("subscription_status");
  const byStatus = (s: string) => (paying || []).filter((p) => p.subscription_status === s);
  const trialing = byStatus("trialing");
  const active = byStatus("active");
  const pastDue = byStatus("past_due");
  console.log(`  Active (payent réellement)    : ${active.length}`);
  console.log(`  Trialing (essai 14j)          : ${trialing.length}`);
  console.log(`  Past due (paiement échoué)    : ${pastDue.length}`);
  if (active.length > 0) {
    const btpActive = active.filter((p) => !p.subscription_product || !p.subscription_product.includes("ai")).length;
    const aiActive = active.filter((p) => p.subscription_product && p.subscription_product.includes("ai")).length;
    console.log(`    → BTP Pro (39€/mois) : ${btpActive}`);
    console.log(`    → AI Premium (29.90€/mois) : ${aiActive}`);
    const mrrBtp = btpActive * 39;
    const mrrAi = aiActive * 29.9;
    console.log(`\n  💰 MRR estimé             : ${(mrrBtp + mrrAi).toFixed(2)}€/mois`);
    console.log(`     BTP    : ${mrrBtp}€/mois`);
    console.log(`     AI     : ${mrrAi.toFixed(2)}€/mois`);
  } else {
    console.log(`\n  💰 MRR = 0€ (aucun pro en 'active')`);
  }

  // 3. PAY-PER-LEAD BTP (modèle actuel selon CLAUDE.md)
  await header("3. PAY-PER-LEAD BTP (déblocage de coordonnées 9.90€)");
  const { count: totalUnlocks } = await sb.from("lead_unlocks").select("*", { count: "exact", head: true });
  const { count: unlocks30j } = await sb.from("lead_unlocks").select("*", { count: "exact", head: true }).gte("created_at", days(30));
  const { count: unlocks7j } = await sb.from("lead_unlocks").select("*", { count: "exact", head: true }).gte("created_at", days(7));
  console.log(`  Unlocks total                 : ${totalUnlocks ?? 0}`);
  console.log(`  30 derniers jours             : ${unlocks30j ?? 0}  (CA = ${((unlocks30j ?? 0) * 9.9).toFixed(2)}€)`);
  console.log(`  7 derniers jours              : ${unlocks7j ?? 0}  (CA = ${((unlocks7j ?? 0) * 9.9).toFixed(2)}€)`);

  // 4. DÉPÔTS DE PROJET : c'est l'engagement
  await header("4. DÉPÔTS de projet (BTP + AI)");
  const { count: projectsTotal } = await sb.from("projects").select("*", { count: "exact", head: true });
  const { count: projects30j } = await sb.from("projects").select("*", { count: "exact", head: true }).gte("created_at", days(30));
  const { count: projects7j } = await sb.from("projects").select("*", { count: "exact", head: true }).gte("created_at", days(7));
  const { count: projects24h } = await sb.from("projects").select("*", { count: "exact", head: true }).gte("created_at", days(1));
  const { count: projectsBtp } = await sb.from("projects").select("*", { count: "exact", head: true }).eq("vertical", "btp").gte("created_at", days(30));
  const { count: projectsTech } = await sb.from("projects").select("*", { count: "exact", head: true }).eq("vertical", "tech").gte("created_at", days(30));
  const { count: suspicious } = await sb.from("projects").select("*", { count: "exact", head: true }).eq("status", "suspicious");
  const { count: deleted } = await sb.from("projects").select("*", { count: "exact", head: true }).eq("status", "deleted");
  console.log(`  Total projets en base         : ${projectsTotal ?? 0}`);
  console.log(`  - dont suspicious (spam IA)   : ${suspicious ?? 0}`);
  console.log(`  - dont deleted (RGPD/test)    : ${deleted ?? 0}`);
  console.log(`  30 derniers jours (vrais + susp): ${projects30j ?? 0}`);
  console.log(`    → BTP : ${projectsBtp ?? 0}`);
  console.log(`    → AI tech : ${projectsTech ?? 0}`);
  console.log(`  7 derniers jours              : ${projects7j ?? 0}`);
  console.log(`  24 dernières heures           : ${projects24h ?? 0}`);

  // 5. AI SIGNUPS : entrants freelance
  await header("5. INSCRIPTIONS freelance AI");
  const { count: aiSign30j } = await sb.from("ai_signups").select("*", { count: "exact", head: true }).gte("created_at", days(30));
  const { count: aiSign7j } = await sb.from("ai_signups").select("*", { count: "exact", head: true }).gte("created_at", days(7));
  const { count: aiSignTotal } = await sb.from("ai_signups").select("*", { count: "exact", head: true });
  console.log(`  Total signups freelance AI    : ${aiSignTotal ?? 0}`);
  console.log(`  30 derniers jours             : ${aiSign30j ?? 0}`);
  console.log(`  7 derniers jours              : ${aiSign7j ?? 0}`);

  // 6. CLAIM_ATTEMPTS : funnel BTP "réclamer ma fiche"
  await header("6. FUNNEL · réclamation de fiche BTP");
  const { count: claimAtt30j } = await sb.from("claim_attempts").select("*", { count: "exact", head: true }).gte("created_at", days(30));
  const { count: claimSuccess30j } = await sb.from("claim_attempts").select("*", { count: "exact", head: true }).gte("created_at", days(30)).eq("success", true);
  console.log(`  Tentatives de claim (30j)     : ${claimAtt30j ?? 0}`);
  console.log(`  Claims SUCCÈS (30j)           : ${claimSuccess30j ?? 0}  (conversion : ${pct(claimSuccess30j ?? 0, claimAtt30j ?? 0)})`);

  // 7. PROJECT_LEADS : routing / broadcast
  await header("7. ROUTING · projets envoyés aux pros");
  const { count: leadsTotal } = await sb.from("project_leads").select("*", { count: "exact", head: true });
  const { count: leadsContacted } = await sb.from("project_leads").select("*", { count: "exact", head: true }).not("contacted_at", "is", null);
  console.log(`  Leads envoyés (total)         : ${leadsTotal ?? 0}`);
  console.log(`  Leads marqués 'contacté'      : ${leadsContacted ?? 0}  (taux : ${pct(leadsContacted ?? 0, leadsTotal ?? 0)})`);

  // 8. RÉSUMÉ EXÉCUTIF
  await header("8. 🎯 RÉSUMÉ EXÉCUTIF (ce qui compte vraiment)");
  const mrr = (active.filter((p) => !p.subscription_product || !p.subscription_product.includes("ai")).length * 39) +
              (active.filter((p) => p.subscription_product?.includes("ai")).length * 29.9);
  const ppl30 = (unlocks30j ?? 0) * 9.9;
  console.log(`  ARR (MRR × 12)                : ${(mrr * 12).toFixed(2)}€/an`);
  console.log(`  MRR                            : ${mrr.toFixed(2)}€/mois`);
  console.log(`  Pay-per-lead (30j)            : ${ppl30.toFixed(2)}€`);
  console.log(`  CA total estimé sur 30j       : ${(mrr + ppl30).toFixed(2)}€`);
  console.log();
  console.log(`  Pros claimed (potentiel vente): ${claimedPros ?? 0}`);
  console.log(`  Conversion claim→paid         : ${pct(active.length, claimedPros ?? 0)}`);
  console.log(`  Projets vrais (30j, non-spam) : ${(projects30j ?? 0) - (suspicious ?? 0)}`);
  console.log(`  Inscriptions freelance AI 30j : ${aiSign30j ?? 0}`);
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
