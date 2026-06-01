/**
 * Revalidation à la demande du sitemap (index + sous-sitemaps).
 *
 * POURQUOI : app/sitemap.ts a `revalidate = 86400`. Sur Vercel, le cache ISR de
 * l'index /sitemap-index.xml PERSISTE à travers les déploiements — un simple
 * redeploy ne le rafraîchit PAS. Après un gros scrape (le nb de batches change),
 * l'index reste figé sur l'ancien `generateSitemaps()` jusqu'à expiration du
 * timer 24h. Cet endpoint force la régénération immédiate.
 *
 * QUAND L'APPELER : après chaque gros INSERT/scrape de `pros` (le nombre de
 * sous-sitemaps /artisan dépend du count exact).
 *
 * Auth : Bearer ${CRON_SECRET} (même secret que les crons).
 *
 * Usage :
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     https://workwave.fr/api/revalidate-sitemap
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const PATHS = [
  "/sitemap-index.xml",
  "/sitemap/[__metadata_id__]",
  "/sitemap-ai-en.xml",
  "/robots.txt",
];

function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const revalidated: string[] = [];
  for (const p of PATHS) {
    try {
      if (p.includes("[")) {
        // route dynamique (sous-sitemaps) → revalidation de toutes les instances
        revalidatePath(p, "page");
      } else {
        revalidatePath(p);
      }
      revalidated.push(p);
    } catch {
      // on continue : un path peut ne pas exister selon l'environnement
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated,
    note: "Le sitemap-index sera régénéré au prochain hit (count exact des pros).",
  });
}

export async function POST(req: Request) {
  return handle(req);
}

// GET autorisé aussi (pratique pour un curl rapide), même garde Bearer.
export async function GET(req: Request) {
  return handle(req);
}
