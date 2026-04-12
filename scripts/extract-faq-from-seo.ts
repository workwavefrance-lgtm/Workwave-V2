/**
 * Extrait les FAQ du contenu markdown des seo_pages existantes
 * et les stocke dans la colonne faq_json (JSONB).
 *
 * Usage : npx tsx scripts/extract-faq-from-seo.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type FaqItem = { question: string; answer: string };

function extractFaqFromMarkdown(content: string): FaqItem[] {
  const faqs: FaqItem[] = [];

  // Split par ### (H3 = questions FAQ)
  const sections = content.split(/^### /gm);

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split("\n");
    const questionLine = lines[0]?.trim();
    if (!questionLine) continue;

    // La question doit finir par ?
    if (!questionLine.includes("?")) continue;

    // La reponse = tout ce qui suit, nettoye
    const answerLines = lines
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("##"));

    const answer = answerLines.join(" ").trim();
    if (!answer) continue;

    faqs.push({
      question: questionLine.replace(/\?$/, "").trim() + " ?",
      answer,
    });
  }

  return faqs;
}

async function main() {
  // Charger toutes les seo_pages sans faq_json
  const { data: pages, error } = await supabase
    .from("seo_pages")
    .select("id, slug, content")
    .is("faq_json", null);

  if (error) {
    console.error("Erreur chargement seo_pages:", error);
    process.exit(1);
  }

  console.log(`${pages?.length || 0} pages a traiter`);

  let updated = 0;
  let skipped = 0;

  for (const page of pages || []) {
    const faqs = extractFaqFromMarkdown(page.content);

    if (faqs.length === 0) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("seo_pages")
      .update({ faq_json: faqs })
      .eq("id", page.id);

    if (updateError) {
      console.error(`Erreur page ${page.slug}:`, updateError);
    } else {
      updated++;
    }
  }

  console.log(`\nTermine :`);
  console.log(`  ${updated} pages avec FAQ extraites`);
  console.log(`  ${skipped} pages sans FAQ`);
}

main().catch(console.error);
