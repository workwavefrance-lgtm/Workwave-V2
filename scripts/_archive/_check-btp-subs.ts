import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Abonnes BTP actifs (vertical='btp' ou subscription_product='btp')
  const { data: paying } = await sb
    .from("pros")
    .select("id, name, email, subscription_status, subscription_plan, subscription_product, current_period_end, stripe_subscription_id")
    .in("subscription_status", ["active", "trialing", "past_due"])
    .not("stripe_subscription_id", "is", null);
  console.log(`Abonnes Stripe actifs (toutes verticales) : ${paying?.length || 0}`);
  if (paying && paying.length > 0) {
    console.table(paying.map(p => ({ id: p.id, name: p.name, status: p.subscription_status, product: p.subscription_product, plan: p.subscription_plan, period_end: p.current_period_end })));
  }

  // Trial only
  const { data: trialing } = await sb
    .from("pros")
    .select("id, name, subscription_status, subscription_product")
    .eq("subscription_status", "trialing");
  console.log(`\nEn essai gratuit : ${trialing?.length || 0}`);
}
main();
