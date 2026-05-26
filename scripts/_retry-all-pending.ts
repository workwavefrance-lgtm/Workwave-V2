/**
 * Relance activateAiSignup pour tous les ai_signups en status='pending'.
 * Affiche le resultat de chacun.
 */
import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { activateAiSignup } from "@/lib/ai/auth/activate-signup";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pendings } = await sb
    .from("ai_signups")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!pendings || pendings.length === 0) {
    console.log("Aucun signup en pending.");
    return;
  }

  console.log(`${pendings.length} signups en pending. Relance...\n`);

  for (const s of pendings) {
    console.log(`[#${s.id}] ${s.email} (${s.category_slug}, ${s.plan})`);
    const r = await activateAiSignup({
      signupId: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email,
      categorySlug: s.category_slug,
      bio: s.bio || null,
      skills: s.skills_raw || null,
      github: s.github_username || null,
      linkedin: s.linkedin_url || null,
      tjm: s.tjm_indicatif || null,
      experienceYears: s.experience_years || null,
      availability: s.availability || null,
      location: s.location || null,
    });
    if (r.ok) {
      console.log(`   ✓ ACTIVE — proId=${r.proId} createdNewUser=${r.createdNewUser}`);
    } else {
      console.log(`   ✗ FAIL — ${r.reason}`);
    }
  }
}

main().catch((e) => {
  console.error("EXCEPTION:", e);
  process.exit(1);
});
