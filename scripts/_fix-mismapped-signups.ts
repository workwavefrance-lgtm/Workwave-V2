/**
 * Fix pros crees via ai_signups avec un mauvais category_id a cause du bug
 * du CATEGORY_ID_MAP dans activate-signup.ts (43 et 44 swappes).
 *
 * On parcourt ai_signups (status='validated' + pro_id NOT NULL), on
 * recalcule le category_id correct via le NOUVEAU CATEGORY_ID_MAP, et on
 * met a jour pros.category_id si different.
 *
 * Safe / idempotent. Affiche un diff avant chaque UPDATE.
 */
import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Source de verite : ce qu'on a en BDD (verifie via _check-cat-mapping.ts)
const CORRECT_MAP: Record<string, number> = {
  "developpement-web": 43,
  "intelligence-artificielle": 44,
  "cloud-devops": 45,
  "no-code-automation": 46,
  "data-analytics": 47,
  "design-produit": 48,
  "marketing-communication": 79,
  "design-creation": 80,
  "strategie-management": 81,
  "finance-comptabilite": 82,
  "rh-recrutement": 83,
  "juridique-conseil": 85,
  "redaction-copywriting": 86,
  "audiovisuel-medias": 87,
};

async function main() {
  const { data: signups } = await sb
    .from("ai_signups")
    .select("id, email, category_slug, pro_id, status")
    .eq("status", "validated")
    .not("pro_id", "is", null);

  if (!signups || signups.length === 0) {
    console.log("Aucun signup valide a verifier.");
    return;
  }

  console.log(`Inspection de ${signups.length} signups valides...\n`);

  let fixed = 0;
  let alreadyOk = 0;

  for (const s of signups) {
    const expected = CORRECT_MAP[s.category_slug];
    if (!expected) {
      console.warn(`  ⚠ signup ${s.id} (${s.email}) : category_slug inconnu '${s.category_slug}', skip.`);
      continue;
    }

    const { data: pro } = await sb
      .from("pros")
      .select("id, name, category_id")
      .eq("id", s.pro_id)
      .maybeSingle();

    if (!pro) {
      console.warn(`  ⚠ signup ${s.id} : pro_id ${s.pro_id} introuvable.`);
      continue;
    }

    if (pro.category_id === expected) {
      alreadyOk++;
      continue;
    }

    console.log(
      `  fix signup ${s.id} (${s.email}, '${s.category_slug}') : pros.${pro.id} category_id ${pro.category_id} -> ${expected}`
    );

    const { error } = await sb
      .from("pros")
      .update({ category_id: expected })
      .eq("id", pro.id);

    if (error) {
      console.error(`    ✗ UPDATE failed : ${error.message}`);
    } else {
      fixed++;
    }
  }

  console.log(`\nResume : ${fixed} pros corriges, ${alreadyOk} deja OK.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
