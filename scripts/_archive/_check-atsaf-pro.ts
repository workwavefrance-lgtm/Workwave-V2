import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Cherche ATSAF
  const { data } = await sb
    .from("pros")
    .select("id, name, email, category_id, stripe_customer_id, claimed_by_user_id, subscription_status")
    .ilike("name", "%ATSAF%");
  console.log("ATSAF pros :");
  console.table(data);

  // Si stripe_customer_id, verifier dans Stripe LIVE
  for (const pro of data || []) {
    if (pro.stripe_customer_id) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
      try {
        const cus = await stripe.customers.retrieve(pro.stripe_customer_id);
        console.log(`\nCustomer ${pro.stripe_customer_id} OK : email=${"deleted" in cus ? "(deleted)" : cus.email}`);
      } catch (e) {
        console.log(`\nCustomer ${pro.stripe_customer_id} FAIL : ${e instanceof Error ? e.message : e}`);
      }
    } else {
      console.log(`\nPro ${pro.id} pas de stripe_customer_id (sera cree au unlock)`);
    }
  }
}
main();
