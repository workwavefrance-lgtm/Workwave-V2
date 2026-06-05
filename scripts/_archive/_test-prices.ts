import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function main() {
  // List prices for our product
  try {
    const prices = await stripe.prices.list({
      product: "prod_Uac9lTkfHJ7U3C",
      limit: 10,
    });
    console.log(`Prices for prod_Uac9lTkfHJ7U3C:`);
    for (const p of prices.data) {
      console.log(`  - ${p.id}: ${(p.unit_amount||0)/100}€ ${p.recurring?.interval}, active=${p.active}`);
    }
  } catch (e) {
    console.error("❌ prices.list failed:", e);
  }

  // Try retrieve specific
  try {
    const m = await stripe.prices.retrieve("price_1TbQvRLTwdClrqs3fP9YOUk9");
    console.log(`✓ Monthly OK: ${m.id} - ${(m.unit_amount||0)/100}€ ${m.recurring?.interval}, active=${m.active}`);
  } catch (e) {
    console.error("❌ retrieve monthly failed:", e instanceof Error ? `${e.constructor.name}: ${e.message}` : e);
  }
}
main();
