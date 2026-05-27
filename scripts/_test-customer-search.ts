import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function main() {
  // Test the EXACT search query from create-ai-checkout.ts
  const proId = 1432477;
  try {
    const search = await stripe.customers.search({
      query: `metadata['pro_id']:'${proId}' AND metadata['vertical']:'ai'`,
      limit: 1,
    });
    console.log(`Customer search for pro_id=${proId} vertical=ai:`);
    console.log(`  Found ${search.data.length} customer(s)`);
    for (const c of search.data) {
      console.log(`  - ${c.id}: email=${c.email}, name=${c.name}, metadata=${JSON.stringify(c.metadata)}`);
    }
  } catch (e) {
    console.error("❌ customers.search failed:", e instanceof Error ? e.message : e);
  }

  // Also try a checkout creation to reproduce the error
  console.log("\n\nAttempt checkout creation...");
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_AI_PRICE_MONTHLY_ID!, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { pro_id: String(proId), vertical: "ai" },
      },
      metadata: { pro_id: String(proId), vertical: "ai" },
      customer_email: "test-stripe-debug@workwave.fr",
      success_url: "https://workwave.fr/ai/dashboard/abonnement?activated=1",
      cancel_url: "https://workwave.fr/ai/dashboard/abonnement?canceled=1",
      locale: "fr",
    });
    console.log(`✓ Checkout session created: ${session.id}`);
    console.log(`  URL: ${session.url?.slice(0, 80)}...`);
  } catch (e) {
    console.error("❌ Checkout creation failed:");
    if (e instanceof Stripe.errors.StripeError) {
      console.error(`  type: ${e.type}`);
      console.error(`  code: ${e.code}`);
      console.error(`  message: ${e.message}`);
      console.error(`  raw: ${JSON.stringify(e.raw).slice(0, 500)}`);
    } else {
      console.error(`  ${e instanceof Error ? e.message : e}`);
    }
  }
}
main();
