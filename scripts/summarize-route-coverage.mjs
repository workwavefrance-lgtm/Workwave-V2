/** Consolide les preuves existantes ; aucun accès réseau et aucune mutation métier. */
import fs from "node:fs";
import path from "node:path";

const dir = "docs/audits";
const read = (name) => JSON.parse(fs.readFileSync(`${dir}/2026-09-12-${name}.json`, "utf8"));
const api = read("routes-api");
const publicPages = read("routes-public");
const accountsLocal = read("routes-accounts-local");
const accountsProduction = read("routes-accounts-production");
const actions = read("routes-actions");
const aiProfile = read("ai-profile-production");
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const normalize = (file) => "/" + file.split("/").slice(1, -1).filter((part) => !part.startsWith("(")).join("/");
const applicationFiles = walk("app").filter((file) => /\/(?:page|route)\.[jt]sx?$/.test(file));
const metadataFiles = ["app/robots.ts", "app/manifest.ts", "app/sitemap.ts", "app/icon.png", "app/apple-icon.png", "app/favicon.ico", "app/opengraph-image.tsx", "app/(public)/pro/opengraph-image.tsx"];
const inventory = [...applicationFiles, ...metadataFiles].sort().map((file) => {
  const metadata = metadataFiles.includes(file);
  const template = metadata ? publicPages.inventory.find((item) => item.source === file)?.template : normalize(file);
  const apiRoute = api.routes.find((item) => item.file === file);
  const localCases = accountsLocal.results.filter((item) => item.file === file && item.status !== undefined);
  const productionCases = accountsProduction.results.filter((item) => item.file === file && item.status !== undefined);
  const publicCases = publicPages.results.filter((item) => item.template === template && item.status !== undefined);
  const isolatedApiCases = apiRoute?.cases.filter((item) => item.local_result?.exercised) ?? [];
  const liveApiCases = apiRoute?.cases.filter((item) => item.http_result?.exercised) ?? [];
  const evidence = {
    accountsLocal: localCases.length,
    accountsProduction: productionCases.length,
    publicProduction: publicCases.length,
    apiIsolated: isolatedApiCases.length,
    apiProduction: liveApiCases.length,
    publicProductionSupplement: template === "/ai/freelance/[slug]" && aiProfile.status !== undefined ? 1 : 0,
  };
  return { file, template, kind: metadata ? "metadata" : /\/page\./.test(file) ? "page" : "handler", exercised: Object.values(evidence).some((count) => count > 0), evidence };
});
const missing = inventory.filter((item) => !item.exercised);
const report = {
  generatedAt: new Date().toISOString(),
  scope: "Couverture de chaque modèle de route, par réponse HTTP représentative ou handler isolé. Ne signifie pas couverture complète des scénarios métier, des données ou des interactions navigateur.",
  applicationTemplates: applicationFiles.length,
  pages: applicationFiles.filter((file) => /\/page\./.test(file)).length,
  handlers: applicationFiles.filter((file) => /\/route\./.test(file)).length,
  metadataTemplates: metadataFiles.length,
  exercisedTemplates: inventory.filter((item) => item.exercised).length,
  missing,
  cases: {
    api: api.totals,
    accountsLocal: { total: accountsLocal.cases, passed: accountsLocal.passed, buildId: accountsLocal.compiledBuildId },
    accountsProduction: { total: accountsProduction.cases, passedAgainstLocalExpectations: accountsProduction.passed },
    publicProduction: { total: publicPages.results.length, httpResponses: publicPages.results.filter((item) => item.status !== undefined).length, expectedStatuses: publicPages.results.filter((item) => item.expectedStatus).length, additionalProfileCheck: { report: "2026-09-12-ai-profile-production.json", status: aiProfile.status, passed: aiProfile.status === 200 && aiProfile.hasH1 && !aiProfile.renderError } },
    serverActions: { modules: actions.modules, exports: actions.exportedActions, tests: actions.lastVerifiedActionTests },
  },
  inventory,
};
fs.writeFileSync(`${dir}/2026-09-12-couverture-routes.json`, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ applicationTemplates: report.applicationTemplates, metadataTemplates: report.metadataTemplates, exercisedTemplates: report.exercisedTemplates, missing }));
if (missing.length) process.exitCode = 1;
