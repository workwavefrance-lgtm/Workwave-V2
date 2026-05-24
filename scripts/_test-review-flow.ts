/**
 * Test du flow d'avis natifs Workwave de bout en bout.
 *
 * 1. Trouve un pro de Poitiers
 * 2. Cree une review pending avec ton email
 * 3. Envoie le mail de sollicitation a workwave.france@gmail.com
 * 4. Output l'URL /avis/[token] pour test direct
 *
 * Exec : npx tsx scripts/_test-review-flow.ts
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Trouve un pro de Poitiers (avec Google rating de preference pour
  // un test plus realiste)
  console.log("Recherche d'un pro de Poitiers...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proRows } = await (sb as any)
    .from("pros")
    .select("id, name, slug, city:cities(name)")
    .eq("postal_code", "86000")
    .is("deleted_at", null)
    .eq("is_active", true)
    .not("google_rating", "is", null)
    .limit(1);

  if (!proRows || proRows.length === 0) {
    console.error("Aucun pro de Poitiers (86000) avec google_rating trouve.");
    process.exit(1);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pro = proRows[0] as any;
  console.log(`OK pro trouve : ${pro.name} (id ${pro.id}, slug ${pro.slug})`);

  // 2. Genere un token et insert une review pending
  const { randomBytes } = await import("crypto");
  const token = randomBytes(24).toString("base64url");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (sb as any)
    .from("pro_reviews")
    .insert({
      pro_id: pro.id,
      project_id: null,
      particulier_email: "workwave.france@gmail.com",
      particulier_name: "Willy Test",
      rating: 1, // placeholder, sera ecrase au submit
      comment: null,
      token,
      status: "pending",
      verified: true,
    });
  if (insertError) {
    console.error("Erreur INSERT pro_reviews :", insertError.message);
    process.exit(1);
  }
  console.log(`OK review pending creee avec token ${token.substring(0, 12)}...`);

  // 3. Envoie le mail Resend
  console.log("Envoi du mail de sollicitation...");
  const { sendReviewRequest } = await import("../lib/email/send-review-request");
  const result = await sendReviewRequest({
    particulierEmail: "workwave.france@gmail.com",
    particulierName: "Willy Test",
    proName: pro.name,
    proSlug: pro.slug,
    proCity: pro.city?.name ?? null,
    token,
  });

  if (result.ok) {
    console.log("✓ Mail envoye a workwave.france@gmail.com");
  } else {
    console.error("✗ Mail NON envoye :", result.error);
  }

  // 4. Output URL test direct
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  console.log("\n========================================");
  console.log("URL DE TEST DIRECT :");
  console.log(`${baseUrl}/avis/${token}`);
  console.log("========================================\n");
  console.log(
    "Ouvre cette URL dans le navigateur OU clique le bouton dans le mail."
  );
  console.log(`Pour voir les avis publies apres soumission : ${baseUrl}/artisan/${pro.slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
