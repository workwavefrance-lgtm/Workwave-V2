/**
 * Debug : pourquoi un freelance AI ne recoit pas le code OTP de connexion.
 *
 * Usage : npx tsx scripts/_debug-signin-ai.ts <email>
 * Ex.   : npx tsx scripts/_debug-signin-ai.ts ludivine@example.com
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage : npx tsx scripts/_debug-signin-ai.ts <email>");
  process.exit(1);
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`\n=== DEBUG SIGNIN AI pour ${email} ===\n`);

  // 1) Cherche row dans ai_signups
  const { data: signup } = await sb
    .from("ai_signups")
    .select("id, email, status, pro_id, plan, category_slug, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  console.log("1) ai_signups :", signup || "AUCUN SIGNUP");

  // 2) Cherche row dans pros tech (filtres EXACTS du signin-code.ts)
  const { data: pro } = await sb
    .from("pros")
    .select(
      "id, name, email, claimed_by_user_id, category_id, is_active, deleted_at, source, subscription_status, subscription_product"
    )
    .eq("email", email)
    .in("category_id", [43, 44, 45, 46, 47, 48])
    .maybeSingle();
  console.log("\n2) pros (sans filtre actif) :", pro || "AUCUN PRO TECH");

  if (pro) {
    console.log("\n   Verifications des filtres signin-code.ts :");
    console.log("   - is_active = true                :", pro.is_active);
    console.log("   - deleted_at IS NULL              :", pro.deleted_at === null);
    console.log("   - claimed_by_user_id IS NOT NULL  :", pro.claimed_by_user_id !== null);
    console.log("   - subscription_status != canceled :", pro.subscription_status !== "canceled");
    const wouldMatch =
      pro.is_active &&
      pro.deleted_at === null &&
      pro.claimed_by_user_id !== null &&
      pro.subscription_status !== "canceled";
    console.log(`   → ${wouldMatch ? "✓ Le pro EST trouve par signin-code" : "✗ Le pro N'EST PAS trouve par signin-code"}`);
  }

  // 3) Cherche auth.users via getUserByEmail
  const { data: authData } = await sb.auth.admin.listUsers();
  const authUser = authData?.users?.find((u) => u.email === email);
  console.log("\n3) auth.users :", authUser ? {
    id: authUser.id,
    email: authUser.email,
    email_confirmed_at: authUser.email_confirmed_at,
    created_at: authUser.created_at,
  } : "AUCUN AUTH USER");

  // 4) Cherche les tentatives recentes
  const { data: attempts } = await sb
    .from("ai_signin_attempts")
    .select("id, email, status, error_reason, ip, created_at, expires_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(10);
  console.log("\n4) ai_signin_attempts (10 dernieres) :");
  if (attempts && attempts.length) {
    attempts.forEach((a) => {
      console.log(`   - [${a.created_at}] status=${a.status} reason=${a.error_reason || "-"}`);
    });
  } else {
    console.log("   AUCUNE TENTATIVE");
  }

  console.log("\n=== FIN DEBUG ===\n");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
