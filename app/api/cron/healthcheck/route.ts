/**
 * Cron horaire : healthcheck des routes critiques BTP + AI FR + AI EN.
 *
 * Pingue ~30 URLs en parallèle. Si une route renvoie un code inattendu
 * (typiquement 500 ou 404 sur une route critique), envoie une alerte email
 * IMMÉDIATE à contact@workwave.fr.
 *
 * Pourquoi ça compte : le user pousse plusieurs commits par jour sur 2
 * domaines (workwave.fr BTP + workwaveai.co AI). Cette protection automatique
 * détecte sous 60min toute régression critique non vue par les tests.
 *
 * Auth : Bearer CRON_SECRET (Vercel cron set automatiquement le header).
 *
 * Endpoint : /api/cron/healthcheck (configuré dans vercel.json `crons`).
 */
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const maxDuration = 120;

type RouteCheck = {
  label: string;
  url: string;
  expect: number[];           // codes HTTP acceptés (200/308/etc.)
  critical: boolean;          // true => alerte immédiate ; false => warning silencieux
};

const ROUTES: RouteCheck[] = [
  // ════════ BTP — workwave.fr ════════
  { label: "BTP home",                       url: "https://workwave.fr/",                                       expect: [200], critical: true },
  { label: "BTP listing métier",             url: "https://workwave.fr/plombier",                               expect: [200], critical: true },
  { label: "BTP cat × dept",                 url: "https://workwave.fr/plombier/vienne-86",                     expect: [200], critical: true },
  { label: "BTP cat × ville",                url: "https://workwave.fr/plombier/poitiers",                      expect: [200], critical: true },
  { label: "BTP Marseille agg",              url: "https://workwave.fr/plombier/marseille",                     expect: [200], critical: false },
  { label: "BTP Monaco zone",                url: "https://workwave.fr/plombier/monaco",                        expect: [200], critical: false },
  { label: "BTP dépôt projet",               url: "https://workwave.fr/deposer-projet",                         expect: [200], critical: true },
  { label: "BTP guide prix métier",          url: "https://workwave.fr/plombier/prix",                          expect: [200], critical: true },
  { label: "BTP hub guides prix",            url: "https://workwave.fr/guide-des-prix",                         expect: [200], critical: true },
  { label: "BTP blog",                       url: "https://workwave.fr/blog",                                   expect: [200], critical: false },
  { label: "BTP cgv",                        url: "https://workwave.fr/cgv",                                    expect: [200], critical: false },

  // ════════ AI FR — workwave.fr/ai (redirige → workwaveai.co/en/ai ou sert /ai/* FR) ════════
  { label: "AI-FR home",                     url: "https://workwave.fr/ai",                                     expect: [200], critical: true },
  { label: "AI-FR skill",                    url: "https://workwave.fr/ai/developpement-web",                   expect: [200], critical: true },
  { label: "AI-FR skill × ville",            url: "https://workwave.fr/ai/developpement-web/paris",             expect: [200], critical: true },
  { label: "AI-FR connexion",                url: "https://workwave.fr/ai/connexion",                           expect: [200], critical: true },
  { label: "AI-FR inscription",              url: "https://workwave.fr/ai/inscription",                         expect: [200], critical: true },
  { label: "AI-FR /monde",                   url: "https://workwave.fr/ai/monde/web-development/geneve",        expect: [200], critical: false },

  // ════════ AI EN — workwaveai.co ════════
  { label: "AI-EN home",                     url: "https://www.workwaveai.co/en/ai",                            expect: [200], critical: true },
  { label: "AI-EN skill hub",                url: "https://www.workwaveai.co/en/ai/web-development",            expect: [200], critical: true },
  { label: "AI-EN skill × city TJM",         url: "https://www.workwaveai.co/en/ai/web-development/london",     expect: [200], critical: true },
  { label: "AI-EN skill × city DN",          url: "https://www.workwaveai.co/en/ai/web-development/ubud",       expect: [200], critical: false },
  { label: "AI-EN country hub sourcé",       url: "https://www.workwaveai.co/en/ai/marketing/country/germany",  expect: [200], critical: false },
  { label: "AI-EN state hub",                url: "https://www.workwaveai.co/en/ai/web-development/state/california", expect: [200], critical: false },
  { label: "AI-EN deposer",                  url: "https://www.workwaveai.co/en/ai/deposer",                    expect: [200], critical: true },
  { label: "AI-EN inscription",              url: "https://www.workwaveai.co/en/ai/inscription",                expect: [200], critical: true },

  // ════════ Infra ════════
  { label: "Sitemap-index BTP",              url: "https://workwave.fr/sitemap-index.xml",                      expect: [200], critical: true },
  { label: "Sitemap pros BTP",               url: "https://workwave.fr/sitemap/100.xml",                        expect: [200], critical: false },
  { label: "Sitemap AI EN",                  url: "https://www.workwaveai.co/sitemap-ai-en.xml",                expect: [200], critical: true },
  { label: "robots.txt BTP",                 url: "https://workwave.fr/robots.txt",                             expect: [200], critical: true },
  { label: "robots.txt AI EN",               url: "https://www.workwaveai.co/robots.txt",                       expect: [200], critical: true },
];

