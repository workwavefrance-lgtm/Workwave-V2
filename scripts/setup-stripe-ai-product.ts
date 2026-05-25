/**
 * Setup Stripe Product + Prices pour Workwave AI Premium.
 *
 * Cree :
 *   - Product "Workwave AI Premium" avec metadata { vertical: 'ai' }
 *   - 2 Prices :
 *       - Monthly : 29,90€ TTC/mois recurring (2990 cents EUR)
 *       - Annual  : 299€ TTC/an    recurring (29900 cents EUR)
 *         = ~ 24,92€/mois equivalent. Soit 2 mois offerts vs monthly.
 *
 * Le mode (TEST vs LIVE) est determine par la cle STRIPE_SECRET_KEY :
 *   sk_test_xxx -> TEST mode (sans risque)
 *   sk_live_xxx -> LIVE mode (compte Stripe reel, prods reels)
 *
 * Demande confirmation explicite avant LIVE.
 *
 * Output : les IDs Stripe a ajouter dans Vercel env vars :
 *   STRIPE_AI_PRODUCT_ID=prod_xxx
 *   STRIPE_AI_PRICE_MONTHLY_ID=price_xxx
 *   STRIPE_AI_PRICE_ANNUAL_ID=price_xxx
 *
 * Usage :
 *   npx tsx scripts/setup-stripe-ai-product.ts --dry-run    # n'execute rien
 *   npx tsx scripts/setup-stripe-ai-product.ts              # cree en TEST
 *   npx tsx scripts/setup-stripe-ai-product.ts --confirm-live  # cree en LIVE
 */
import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";
import * as readline from "readline";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const DRY_RUN = process.argv.includes("--dry-run");
const CONFIRM_LIVE = process.argv.includes("--confirm-live");

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("❌ STRIPE_SECRET_KEY manquante en env. Verifier .env.local");
  process.exit(1);
}

const isLive = stripeKey.startsWith("sk_live_");
const isTest = stripeKey.startsWith("sk_test_");

if (!isLive && !isTest) {
  console.error("❌ STRIPE_SECRET_KEY format invalide (ni sk_test_ ni sk_live_)");
  process.exit(1);
}

const mode = isLive ? "🔴 LIVE" : "🟢 TEST";
console.log(`\n=== Setup Stripe Workwave AI Premium — mode ${mode} ===\n`);

if (isLive && !CONFIRM_LIVE) {
  console.error(
    "⚠️  STRIPE_SECRET_KEY est en LIVE mode (prod reel). Pour confirmer, ajouter --confirm-live"
  );
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { typescript: true });

async function askConfirm(question: string): Promise<boolean> {
  if (DRY_RUN) return false;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${question} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === "yes");
    });
  });
}

async function findExistingProduct(): Promise<Stripe.Product | null> {
  const products = await stripe.products.list({ limit: 100, active: true });
  return (
    products.data.find(
      (p) =>
        p.metadata?.vertical === "ai" &&
        p.name === "Workwave AI Premium"
    ) || null
  );
}

async function main() {
  console.log("1. Recherche d'un Product Workwave AI existant...");
  const existing = await findExistingProduct();
  if (existing) {
    console.log(`   ⚠️  Product deja existant : ${existing.id} (${existing.name})`);
    console.log("   → Listing des prices associes pour reference :");
    const prices = await stripe.prices.list({
      product: existing.id,
      limit: 10,
      active: true,
    });
    for (const price of prices.data) {
      const amount = (price.unit_amount || 0) / 100;
      const interval = price.recurring?.interval || "?";
      console.log(`     - ${price.id} : ${amount}€ ${interval} (active: ${price.active})`);
    }
    console.log(
      "\n⚠️  Si tu veux re-creer, supprime/archive le product existant via Stripe Dashboard d'abord."
    );
    console.log("    Sinon, ajoute juste les IDs ci-dessus dans Vercel env vars.");
    process.exit(0);
  }

  console.log("   ✓ Aucun Product Workwave AI Premium existant\n");

  console.log("2. Plan de creation :");
  console.log("   - Product : Workwave AI Premium");
  console.log("       metadata : { vertical: 'ai', source: 'phase8-2026' }");
  console.log("   - Price monthly : 29,90€ TTC/mois (2990 cents EUR, recurring)");
  console.log("   - Price annual  : 299,00€ TTC/an  (29900 cents EUR, recurring)");
  console.log("                     = 24,92€/mois equivalent (2 mois offerts)\n");

  if (DRY_RUN) {
    console.log("DRY RUN — aucune action executee. Relance sans --dry-run pour creer.");
    return;
  }

  const confirmed = await askConfirm("Confirmer la creation");
  if (!confirmed) {
    console.log("Annule.");
    return;
  }

  console.log("\n3. Creation du Product...");
  const product = await stripe.products.create({
    name: "Workwave AI Premium",
    description:
      "Abonnement freelance tech sur Workwave AI : reception illimitee de projets qualifies par IA, profil mis en avant, badge Pro, sans commission. Resiliable en 1 clic.",
    metadata: {
      vertical: "ai",
      source: "phase8-2026",
    },
  });
  console.log(`   ✓ Product cree : ${product.id}`);

  console.log("\n4. Creation Price monthly (29,90€)...");
  const priceMonthly = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 2990, // 29,90€ TTC
    recurring: { interval: "month" },
    metadata: { vertical: "ai", plan_type: "monthly" },
    nickname: "Workwave AI Premium — Mensuel",
  });
  console.log(`   ✓ Price monthly cree : ${priceMonthly.id}`);

  console.log("\n5. Creation Price annual (299€)...");
  const priceAnnual = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 29900, // 299€ TTC
    recurring: { interval: "year" },
    metadata: { vertical: "ai", plan_type: "annual" },
    nickname: "Workwave AI Premium — Annuel",
  });
  console.log(`   ✓ Price annual cree : ${priceAnnual.id}`);

  console.log("\n\n=== 🎉 SETUP TERMINE ===\n");
  console.log("Ajouter ces variables dans Vercel env vars (production + preview) :\n");
  console.log(`STRIPE_AI_PRODUCT_ID=${product.id}`);
  console.log(`STRIPE_AI_PRICE_MONTHLY_ID=${priceMonthly.id}`);
  console.log(`STRIPE_AI_PRICE_ANNUAL_ID=${priceAnnual.id}\n`);
  console.log(`Mode : ${mode}`);
  if (isLive) {
    console.log("\n⚠️  LIVE mode : ce sont de VRAIS Products / Prices Stripe.");
    console.log("    Pour archiver plus tard : Stripe Dashboard > Products > ce product > Archive");
  }
}

main().catch((e) => {
  console.error("\n❌ Erreur fatale :", e);
  process.exit(1);
});
