/**
 * Relance manuellement activateAiSignup pour un signup en pending.
 * Affiche l'erreur exacte si fail.
 *
 * Usage : npx tsx scripts/_retry-activate.ts <signupId>
 */
import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { activateAiSignup } from "@/lib/ai/auth/activate-signup";

const signupId = parseInt(process.argv[2] || "0", 10);
if (!signupId) {
  console.error("Usage : npx tsx scripts/_retry-activate.ts <signupId>");
  process.exit(1);
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: signup } = await sb
    .from("ai_signups")
    .select("*")
    .eq("id", signupId)
    .maybeSingle();

  if (!signup) {
    console.error("Signup introuvable");
    process.exit(1);
  }

  console.log("Signup found :", {
    id: signup.id,
    email: signup.email,
    status: signup.status,
    pro_id: signup.pro_id,
    category_slug: signup.category_slug,
  });

  console.log("\nRelance activateAiSignup...\n");
  const result = await activateAiSignup({
    signupId: signup.id,
    firstName: signup.first_name,
    lastName: signup.last_name,
    email: signup.email,
    categorySlug: signup.category_slug,
    bio: signup.bio || null,
    skills: signup.skills_raw || null,
    github: signup.github_username || null,
    linkedin: signup.linkedin_url || null,
    tjm: signup.tjm_indicatif || null,
    experienceYears: signup.experience_years || null,
    availability: signup.availability || null,
    location: signup.location || null,
  });

  console.log("Resultat :", result);
}

main().catch((e) => {
  console.error("EXCEPTION:", e);
  process.exit(1);
});
