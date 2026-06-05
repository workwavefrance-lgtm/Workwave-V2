/**
 * Cree le Product + 2 Prices Workwave AI Premium en LIVE.
 * NON-INTERACTIF : utilise STRIPE_SECRET_KEY de .env.local (suppose live).
 *
 * Securite : verifie idempotence (refuse si un product 'Workwave AI Premium'
 * existe deja).
 */
import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("❌ STRIPE_SECRET_KEY manquante");
  process.exit(1);
}

const isLive = stripeKey.startsWith("sk_live_");
const mode = isLive ? "🔴 LIVE" : "🟢 TEST";

const stripe = new Stripe(stripeKey, { typescript: true });

async function main() {
  console.log(`\n=== Creation Workwave AI Premium — mode ${mode} ===\n`);

  // 1) Verifier idempotence
  const products = await stripe.products.list({ limit: 100, active: true });
  const existing = products.data.find(
    (p) => p.name === "Workwave AI Premium" || p.metadata?.vertical === "ai"
  );
  if (existing) {
    console.error(
      `❌ Product 'Workwave AI Premium' deja existant (${existing.id}). Annule pour eviter doublon.`
    );
    process.exit(1);
  }

  // 2) Creer le Product
  console.log("1. Creation du Product...");
  const product = await stripe.products.create({
    name: "Workwave AI Premium",
    description:
      "Abonnement freelance Workwave AI : reception illimitee de projets qualifies par IA (tech, marketing, finance, juridique, RH, design, creation, audiovisuel), profil mis en avant, badge Pro, sans commission. Resiliable en 1 clic.",
    metadata: {
      vertical: "ai",
      source: "phase8-2026",
    },
  });
  console.log(`   ✓ Product cree : ${product.id}`);

  // 3) Creer Price monthly
  console.log("\n2. Creation Price monthly (29,90€)...");
  const priceMonthly = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 2990,
    recurring: { interval: "month" },
    metadata: { vertical: "ai", plan_type: "monthly" },
    nickname: "Workwave AI Premium — Mensuel",
  });
  console.log(`   ✓ Price monthly : ${priceMonthly.id}`);

  // 4) Creer Price annual
  console.log("\n3. Creation Price annual (299€)...");
  const priceAnnual = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 29900,
    recurring: { interval: "year" },
    metadata: { vertical: "ai", plan_type: "annual" },
    nickname: "Workwave AI Premium — Annuel",
  });
  console.log(`   ✓ Price annual : ${priceAnnual.id}`);

  console.log("\n\n=== 🎉 SETUP TERMINE ===\n");
  console.log("Ajouter ces variables dans Vercel env vars (production + preview + development) :\n");
  console.log(`STRIPE_AI_PRODUCT_ID=${product.id}`);
  console.log(`STRIPE_AI_PRICE_MONTHLY_ID=${priceMonthly.id}`);
  console.log(`STRIPE_AI_PRICE_ANNUAL_ID=${priceAnnual.id}\n`);

  if (isLive) {
    console.log("⚠️  LIVE mode : ce sont de VRAIS Products / Prices Stripe.");
    console.log("    Apparaitront dans dashboard.stripe.com > Products (LIVE)");
  }
}

main().catch((e) => {
  console.error("\n❌ Erreur fatale :", e);
  process.exit(1);
});
