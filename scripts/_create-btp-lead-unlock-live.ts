/**
 * Cree le Product + Price Workwave BTP Lead Unlock en LIVE.
 * NON-INTERACTIF. Verifie idempotence avant d'ajouter.
 *
 * Apres execution, AJOUTER MANUELLEMENT dans Vercel env vars production :
 *   STRIPE_BTP_LEAD_UNLOCK_PRODUCT_ID=prod_xxx
 *   STRIPE_BTP_LEAD_UNLOCK_PRICE_ID=price_xxx
 *
 * Faire via : `printf "value" | npx vercel env add KEY production`
 * (cf. lecon CLAUDE.md 27/05 sur echo vs printf).
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
  console.log(`\n=== Setup BTP Lead Unlock — mode ${mode} ===\n`);

  // 1) Idempotence : ne pas dupliquer
  const products = await stripe.products.list({ limit: 100, active: true });
  const existing = products.data.find(
    (p) =>
      p.name === "Workwave BTP Lead Unlock" ||
      (p.metadata?.product === "btp_lead_unlock")
  );
  if (existing) {
    console.error(
      `❌ Product 'Workwave BTP Lead Unlock' deja existant (${existing.id}). Annule.`
    );
    const prices = await stripe.prices.list({ product: existing.id, limit: 5 });
    for (const p of prices.data) {
      console.log(
        `  Price existant : ${p.id} - ${(p.unit_amount || 0) / 100}€ ${p.type} (active=${p.active})`
      );
    }
    process.exit(1);
  }

  // 2) Cree le Product
  console.log("1. Creation Product...");
  const product = await stripe.products.create({
    name: "Workwave BTP Lead Unlock",
    description:
      "Deblocage des coordonnees d'un particulier sur Workwave BTP. Paiement one-time, par lead. Le pro recoit immediatement le telephone et email du particulier apres paiement, et peut le contacter directement (sans commission, sans intermediaire).",
    metadata: {
      vertical: "btp",
      product: "btp_lead_unlock",
      source: "sprint13-2026",
    },
  });
  console.log(`   ✓ Product : ${product.id}`);

  // 3) Cree le Price one-time (pas recurring)
  console.log("\n2. Creation Price (9,90€ TTC one-time)...");
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 990, // 9,90€ TTC pile
    // Pas de recurring : c'est du paiement one-time
    nickname: "Workwave BTP Lead Unlock — 9,90€ TTC",
    metadata: {
      vertical: "btp",
      product: "btp_lead_unlock",
      type: "one_time",
    },
  });
  console.log(`   ✓ Price : ${price.id}`);

  console.log("\n\n=== 🎉 SETUP TERMINE ===\n");
  console.log("Ajouter dans Vercel env (production + development) :\n");
  console.log(`STRIPE_BTP_LEAD_UNLOCK_PRODUCT_ID=${product.id}`);
  console.log(`STRIPE_BTP_LEAD_UNLOCK_PRICE_ID=${price.id}\n`);

  console.log("Commandes a executer (avec printf, PAS echo) :");
  console.log(
    `  printf "${product.id}" | npx vercel env add STRIPE_BTP_LEAD_UNLOCK_PRODUCT_ID production`
  );
  console.log(
    `  printf "${price.id}" | npx vercel env add STRIPE_BTP_LEAD_UNLOCK_PRICE_ID production`
  );
  console.log(
    `  printf "${product.id}" | npx vercel env add STRIPE_BTP_LEAD_UNLOCK_PRODUCT_ID development`
  );
  console.log(
    `  printf "${price.id}" | npx vercel env add STRIPE_BTP_LEAD_UNLOCK_PRICE_ID development`
  );
}

main().catch((e) => {
  console.error("\n❌ Erreur fatale :", e);
  process.exit(1);
});
