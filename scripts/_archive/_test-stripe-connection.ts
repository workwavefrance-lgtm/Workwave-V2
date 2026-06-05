import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sk = process.env.STRIPE_SECRET_KEY || "";
console.log("Stripe key prefix:", sk.slice(0, 8) + "...");
console.log("Key starts with:", sk.startsWith("sk_live_") ? "LIVE" : sk.startsWith("sk_test_") ? "TEST" : "UNKNOWN");
console.log("Key length:", sk.length);

const stripe = new Stripe(sk, { typescript: true });

async function main() {
  try {
    // Tres simple call
    const balance = await stripe.balance.retrieve();
    console.log("✓ Stripe connection OK, livemode:", balance.livemode);
  } catch (e) {
    console.error("❌ Stripe connection failed:", e instanceof Error ? e.message : e);
  }

  // Try listing products to see if connection works at all
  try {
    const products = await stripe.products.list({ limit: 3 });
    console.log(`✓ products.list OK, ${products.data.length} products retrieved`);
    for (const p of products.data) {
      console.log(`  - ${p.id}: ${p.name}`);
    }
  } catch (e) {
    console.error("❌ products.list failed:", e instanceof Error ? e.message : e);
  }
}
main();
