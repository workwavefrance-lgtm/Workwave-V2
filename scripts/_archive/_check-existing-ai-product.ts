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
  console.log(`Mode : ${mode}`);
  console.log("Recherche de Products Workwave AI Premium existants...\n");

  const products = await stripe.products.list({ limit: 100, active: true });

  const aiProducts = products.data.filter(
    (p) =>
      p.metadata?.vertical === "ai" ||
      p.name === "Workwave AI Premium" ||
      p.name.toLowerCase().includes("workwave ai")
  );

  if (aiProducts.length === 0) {
    console.log("Aucun Product Workwave AI Premium trouvé. On peut creer en LIVE.");
    return;
  }

  for (const product of aiProducts) {
    console.log(`Product : ${product.id} (${product.name})`);
    console.log(`  metadata: ${JSON.stringify(product.metadata)}`);
    const prices = await stripe.prices.list({
      product: product.id,
      limit: 10,
      active: true,
    });
    for (const price of prices.data) {
      const amount = (price.unit_amount || 0) / 100;
      const interval = price.recurring?.interval || "one-time";
      console.log(`  Price : ${price.id} - ${amount}€ ${interval} (active: ${price.active})`);
    }
    console.log();
  }
}
main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
