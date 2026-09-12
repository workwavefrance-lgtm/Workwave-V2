/** Vérification des listings compilés locaux ; GET uniquement, aucune soumission. */
import assert from "node:assert/strict";
import { get } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { load } from "cheerio";

const read = (path) => new Promise((resolve, reject) => {
  const request = get(`http://127.0.0.1:4317${path}`, { headers: { Host: "workwave.fr", "User-Agent": "Workwave-Authorized-Route-Audit/2026-09-12" }, signal: AbortSignal.timeout(30000) }, (response) => {
    let html = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { html += chunk; });
    response.on("error", reject);
    response.on("end", () => {
      const $ = load(html);
      const schemas = $("script[type='application/ld+json']").map((_, element) => $(element).text()).get().map((text) => JSON.parse(text));
      const listing = schemas.find((schema) => schema["@type"] === "ItemList");
      resolve({ path, status: response.statusCode, profiles: [...new Set($("main a[href^='/artisan/']").map((_, element) => $(element).attr("href")).get())], total: listing?.numberOfItems, links: $("a[href]").map((_, element) => $(element).attr("href")).get(), canonical: $("link[rel='canonical']").attr("href") });
    });
  });
  request.on("error", reject);
});
const results = [];
for (const base of ["/plombier/poitiers", "/plombier/depannage/poitiers"]) {
  const first = await read(base);
  const second = await read(base + "/page/2");
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(first.profiles.length, 10);
  assert.equal(second.total, first.total);
  assert(second.total > 10);
  assert.equal(second.profiles.length, Math.min(20, second.total - 10));
  const overlap = first.profiles.filter((href) => second.profiles.includes(href));
  assert.deepEqual(overlap, [], "La page 2 ne doit pas répéter le top 10");
  assert(first.links.includes(base + "/page/2"), "Lien de pagination conservant la sous-spécialité");
  // La politique canonique préexistante pointe vers la page 1 ; ce lot
  // corrige la navigation sans changer cette stratégie d'indexation.
  assert.equal(second.canonical, "https://workwave.fr" + base);
  const invalid = await read(base + "/page/2abc");
  assert.equal(invalid.status, 404);
  results.push({ base, total: second.total, firstPageStatus: first.status, firstPageProfiles: first.profiles.length, secondPageStatus: second.status, secondPageProfiles: second.profiles.length, overlap, nextPageLink: base + "/page/2", secondPageCanonical: second.canonical, invalidPageStatus: invalid.status, passed: true });
}
const report = { checkedAt: new Date().toISOString(), buildId: readFileSync(".next/BUILD_ID", "utf8").trim(), environment: "compiled_local", requests: 6, results };
writeFileSync("docs/audits/2026-09-12-routes-listings-local.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
