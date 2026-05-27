/**
 * Cree le Product + Price one-time Workwave BTP Lead Unlock en LIVE.
 * 9,90 EUR TTC (8,25 EUR HT) = 990 cents.
 * mode payment (pas subscription).
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
  console.log(`\n=== Creation Workwave BTP Lead Unlock — mode ${mode} ===\n`);

  // 1) Idempotence
  const products = await stripe.products.list({ limit: 100, active: true });
  const existing = products.data.find(
    (p) =>
      p.name === "Workwave BTP Lead Unlock" ||
      p.metadata?.product === "btp_lead_unlock"
  );
  if (existing) {
    console.log(`Product deja existant : ${existing.id} (${existing.name})`);
    const prices = await stripe.prices.list({
      product: existing.id,
      limit: 10,
      active: true,
    });
    for (const price of prices.data) {
      console.log(
        `  Price : ${price.id} - ${(price.unit_amount || 0) / 100} EUR (${price.type})`
      );
    }
    process.exit(0);
  }

  // 2) Product
  console.log("1. Creation Product...");
  const product = await stripe.products.create({
    name: "Workwave BTP Lead Unlock",
    description:
      "Workwave Pro BTP : deblocage one-time des coordonnees (nom, email, telephone) d'un particulier sur un projet specifique. Paiement unique 9,90 EUR TTC par lead, sans abonnement, sans engagement.",
    metadata: {
      vertical: "btp",
      product: "btp_lead_unlock",
      source: "sprint13-2026",
    },
  });
  console.log(`   ✓ Product : ${product.id}`);

  // 3) Price one-time 990 cents
  console.log("\n2. Creation Price one-time 9,90 EUR TTC...");
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 990, // 9,90 EUR TTC (8,25 HT)
    metadata: { vertical: "btp", product: "btp_lead_unlock" },
    nickname: "Workwave BTP Lead Unlock — 9,90 EUR TTC",
    // PAS de recurring -> automatique en one-time
  });
  console.log(`   ✓ Price : ${price.id} (${(price.unit_amount || 0) / 100} EUR)`);

  console.log("\n\n=== 🎉 SETUP TERMINE ===\n");
  console.log("Ajouter ces variables dans Vercel env (production + preview + development) :\n");
  console.log(`STRIPE_BTP_LEAD_UNLOCK_PRODUCT_ID=${product.id}`);
  console.log(`STRIPE_BTP_LEAD_UNLOCK_PRICE_ID=${price.id}\n`);

  if (isLive) {
    console.log("⚠️  LIVE mode : ce sont de VRAIS Products / Prices Stripe.");
  }
}

main().catch((e) => {
  console.error("\n❌ Erreur fatale :", e);
  process.exit(1);
});