type CheckResult = {
  label: string;
  url: string;
  expected: number[];
  actual: number;
  ms: number;
  ok: boolean;
  critical: boolean;
  error?: string;
};

async function checkOne(r: RouteCheck): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(r.url, {
      method: "GET",
      redirect: "manual", // ne suit pas les redirects (308/301 acceptés tels quels si dans expect)
      headers: { "User-Agent": "Workwave-Healthcheck/1.0 (+contact@workwave.fr)" },
      signal: AbortSignal.timeout(20000),
    });
    return {
      label: r.label, url: r.url, expected: r.expect, actual: res.status,
      ms: Date.now() - t0, ok: r.expect.includes(res.status), critical: r.critical,
    };
  } catch (e: unknown) {
    return {
      label: r.label, url: r.url, expected: r.expect, actual: 0,
      ms: Date.now() - t0, ok: false, critical: r.critical,
      error: (e as Error).message,
    };
  }
}

function buildAlertHtml(failures: CheckResult[], allResults: CheckResult[]): string {
  const criticalCount = failures.filter((f) => f.critical).length;
  const warningCount = failures.filter((f) => !f.critical).length;
  const totalMs = allResults.reduce((s, r) => s + r.ms, 0);

  const failuresTable = failures
    .map(
      (f) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">
        ${f.critical ? "🔴" : "🟡"} <strong>${f.label}</strong>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;">
        HTTP ${f.actual || "ERR"} (attendu ${f.expected.join(",")})
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px;">
        ${f.url}
      </td>
    </tr>
    ${f.error ? `<tr><td colspan="3" style="padding:0 12px 8px;font-size:11px;color:#999;font-family:monospace;">${f.error}</td></tr>` : ""}
  `,
    )
    .join("");

  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#fafafa;padding:20px;">
<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
  <div style="background:#fee;border-bottom:2px solid #f55;padding:20px 24px;">
    <h1 style="margin:0;font-size:18px;color:#900;">🚨 Workwave healthcheck — ${criticalCount} critique${criticalCount > 1 ? "s" : ""}, ${warningCount} warning${warningCount > 1 ? "s" : ""}</h1>
    <p style="margin:6px 0 0;font-size:13px;color:#666;">${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} · ${allResults.length} routes · ${totalMs}ms total</p>
  </div>
  <div style="padding:20px 24px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f8f8f8;text-align:left;">
          <th style="padding:8px 12px;font-size:12px;text-transform:uppercase;color:#666;">Route</th>
          <th style="padding:8px 12px;font-size:12px;text-transform:uppercase;color:#666;">Statut</th>
          <th style="padding:8px 12px;font-size:12px;text-transform:uppercase;color:#666;">URL</th>
        </tr>
      </thead>
      <tbody>${failuresTable}</tbody>
    </table>
    <p style="margin:18px 0 0;font-size:12px;color:#999;">Cron horaire · Vercel · /api/cron/healthcheck</p>
  </div>
</div>
</body></html>`;
}

export async function GET(req: Request) {
  // 1. AUTH
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  // Vercel cron envoie automatiquement Bearer CRON_SECRET. Le ping manuel (debug)
  // doit aussi fournir ce header.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. CHECK en parallèle (toutes les routes en même temps)
  const results = await Promise.all(ROUTES.map(checkOne));
  const failures = results.filter((r) => !r.ok);
  const criticalFailures = failures.filter((f) => f.critical);

  // 3. ALERTE si au moins UNE route critique a échoué
  let alertSent = false;
  if (criticalFailures.length > 0 && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Workwave Healthcheck <contact@workwave.fr>",
        to: ["contact@workwave.fr"],
        subject: `🚨 Workwave : ${criticalFailures.length} route critique${criticalFailures.length > 1 ? "s" : ""} KO`,
        html: buildAlertHtml(failures, results),
      });
      alertSent = true;
    } catch (e) {
      console.error("Healthcheck : envoi mail Resend KO", (e as Error).message);
    }
  }

  // 4. RÉPONSE JSON (utile pour debug + monitoring externe éventuel)
  return NextResponse.json(
    {
      ok: criticalFailures.length === 0,
      checkedAt: new Date().toISOString(),
      summary: {
        total: results.length,
        ok: results.filter((r) => r.ok).length,
        critical_failed: criticalFailures.length,
        warnings_failed: failures.filter((f) => !f.critical).length,
        avg_ms: Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length),
      },
      alertSent,
      failures: failures.map((f) => ({
        label: f.label, url: f.url, status: f.actual,
        expected: f.expected, critical: f.critical, ms: f.ms, error: f.error,
      })),
    },
    { status: criticalFailures.length > 0 ? 503 : 200 },
  );
}
