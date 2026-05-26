import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function main() {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });

  console.log(`${endpoints.data.length} webhook endpoint(s) configures en LIVE :\n`);
  for (const ep of endpoints.data) {
    console.log(`URL: ${ep.url}`);
    console.log(`  Status: ${ep.status}`);
    console.log(`  Events (${ep.enabled_events.length}):`);
    for (const ev of ep.enabled_events) {
      console.log(`    - ${ev}`);
    }
    console.log();
  }

  const required = [
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_failed",
    "invoice.payment_succeeded",
  ];

  console.log("\nVerification des events requis pour Workwave AI :");
  for (const ev of required) {
    const found = endpoints.data.some(
      (ep) =>
        ep.url.includes("workwave.fr") &&
        (ep.enabled_events.includes(ev) || ep.enabled_events.includes("*"))
    );
    console.log(`  ${found ? "✓" : "❌"} ${ev}`);
  }
}
main().catch((e) => console.error(e));
