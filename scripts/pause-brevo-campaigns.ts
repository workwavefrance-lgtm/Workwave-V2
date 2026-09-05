/**
 * Met en pause les campagnes Brevo Batch 4 et 5 (Mail 1 presentation)
 * pour eviter qu'elles partent automatiquement demain et apres-demain
 * avec les placeholders cassés. On va les remplacer par notre transactionnel
 * pre-rendu.
 *
 * Usage: npx tsx scripts/pause-brevo-campaigns.ts
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BASE = "https://api.brevo.com/v3";

const CAMPAIGNS_TO_PAUSE = [
  { id: 5, name: "Cold NA - Mail 1 (presentation) - Batch 4" },
  { id: 6, name: "Cold NA - Mail 1 (presentation) - Batch 5" },
];

async function brevo<T>(
  method: string,
  endpoint: string,
  body?: object
): Promise<T | null> {
  const resp = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${endpoint} -> ${resp.status} ${text}`);
  }
  if (resp.status === 204) return null;
  const txt = await resp.text();
  if (!txt) return null;
  return JSON.parse(txt) as T;
}

async function main() {
  for (const c of CAMPAIGNS_TO_PAUSE) {
    console.log(`Pause campagne #${c.id} : ${c.name}`);
    try {
      // Endpoint Brevo : PUT /emailCampaigns/{id}/status/{status}
      // Status possibles : suspended, archive, darchive, sent, queued, replicate, replicateTemplate
      await brevo("PUT", `/emailCampaigns/${c.id}/status/suspended`);
      console.log(`  ✓ Mise en pause OK`);
    } catch (e) {
      const msg = (e as Error).message;
      // Si deja suspended, l'API retourne une erreur, on ignore
      if (msg.includes("400") || msg.includes("already")) {
        console.log(`  (deja suspendue ou autre erreur : ${msg.slice(0, 80)})`);
      } else {
        console.log(`  ❌ Echec : ${msg.slice(0, 200)}`);
      }
    }
  }

  // Verification finale
  console.log("\n=== Verification ===");
  for (const c of CAMPAIGNS_TO_PAUSE) {
    const detail = (await brevo<{ id: number; name: string; status: string }>(
      "GET",
      `/emailCampaigns/${c.id}`
    ))!;
    console.log(`  #${detail.id} ${detail.name} -> status=${detail.status}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
