/**
 * Pull GA4 Data API : trafic + conversions sur workwave.fr.
 * Property 505878735 (extrait de l'URL analytics.google.com a369145792p505878735).
 *
 * Auth : ADC (~/.config/gcloud/application_default_credentials.json).
 * Scope requis : https://www.googleapis.com/auth/analytics.readonly
 * Si "insufficient scopes" → relancer :
 *   gcloud auth application-default login --scopes="https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform"
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { GoogleAuth } from "google-auth-library";

const PROPERTY_ID = "505878735";

async function runReport(body: unknown) {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`;
  const res = await client.request({ url, method: "POST", data: body });
  return res.data as {
    rows?: Array<{ dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }>;
    rowCount?: number;
  };
}

async function main() {
  // 1) Vue d'ensemble 28 jours : users, sessions, engaged sessions, conversions
  console.log("══════════ GA4 · 28 derniers jours (workwave.fr) ══════════\n");
  const overview = await runReport({
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    metrics: [
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagedSessions" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
  });
  const m = overview.rows?.[0]?.metricValues || [];
  const labels = ["Utilisateurs", "Sessions", "Pages vues", "Sessions engagées", "Durée moy. session (s)", "Taux rebond"];
  m.forEach((v, i) => {
    let val = v.value;
    if (labels[i] === "Durée moy. session (s)") val = `${Math.round(Number(v.value))}s`;
    if (labels[i] === "Taux rebond") val = `${(Number(v.value) * 100).toFixed(1)}%`;
    console.log(`  ${labels[i].padEnd(26)} ${val}`);
  });

  // 2) Top pages 28 jours
  console.log("\n══════════ Top 12 pages (28j, par pages vues) ══════════\n");
  const pages = await runReport({
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 12,
  });
  for (const r of pages.rows || []) {
    const p = r.dimensionValues?.[0]?.value || "?";
    const views = r.metricValues?.[0]?.value || "0";
    const users = r.metricValues?.[1]?.value || "0";
    console.log(`  ${views.padStart(6)} vues  ${users.padStart(5)} users  ${p.slice(0, 60)}`);
  }

  // 3) Sessions sur le funnel projet : /deposer-projet et /deposer-projet/merci
  console.log("\n══════════ Funnel dépôt projet (28j) ══════════\n");
  const funnel = await runReport({
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
    dimensionFilter: {
      filter: {
        fieldName: "pagePath",
        stringFilter: { matchType: "CONTAINS", value: "deposer-projet" },
      },
    },
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 20,
  });
  if (!funnel.rows?.length) console.log("  (aucune vue sur /deposer-projet : bizarre, à vérifier)");
  for (const r of funnel.rows || []) {
    const p = r.dimensionValues?.[0]?.value || "?";
    const views = r.metricValues?.[0]?.value || "0";
    const users = r.metricValues?.[1]?.value || "0";
    console.log(`  ${views.padStart(6)} vues  ${users.padStart(5)} users  ${p}`);
  }

  // 4) Sources de trafic
  console.log("\n══════════ Sources de trafic (28j, top 8) ══════════\n");
  const channels = await runReport({
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 8,
  });
  for (const r of channels.rows || []) {
    const ch = r.dimensionValues?.[0]?.value || "?";
    const sess = r.metricValues?.[0]?.value || "0";
    const users = r.metricValues?.[1]?.value || "0";
    console.log(`  ${sess.padStart(6)} sessions  ${users.padStart(5)} users  ${ch}`);
  }
}

main().catch((e) => {
  const msg = e?.response?.data ? JSON.stringify(e.response.data) : e.message;
  console.error("ERREUR:", msg);
  process.exit(1);
});
