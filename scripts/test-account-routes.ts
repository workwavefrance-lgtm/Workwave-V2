/** Smoke HTTP sans session, sans soumission ni jeton réel. Pas de crawl de fiches. */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  return nested.flat();
}
const routeOf = (file: string) => "/" + file.replace(/^app\//, "").replace(/\/page\.tsx$/, "").split("/").filter((s) => !s.startsWith("(")).join("/");
async function readPage(url: string): Promise<{ status: number; location: string | null; html: string }> {
  // Node fetch peut ignorer Host ; le client HTTP natif permet de vérifier
  // les redirections liées au domaine sur le serveur local.
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https:") ? httpsGet : httpGet;
    const request = get(url, { headers: { Host: "workwave.fr", "User-Agent": "Workwave-Authorized-Route-Audit/2026-09-12" }, signal: AbortSignal.timeout(30000) }, (response) => {
      response.setEncoding("utf8");
      let html = "";
      response.on("data", (chunk: string) => { html += chunk; });
      response.on("error", reject);
      response.on("end", () => resolve({ status: response.statusCode ?? 0, location: response.headers.location ?? null, html }));
    });
    request.on("error", reject);
  });
}
async function main() {
const base = process.env.WORKWAVE_ROUTE_BASE ?? "http://127.0.0.1:4317";
if (!["http://127.0.0.1:4317", "https://workwave.fr"].includes(base)) throw new Error("Origine de test non autorisée.");
const env = { ...parse(await readFile(".env.local")), ...process.env };
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: sample, error } = await db.from("pros").select("id, slug")
  .is("claimed_by_user_id", null).is("deleted_at", null).not("siret", "is", null).eq("is_active", true).limit(1).maybeSingle();
if (error || !sample) throw new Error("Échantillon public indisponible ; aucune route dynamique testée à l'aveugle.");

const selected = (await files("app")).filter((f) => f.endsWith("/page.tsx")).map((file) => ({ file, template: routeOf(file) }))
  .filter(({ template: p }) => /^\/(admin|pro)(\/|$)/.test(p) || /^\/(en\/)?ai\/(dashboard|connexion|inscription|deposer)(\/|$)/.test(p)
    || /^\/(deposer-projet|unsubscribe(?:-all|-review)?|feedback|enquete-pro|verifier-artisan|test)(\/|$)/.test(p)
    || p.startsWith("/avis/") || /^\/artisan\/[^/]+\/supprimer/.test(p));
selected.push({ file: "app/auth/callback/route.ts", template: "/auth/callback" });
const cases = selected.map((item) => ({ ...item,
  path: item.template.replace("[slug]", sample.slug).replace("[id]", "1").replace("[token]", "audit-invalid-token-no-real-review").replace("[concurrent]", "habitatpresto"),
}));
cases.push(
  { file: "app/(public)/pro/reclamer/[slug]/page.tsx", template: "/pro/reclamer/[slug]", path: "/pro/reclamer/audit-no-such-company-20260912" },
  { file: "app/(public)/pro/alternatives/[concurrent]/page.tsx", template: "/pro/alternatives/[concurrent]", path: "/pro/alternatives/audit-no-such-competitor" },
  { file: "app/(public)/pro/reclamer/[slug]/verification/page.tsx", template: "/pro/reclamer/[slug]/verification", path: `/pro/reclamer/${sample.slug}/verification?attempt=1` },
  { file: "app/(public)/artisan/[slug]/supprimer/verification/page.tsx", template: "/artisan/[slug]/supprimer/verification", path: `/artisan/${sample.slug}/supprimer/verification?attempt=1` },
);

const results: Record<string, unknown>[] = [];
for (const c of cases) {
  const started = Date.now();
  try {
    const r = await readPage(base + c.path);
    const html = r.html;
    const $ = load(html);
    const location = r.location;
    const destination = location ? new URL(location, base).pathname : null;
    const serverError = /Application error: a server-side exception|NEXT_HTTP_ERROR_FALLBACK;500/.test(html);
    let expected = "render or intentional redirect";
    let ok = [200, 307, 308].includes(r.status) && !serverError;
    if (c.path.startsWith("/en/ai/")) { expected = "308 / (EN paused on workwave.fr)"; ok = r.status === 308 && destination === "/"; }
    else if (c.path.startsWith("/admin") && c.path !== "/admin/login") { expected = "307 /admin/login"; ok = r.status === 307 && destination === "/admin/login"; }
    else if (c.path.startsWith("/pro/dashboard") || c.path === "/pro/reclamations") { expected = "307 /pro/connexion"; ok = r.status === 307 && destination === "/pro/connexion"; }
    else if (c.path.startsWith("/ai/dashboard")) { expected = "307 /ai/connexion"; ok = r.status === 307 && destination === "/ai/connexion"; }
    else if (c.path === "/auth/callback") { expected = "307 /pro/connexion sans code OAuth"; ok = r.status === 307 && destination === "/pro/connexion"; }
    else if (c.path === "/pro/reclamer/succes" && base.startsWith("http:")) { expected = "307 /pro/dashboard, résolution du statut réel"; ok = r.status === 307 && destination === "/pro/dashboard"; }
    else if (c.path === "/pro/alternatives") { expected = "308 /pro/sans-abonnement"; ok = r.status === 308 && destination === "/pro/sans-abonnement"; }
    else if (c.path.includes("audit-no-such") || (c.template.endsWith("/verification") && c.template.startsWith("/pro/reclamer/") && !c.path.includes("?"))) { expected = "404"; ok = r.status === 404; }
    if (c.template.startsWith("/artisan/") && c.template.includes("/supprimer")) {
      expected = "page de connexion/support, sans formulaire de suppression";
      ok = r.status === 200 && $('input[name="siret"], input[name="code"]').length === 0;
    }
    results.push({ ...c, status: r.status, destination, expected, ok, h1: $("h1").first().text().trim(), robots: $('meta[name="robots"]').map((_, e) => $(e).attr("content")).get(), serverError, milliseconds: Date.now() - started });
  } catch (error) {
    results.push({ ...c, ok: false, error: error instanceof Error ? error.name : "request_failed", milliseconds: Date.now() - started });
  }
  if (results.length % 20 === 0) console.log(`${results.length}/${cases.length} routes vérifiées (${base})`);
}
const report = { observedAt: new Date().toISOString(), base, compiledBuildId: base.startsWith("http:") ? (await readFile(".next/BUILD_ID", "utf8")).trim() : null, mode: "HTTP without session or submitted forms; fake tokens only", uniqueTemplates: selected.length, cases: results.length, passed: results.filter((r) => r.ok).length, results };
const file = `docs/audits/2026-09-12-routes-accounts-${base.startsWith("http:") ? "local" : "production"}.json`;
await writeFile(file, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ file, templates: report.uniqueTemplates, cases: report.cases, passed: report.passed, failures: results.filter((r) => !r.ok).map((r) => ({ path: r.path, status: r.status, expected: r.expected, error: r.error })) }));

}
main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
