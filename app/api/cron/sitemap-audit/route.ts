/**
 * Cron quotidien : AUDIT DE COMPLÉTUDE DU SITEMAP.
 *
 * Pourquoi : le 08/06/2026, 3 bugs silencieux ont tronqué le sitemap (compteurs
 * figés → ~568k pros invisibles ; builders cat×ville/ai qui timeoutaient → 0 URL ;
 * cap PostgREST 1000 sur les RPC). Découverts par hasard 3 mois trop tard. PLUS
 * JAMAIS : ce cron compare ce que le sitemap DÉCLARE à ce qu'il DEVRAIT déclarer
 * (vs le vrai count en base) et alerte par mail à la moindre régression.
 *
 * Checks :
 *  1. Assez de sous-sitemaps pros déclarés ? (sinon = compteur figé non re-bumpé)
 *  2. /sitemap/2.xml (cat×ville BTP) non vide ?
 *  3. /sitemap/4.xml (/ai) non vide ?
 *  4. Aucun sous-sitemap clé > 50 000 URLs (limite spec) ?
 *
 * Auth : Bearer CRON_SECRET. Endpoint : /api/cron/sitemap-audit (vercel.json).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

export const maxDuration = 300;

const BASE = "https://workwave.fr";
const PROS_PER_SITEMAP = 45000;
const SITEMAP_LIMIT = 50000;
const UA = "Workwave-SitemapAudit/1.0 (+contact@workwave.fr)";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Retry 3× : un seul fetch qui timeout pendant le pic de crawl Google
// (base surchargée → le sous-sitemap qui fait une RPC dépasse le timeout)
// renvoyait -1 et déclenchait une FAUSSE alerte "sitemap KO" (cas 13/06 08:02
// alors que le sitemap servait bien 9809 URLs 30 min plus tard). On ne conclut
// à un échec qu'après 3 tentatives espacées.
async function countUrls(url: string): Promise<number> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(60000),
      });
      if (res.ok) {
        const txt = await res.text();
        return (txt.match(/<url>/g) || []).length;
      }
    } catch {
      /* timeout/réseau : on retente */
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 8000));
  }
  return -1;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const aiIds = [...AI_CATEGORY_IDS];
  const aiInList = `(${aiIds.join(",")})`;

  // 1) Vrais counts en base (filtrés) — exact, car estimated ignore le WHERE.
  const [{ count: nonTech }, { count: tech }] = await Promise.all([
    supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("category_id", "in", aiInList),
    supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("deleted_at", null)
      .in("category_id", aiIds),
  ]);

  const expectedBtpSubs = Math.ceil((nonTech || 0) / PROS_PER_SITEMAP);
  const expectedAiSubs = Math.ceil((tech || 0) / PROS_PER_SITEMAP);

  // 2) Ce que l'index DÉCLARE
  let declaredBtpSubs = -1;
  let declaredAiSubs = -1;
  try {
    const idxRes = await fetch(`${BASE}/sitemap-index.xml`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(30000),
    });
    const idxTxt = await idxRes.text();
    const ids = [...idxTxt.matchAll(/sitemap\/(\d+)\.xml/g)].map((m) => Number(m[1]));
    declaredBtpSubs = ids.filter((id) => id >= 100 && id < 200).length;
    declaredAiSubs = ids.filter((id) => id >= 200).length;
  } catch {
    // garde -1 -> alerte ci-dessous
  }

  // 3) Sous-sitemaps "builders" sensibles (ceux qui timeoutaient)
  const [catCity, aiUrls] = await Promise.all([
    countUrls(`${BASE}/sitemap/2.xml`),
    countUrls(`${BASE}/sitemap/4.xml`),
  ]);

  // 4) Diagnostic
  const issues: string[] = [];
  if (declaredBtpSubs < 0) {
    issues.push("Impossible de lire sitemap-index.xml (fetch KO).");
  } else if (declaredBtpSubs < expectedBtpSubs) {
    issues.push(
      `Compteur pros BTP périmé : ${declaredBtpSubs} sous-sitemaps déclarés < ${expectedBtpSubs} nécessaires (${nonTech} pros non-tech). → bumper proSitemapsCount dans app/sitemap.ts.`
    );
  }
  if (declaredAiSubs >= 0 && declaredAiSubs < expectedAiSubs) {
    issues.push(
      `Compteur pros tech périmé : ${declaredAiSubs} < ${expectedAiSubs} (${tech} pros tech). → bumper aiProSitemapsCount.`
    );
  }
  if (catCity <= 0) {
    issues.push(
      `/sitemap/2.xml (cat×ville BTP) VIDE ou KO (${catCity}). → RPC sitemap_city_cat_counts cassée / migration manquante ?`
    );
  }
  if (aiUrls <= 0) {
    issues.push(
      `/sitemap/4.xml (/ai) VIDE ou KO (${aiUrls}). → RPC sitemap_ai_city_cat_counts cassée ?`
    );
  }
  if (catCity > SITEMAP_LIMIT || aiUrls > SITEMAP_LIMIT) {
    issues.push(
      `Sous-sitemap au-dessus de la limite 50 000 URLs (cat×ville=${catCity}, /ai=${aiUrls}). → relever le seuil ou splitter en N sous-sitemaps.`
    );
  }

  // 5) Alerte mail si régression
  let alertSent = false;
  if (issues.length > 0 && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Workwave Sitemap Audit <contact@workwave.fr>",
        to: [process.env.ADMIN_EMAIL || "workwave.france@gmail.com"],
        subject: `🗺️ Sitemap : ${issues.length} régression${issues.length > 1 ? "s" : ""} détectée${issues.length > 1 ? "s" : ""}`,
        html: `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fafafa;padding:20px;">
<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;padding:24px;">
<h2 style="margin:0 0 12px;font-size:18px;color:#900;">🗺️ Audit sitemap — ${issues.length} problème(s)</h2>
<ul style="font-size:14px;line-height:1.6;color:#333;">${issues.map((i) => `<li>${i}</li>`).join("")}</ul>
<hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
<p style="font-size:12px;color:#888;">pros non-tech : ${nonTech} · tech : ${tech}<br>
sous-sitemaps BTP déclarés : ${declaredBtpSubs}/${expectedBtpSubs} · AI : ${declaredAiSubs}/${expectedAiSubs}<br>
/sitemap/2 (cat×ville) : ${catCity} URLs · /sitemap/4 (/ai) : ${aiUrls} URLs</p>
<p style="font-size:11px;color:#aaa;">Cron quotidien · /api/cron/sitemap-audit</p>
</div></body></html>`,
      });
      alertSent = true;
    } catch (e) {
      console.error("sitemap-audit : envoi alerte KO", (e as Error).message);
    }
  }

  return NextResponse.json(
    {
      ok: issues.length === 0,
      checkedAt: new Date().toISOString(),
      counts: { nonTech, tech },
      subSitemaps: {
        btp: { declared: declaredBtpSubs, expected: expectedBtpSubs },
        ai: { declared: declaredAiSubs, expected: expectedAiSubs },
      },
      builders: { catCity, aiUrls },
      issues,
      alertSent,
    },
    { status: issues.length > 0 ? 503 : 200 }
  );
}
