import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { activateAiSignup } from "../lib/ai/auth/activate-signup";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: pending } = await sb
    .from("ai_signups")
    .select("*")
    .eq("status", "pending")
    .is("pro_id", null);
  console.log(`Pending signups : ${pending?.length || 0}`);
  for (const s of pending || []) {
    console.log(`\n--- Retry signup #${s.id} (${s.first_name} ${s.last_name}, ${s.email}) ---`);
    const r = await activateAiSignup({
      signupId: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email,
      categorySlug: s.category_slug,
      bio: s.bio,
      skills: s.skills_raw,
      github: s.github_username,
      linkedin: s.linkedin_url,
      tjm: s.tjm_indicatif,
      experienceYears: s.experience_years,
      availability: s.availability,
      location: s.location,
    });
    console.log(`  result: ${JSON.stringify(r)}`);
  }
}
main();
