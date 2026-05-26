import { config } from "dotenv";
import * as path from "path";
import Stripe from "stripe";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function main() {
  try {
    const configs = await stripe.billingPortal.configurations.list({ limit: 5 });
    if (configs.data.length === 0) {
      console.log("❌ Aucun Customer Portal configure en LIVE mode.");
      console.log("    -> Aller dans Stripe Dashboard > Settings > Billing > Customer portal");
      console.log("    -> Activate the customer portal");
      return;
    }
    for (const cfg of configs.data) {
      console.log(`Config: ${cfg.id} (default: ${cfg.is_default}, active: ${cfg.active})`);
      console.log(`  Features:`);
      console.log(`    - customer_update: ${cfg.features.customer_update.enabled}`);
      console.log(`    - invoice_history: ${cfg.features.invoice_history.enabled}`);
      console.log(`    - payment_method_update: ${cfg.features.payment_method_update.enabled}`);
      console.log(`    - subscription_cancel: ${cfg.features.subscription_cancel.enabled}`);
      console.log(`    - subscription_update: ${cfg.features.subscription_update.enabled}`);
    }
  } catch (e) {
    console.error("Erreur :", e instanceof Error ? e.message : e);
  }
}
main();
