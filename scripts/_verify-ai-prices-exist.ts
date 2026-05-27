import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function main() {
  const monthlyId = process.env.STRIPE_AI_PRICE_MONTHLY_ID;
  const annualId = process.env.STRIPE_AI_PRICE_ANNUAL_ID;
  console.log("Monthly ID in .env.local:", monthlyId);
  console.log("Annual ID in .env.local:", annualId);

  if (monthlyId) {
    try {
      const p = await stripe.prices.retrieve(monthlyId);
      console.log(`✓ Monthly price OK : ${p.id} - ${(p.unit_amount || 0)/100}€ ${p.recurring?.interval}, active=${p.active}`);
    } catch (e) {
      console.error("❌ Monthly price NOT FOUND :", e instanceof Error ? e.message : e);
    }
  }
  if (annualId) {
    try {
      const p = await stripe.prices.retrieve(annualId);
      console.log(`✓ Annual price OK : ${p.id} - ${(p.unit_amount || 0)/100}€ ${p.recurring?.interval}, active=${p.active}`);
    } catch (e) {
      console.error("❌ Annual price NOT FOUND :", e instanceof Error ? e.message : e);
    }
  }
}
main();
