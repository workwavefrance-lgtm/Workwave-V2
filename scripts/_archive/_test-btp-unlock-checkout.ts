import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const stripeKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_BTP_LEAD_UNLOCK_PRICE_ID;

console.log("STRIPE_SECRET_KEY:", stripeKey?.slice(0, 12) + "...");
console.log("STRIPE_BTP_LEAD_UNLOCK_PRICE_ID:", priceId);

if (!stripeKey || !priceId) {
  console.error("Missing env vars");
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { typescript: true });

async function main() {
  // Step 1: search customer
  console.log("\n1. Search customer pro_id=87622 vertical=btp...");
  try {
    const search = await stripe.customers.search({
      query: `metadata['pro_id']:'87622' AND metadata['vertical']:'btp'`,
      limit: 1,
    });
    console.log(`   Found: ${search.data.length}`);
    if (search.data[0]) {
      console.log(`   id=${search.data[0].id} email=${search.data[0].email}`);
    }
  } catch (e) {
    console.error("Search FAILED:", e instanceof Error ? e.message : e);
  }

  // Step 2: create customer
  console.log("\n2. Create test customer...");
  const customer = await stripe.customers.create({
    email: "test-btp-unlock@workwave.fr",
    name: "Test BTP Unlock",
    metadata: { pro_id: "99999", vertical: "btp", test: "true" },
  });
  console.log(`   id=${customer.id}`);

  // Step 3: create checkout session
  console.log("\n3. Create checkout session...");
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        pro_id: "99999",
        project_id: "1",
        vertical: "btp",
        product: "btp_lead_unlock",
      },
      payment_intent_data: {
        metadata: {
          pro_id: "99999",
          project_id: "1",
          vertical: "btp",
          product: "btp_lead_unlock",
        },
        description: "Test Workwave BTP Lead Unlock",
      },
      success_url: "https://workwave.fr/pro/dashboard/leads?unlocked=1",
      cancel_url: "https://workwave.fr/pro/dashboard/leads?canceled=1",
      locale: "fr",
      billing_address_collection: "auto",
    });
    console.log(`   ✓ Session created: ${session.id}`);
    console.log(`   URL: ${session.url}`);
  } catch (e) {
    console.error("Session creation FAILED:");
    console.error(e instanceof Error ? e.message : e);
    if (e instanceof Stripe.errors.StripeError) {
      console.error("  type:", e.type);
      console.error("  code:", e.code);
      console.error("  raw:", e.raw);
    }
  }

  // Cleanup test customer
  await stripe.customers.del(customer.id);
  console.log("\n4. Cleanup done.");
}

main().catch((e) => {
  console.error("\nFATAL:", e);
  process.exit(1);
});
