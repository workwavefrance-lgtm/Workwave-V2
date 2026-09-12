// Lecture seule : GET publics uniquement, deux requêtes simultanées au maximum.
// Exécution volontaire : node scripts/audit-public-routes.mjs
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

const BASE = "https://workwave.fr";
const OUTPUT = "docs/audits/2026-09-12-routes-public.json";
const startedAt = new Date().toISOString();
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const normalize = (file) => "/" + file.replace(/^app\//, "").split("/").filter((s) => !/^\(.+\)$/.test(s)).join("/").replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
const pathsManifest = JSON.parse(fs.readFileSync(".next/server/app-paths-manifest.json", "utf8"));
const routesManifest = JSON.parse(fs.readFileSync(".next/routes-manifest.json", "utf8"));
const pages = walk("app").filter((p) => /^app\/\((public|ai|ai-en)\)\//.test(p) && p.endsWith("/page.tsx"));
const delegated = (route) => /^\/pro(?:\/|$)/.test(route) || /(?:^|\/)(?:connexion|inscription|dashboard|deposer|deposer-projet|supprimer|avis|unsubscribe(?:-all|-review)?|verifier-artisan|feedback|enquete-pro|test)(?:\/|$)/.test(route);
const inventory = pages.map((source) => ({ template: normalize(source), source, compiled: Boolean(pathsManifest[source.replace(/^app/, "").replace(/\.tsx$/, "")]), owner: delegated(normalize(source)) ? "root_accounts_forms" : "public_seo", exerciseIds: [] }));
const metadata = [["/robots.txt", "app/robots.ts"], ["/manifest.webmanifest", "app/manifest.ts"], ["/sitemap-index.xml", "app/sitemap-index.xml/route.ts"], ["/sitemap-fraicheur.xml", "app/sitemap-fraicheur.xml/route.ts"], ["/flux-mises-a-jour.xml", "app/flux-mises-a-jour.xml/route.ts"], ["/sitemap-ai-en.xml", "app/sitemap-ai-en.xml/route.ts"], ["/sitemap/[__metadata_id__]", "app/sitemap.ts"], ["/llms.txt", "app/llms.txt/route.ts"], ["/icon.png", "app/icon.png"], ["/apple-icon.png", "app/apple-icon.png"], ["/favicon.ico", "app/favicon.ico"], ["/opengraph-image", "app/opengraph-image.tsx"]];
inventory.push(...metadata.map(([template, source]) => ({ template, source, owner: "public_seo", compiled: Object.keys(pathsManifest).includes(`${template}/route`), exerciseIds: [] })));
const proImageRoute = Object.keys(pathsManifest).find((key) => key.startsWith("/(public)/pro/opengraph-image") && key.endsWith("/route"))?.replace("/(public)", "").replace(/\/route$/, "");
if (proImageRoute) {
  metadata.push([proImageRoute, "app/(public)/pro/opengraph-image.tsx"]);
  inventory.push({ template: proImageRoute, source: "app/(public)/pro/opengraph-image.tsx", owner: "public_seo", compiled: true, exerciseIds: [] });
}
const plan = [];
function add(template, url, expected = [200], note = "", kind = "representative") { plan.push({ id: `public-${String(plan.length + 1).padStart(3, "0")}`, template, url: new URL(url, BASE).href, expected, note, kind }); }
for (const route of ["/", "/recherche", "/mentions-legales", "/cgu", "/cgv", "/a-propos", "/departements", "/guide-des-prix", "/blog", "/barometre-artisans", "/barometre-prix-artisans", "/barometre-metiers-artisans", "/barometre-penurie-artisans", "/barometre-artisans-belgique", "/trouver-des-chantiers", "/trouver-des-clients"]) add(route, route);
for (const [template, url] of [
  ["/[metier]", "/plombier"], ["/[metier]/[location]", "/plombier/poitiers"], ["/[metier]/[location]", "/plombier/vienne-86"], ["/[metier]/[location]", "/plombier/paris"], ["/[metier]/[location]", "/plafonneur/bruxelles"],
  ["/[metier]/[location]/page/[n]", "/plombier/poitiers/page/2"], ["/[metier]/[location]/[ville]", "/plombier/depannage/poitiers"], ["/[metier]/[location]/[ville]/page/[n]", "/plombier/depannage/poitiers/page/2"],
  ["/[metier]/urgence", "/serrurier/urgence"], ["/[metier]/urgence/[ville]", "/serrurier/urgence/paris"], ["/[metier]/obligation", "/ramoneur/obligation"], ["/[metier]/obligation/[ville]", "/ramoneur/obligation/paris"],
  ["/[metier]/installation", "/climaticien/installation"], ["/[metier]/installation/[ville]", "/climaticien/installation/paris"], ["/[metier]/location-saisonniere", "/menage/location-saisonniere"], ["/[metier]/location-saisonniere/[ville]", "/menage/location-saisonniere/nice"],
  ["/[metier]/prix", "/plombier/prix"], ["/[metier]/guide", "/plombier/guide"], ["/trouver-des-chantiers/[slug]", "/trouver-des-chantiers/plombier"], ["/trouver-des-chantiers/[slug]", "/trouver-des-chantiers/vienne-86"], ["/trouver-des-clients/[slug]", "/trouver-des-clients/menage"],
]) add(template, url);
for (const route of ["/ai", "/ai/freelances", "/ai/pour-les-freelances", "/ai/tarifs", "/ai/barometre-tjm", "/ai/monde", "/ai/projets"]) add(route, route);
for (const [template, url] of [
  ["/ai/[skill]", "/ai/developpement-web"], ["/ai/[skill]/[ville]", "/ai/developpement-web/paris"], ["/ai/[skill]/dept/[dept]", "/ai/developpement-web/dept/75"], ["/ai/barometre-tjm/[skill]", "/ai/barometre-tjm/react"], ["/ai/monde/[skill]", "/ai/monde/web-development"], ["/ai/monde/[skill]/[ville]", "/ai/monde/web-development/bruxelles"],
]) add(template, url);
for (const [template, url] of [
  ["/en/ai", "/en/ai"], ["/en/ai/[skill]", "/en/ai/web-development"], ["/en/ai/[skill]/[city]", "/en/ai/web-development/new-york"], ["/en/ai/[skill]/country/[country]", "/en/ai/web-development/country/united-states"], ["/en/ai/[skill]/state/[state]", "/en/ai/web-development/state/california"], ["/en/ai/country/[country]", "/en/ai/country/united-states"], ["/en/ai/continent/[continent]", "/en/ai/continent/europe"], ["/en/ai/freelance-visa", "/en/ai/freelance-visa"], ["/en/ai/freelance-visa/[country]", "/en/ai/freelance-visa/uae"], ["/en/ai/freelance-usa", "/en/ai/freelance-usa"], ["/en/ai/freelance-usa/[topic]", "/en/ai/freelance-usa/llc-vs-sole-proprietorship"],
]) add(template, url, [308], "International en pause : next.config.ts prévoit une redirection permanente vers /.");
for (const [template] of metadata) add(template, template === "/sitemap/[__metadata_id__]" ? "/sitemap/0.xml" : template, [200], template === "/sitemap/[__metadata_id__]" ? "Un seul lot numérique ; aucun parcours des autres lots volumineux." : "", "metadata");
add("redirect:/sitemap.xml", "/sitemap.xml", [308], "Destination attendue /sitemap-index.xml.", "redirect");
add("redirect:www", "https://www.workwave.fr/", [200, 301, 308], "Contrôle du domaine www et du canonical ; aucun changement DNS.", "redirect");
add("/ai/freelance/[slug]", "/ai/freelance/fiche-inexistante-audit-20260912", [404], "Fiche volontairement absente.", "negative");
for (const [template, url, expected, note] of [
  ["/[metier]", "/metier-inexistant-audit-20260912", [404], "Métier volontairement absent."], ["/[metier]/[location]", "/plombier/ville-inexistante-audit-20260912", [404], "Ville volontairement absente."], ["/artisan/[slug]", "/artisan/fiche-inexistante-audit-20260912", [404], "Fiche volontairement absente."],
  ["/[metier]/[location]/page/[n]", "/plombier/poitiers/page/2abc", [404], "Le correctif local parseListingPage refuse ce paramètre ; production peut encore utiliser parseInt."], ["/[metier]/[location]/page/[n]", "/plombier/poitiers/page/500", [404], "Page hors du jeu de résultats de Poitiers."], ["/[metier]/[location]/[ville]", "/plombier/specialite-inexistante-audit-20260912/poitiers", [404], "Sous-spécialité absente."], ["/[metier]/obligation", "/plombier/obligation", [404], "Métier hors whitelist obligation."],
  ["/ai/[skill]", "/ai/competence-inexistante-audit-20260912", [404], "Compétence volontairement absente."], ["/ai/[skill]/dept/[dept]", "/ai/developpement-web/dept/99999", [404], "Département hors liste."], ["/blog/[slug]", "/blog/article-inexistant-audit-20260912", [404], "Article volontairement absent."], ["/guide-des-prix/[slug]", "/guide-des-prix/prix-inexistant-audit-20260912", [404], "Guide volontairement absent."],
]) add(template, url, expected, note, "negative");
const results = [];
const htmlLinks = new Map();
const completeDiscovery = process.argv.includes("--complete-discovery");
if (completeDiscovery) {
  const prior = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
  results.push(...prior.results);
  for (const result of results) if (result.profileLinks) htmlLinks.set(new URL(result.url).pathname, result.profileLinks);
}
const write = () => {
  for (const item of inventory) item.exerciseIds = results.filter((r) => r.template === item.template).map((r) => r.id);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify({ startedAt, updatedAt: new Date().toISOString(), baseUrl: BASE, environment: "production_current_unmodified", method: "GET only; redirects manual; no cookies, forms, mutations, cache-busting or revalidation; concurrency 2; 20s per request; 8MB response cap", scope: "One representative URL per public page template, selected negative cases and metadata; not every database row, browser interaction or all sitemap children.", manifest: { nextVersion: JSON.parse(fs.readFileSync("node_modules/next/package.json")).version, appPathsCount: Object.keys(pathsManifest).length, redirectsCount: routesManifest.redirects.length }, inventory, results, unexercised: inventory.filter((i) => !i.exerciseIds.length).map((i) => ({ template: i.template, source: i.source, reason: i.owner === "root_accounts_forms" ? "Other agent: accounts/forms/admin; no submission or token action in this public test." : "No representative exercised yet; inspect results and discovery." })), limitations: ["Local fixes were not deployed. Production smoke results do not validate local behavior.", "No authenticated action, payment, email, form submission, mutation, browser hydration or full link crawl tested here.", "Only sitemap/0.xml requested among numeric shards; other shard IDs inventoried from sitemap-index without fetching them.", "Unexpected 404 on a guessed candidate needs confirmation against source/link/data before classifying as a bug."] }, null, 2) + "\n");
};
async function check(item) {
  const start = performance.now();
  const result = { ...item, checkedAt: new Date().toISOString() };
  try {
    const response = await fetch(item.url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(20_000), headers: { "User-Agent": "WorkwaveOwnerRouteAudit/1.0", Accept: "text/html,application/xml,text/plain,application/json,image/*;q=0.8,*/*;q=0.5" } });
    result.status = response.status;
    result.headersMs = Math.round(performance.now() - start);
    result.headers = Object.fromEntries(["content-type", "location", "cache-control", "x-nextjs-cache", "x-robots-tag", "server"].map((key) => [key, response.headers.get(key)]).filter(([, value]) => value !== null));
    const chunks = []; let size = 0;
    for await (const chunk of response.body ?? []) { size += chunk.length; if (size > 8_000_000) throw new Error("Response exceeded 8MB cap"); chunks.push(chunk); }
    const body = Buffer.concat(chunks).toString("utf8");
    result.bytes = size;
    result.totalMs = Math.round(performance.now() - start);
    result.expectedStatus = item.expected.includes(response.status);
    if ((response.headers.get("content-type") || "").includes("text/html")) {
      const $ = load(body);
      result.title = $("title").first().text();
      result.canonicals = $("link[rel=canonical]").map((_, el) => $(el).attr("href")).get();
      result.robots = $("meta[name=robots],meta[name=googlebot]").map((_, el) => ({ name: $(el).attr("name"), content: $(el).attr("content") })).get();
      result.h1 = $("h1").map((_, el) => $(el).text().replace(/\s+/g, " ").trim().slice(0, 240)).get();
      const links = $("a[href]").map((_, el) => $(el).attr("href")).get();
      htmlLinks.set(new URL(item.url).pathname, [...new Set(links)]);
      result.jsonLdTypes = []; result.invalidJsonLd = 0;
      $("script[type='application/ld+json']").each((_, el) => { try { const data = JSON.parse($(el).text()); const nodes = Array.isArray(data) ? data : data["@graph"] || [data]; for (const node of nodes) if (node["@type"]) result.jsonLdTypes.push(node["@type"]); } catch { result.invalidJsonLd++; } });
      result.renderError = /Application error: a (?:client|server)-side exception|A server error occurred|Internal Server Error|NEXT_HTTP_ERROR_FALLBACK;500/.test(body);
      result.paginationLinks = [...new Set(links.filter((link) => /\/page\/|[?&]page=/.test(link)))].slice(0, 30);
      result.profileLinks = [...new Set(links.filter((link) => /^\/(?:artisan|ai\/freelance)\/[^/]+$/.test(link)))].slice(0, 30);
    } else if (item.kind === "metadata" && /xml|text\/plain/.test(response.headers.get("content-type") || "")) {
      const $ = load(body, { xml: true });
      result.xmlRoot = $.root().children().first().prop("tagName") || null;
      result.urlCount = $("url").length;
      result.sitemapCount = $("sitemap").length;
      result.locationSample = $("loc").slice(0, 5).map((_, el) => $(el).text()).get();
      if (item.url.endsWith("sitemap-index.xml")) result.childSitemaps = $("sitemap loc").map((_, el) => $(el).text()).get();
      if (item.url.endsWith("robots.txt")) result.robotsText = body;
    }
  } catch (error) { result.error = `${error.name}: ${error.message}`; result.totalMs = Math.round(performance.now() - start); result.expectedStatus = false; }
  results.push(result); write();
  console.log(`${result.status ?? "ERR"} ${result.totalMs}ms ${new URL(item.url).pathname} ${result.expectedStatus ? "" : "CHECK"}`);
}
async function batch(items) { let cursor = 0; await Promise.all(Array.from({ length: 2 }, async () => { while (cursor < items.length) await check(items[cursor++]); })); }
if (!completeDiscovery) await batch([...plan]);
const discovery = [["/artisan/[slug]", "/plombier/poitiers", /^\/artisan\/[^/?]+$/], ["/blog/[slug]", "/blog", /^\/blog\/[^/?]+$/], ["/guide-des-prix/[slug]", "/guide-des-prix", /^\/guide-des-prix\/[^/?]+$/], ["/ai/freelance/[slug]", "/ai/developpement-web", /^\/ai\/freelance\/[^/?]+$/]];
const discovered = [];
for (const [template, parent, matcher] of discovery) {
  if (results.some((result) => result.template === template && result.kind === "discovered")) continue;
  const found = htmlLinks.get(parent)?.find((href) => matcher.test(href));
  if (found) { add(template, found, [200], `URL réellement liée depuis ${parent}.`, "discovered"); if (completeDiscovery) plan.at(-1).id = `public-followup-${discovered.length + 1}`; discovered.push(plan.at(-1)); }
}
await batch(discovered);
write();
console.log(JSON.stringify({ output: OUTPUT, requests: results.length, unexpected: results.filter((r) => !r.expectedStatus).map((r) => ({ url: r.url, status: r.status, error: r.error })), unexercisedOwned: inventory.filter((r) => r.owner === "public_seo" && !r.exerciseIds.length).map((r) => r.template) }, null, 2));
