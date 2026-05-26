/**
 * Reset rate limit signin AI pour un email donne.
 * Supprime toutes les rows ai_signin_attempts recentes pour cet email.
 *
 * Usage : npx tsx scripts/_reset-signin-rate-limit.ts <email>
 */
import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage : npx tsx scripts/_reset-signin-rate-limit.ts <email>");
  process.exit(1);
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Supprime les attempts des 15 dernieres minutes
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: deleted, error } = await sb
    .from("ai_signin_attempts")
    .delete()
    .eq("email", email)
    .gte("created_at", fifteenMinAgo)
    .select("id");

  if (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }

  console.log(`Reset OK. ${deleted?.length || 0} tentative(s) supprimee(s) pour ${email}.`);
  console.log("Tu peux retester signin maintenant.");
}

main().catch((e) => {
  console.error("EXCEPTION:", e);
  process.exit(1);
});
