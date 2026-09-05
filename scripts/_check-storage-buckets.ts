/**
 * Vérifie que les buckets Supabase Storage existent et sont accessibles
 * en upload (cause #1 des erreurs "Erreur inattendue lors de l'upload").
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data, error } = await sb.storage.listBuckets();
  if (error) {
    console.error("✗ listBuckets failed :", error.message);
    process.exit(1);
  }
  console.log("Buckets existants :");
  for (const b of data || []) {
    console.log(`  - ${b.name} (public=${b.public}, id=${b.id})`);
  }

  for (const want of ["pro-logos", "pro-photos"]) {
    const exists = (data || []).some((b) => b.name === want);
    console.log(`\n${want} : ${exists ? "✓ existe" : "✗ MANQUANT"}`);
    if (!exists) continue;

    // Tester un upload de 1 byte pour valider les permissions
    const testPath = `_health_${Date.now()}.txt`;
    const blob = new Blob(["x"], { type: "text/plain" });
    const { error: upErr } = await sb.storage.from(want).upload(testPath, blob);
    if (upErr) {
      console.log(`  ✗ Upload test KO : ${upErr.message}`);
    } else {
      console.log(`  ✓ Upload test OK`);
      await sb.storage.from(want).remove([testPath]);
    }
  }
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
