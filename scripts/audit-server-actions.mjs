// Rebuild the Server Action inventory from source and the executable case map.
// No application import, network, environment file or database access.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import ts from "typescript";
import { actionCases } from "../tests/server-action-cases.mjs";

const root = path.resolve(import.meta.dirname, "..");
const files = execFileSync("rg", ["--files", "app", "components", "lib"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(file => /\.[cm]?[jt]sx?$/.test(file));
const sources = new Map(files.map(file => [file, fs.readFileSync(path.join(root, file), "utf8")]));
const actions = [];
const routeOf = file => "/" + path.posix.dirname(file).split("/").slice(1).filter(part => !part.startsWith("(")).join("/");
const descriptions = {
  "auth-result": "Session absente : refus sans requête ; compte authentifié sans fiche propriétaire : refus, aucun écrit",
  "auth-redirect": "Session absente : redirection ; compte authentifié sans fiche propriétaire : refus, aucun écrit",
  "auth-admin": "Session absente : refus sans accès service_role",
  "invalid-result": "Entrée invalide : refus avant toute requête",
  "invalid-french-result": "Numéro invalide : refus avant appel registre externe",
  "invalid-ok-result": "Token vide : refus avant toute requête",
  "invalid-redirect": "Entrée invalide : redirection avant toute requête",
  honeypot: "Pot de miel : succès factice sans IA, email ou écriture ; champs requis invalides : refus",
};
const extra = {
  updateProByAdmin: ["Anonyme et non-admin refusés ; édition admin réussie simulée, ciblée par pro.id (test rouge avant correction)"],
  markLeadOpened: ["Lead d’un autre pro refusé ; succès simulé borné par id+pro_id et status=sent"],
  markLeadContacted: ["Lead d’un autre pro refusé"],
  markLeadNotRelevant: ["Lead d’un autre pro refusé"],
  startBtpUnlock: ["Projet invalide, CGV absentes, aucun profil, pause, projet absent/autre vertical/supprimé, déjà débloqué ; course UNIQUE sur déblocage gratuit simulée"],
  startTechUnlock: ["Projet invalide, CGV absentes, aucun profil, projet absent/autre vertical/supprimé, déjà débloqué ; course UNIQUE sur déblocage gratuit simulée"],
  saveProPhotoCaption: ["Photo d’un autre pro refusée avant écriture"],
  deleteProPhoto: ["Photo d’un autre pro refusée avant Storage"],
  deleteAiPortfolioPhoto: ["Photo d’un autre pro refusée avant Storage"],
  uploadProLogo: ["SVG refusé avant Storage"],
  uploadProCover: ["SVG refusé avant Storage"],
  uploadProPhoto: ["SVG refusé avant Storage"],
  updatePreferences: ["Rayon invalide refusé ; sauvegarde réussie simulée bornée au pro authentifié"],
  updateAiPreferences: ["Date invalide refusée ; sauvegarde réussie simulée bornée au pro authentifié et budget plafonné ; échec PATCH affiché en erreur FR/EN (test rouge avant correction)"],
  submitProject: ["Email dans description et consentement absent refusés avant IA/base"],
  verifyClaim: ["Code haché + tentative + slug transmis à la RPC ; erreurs preuve invalid/expired/blocked/unavailable/code refusées avant création Auth"],
  verifyDeletion: ["Absence session, autre propriétaire/email/opération/cible exacte refusés avant mutation"],
  deleteProject: ["Token inconnu, projet déjà supprimé, échec PATCH refusés ; suppression réussie simulée sans destinataires"],
  reviewClaim: ["Non-admin, paramètres invalides, preuve manuelle non cochée et conflit RPC refusés ; rejet motivé réussi simulé"],
  publishReview: ["UPDATE borné id+pending+submitted_at non-null ; replay refusé"],
  rejectReview: ["UPDATE borné id+pending+submitted_at non-null ; replay refusé"],
  processUnsubscribe: ["HMAC autre pro/autre opération refusé ; do_not_contact et séquences ciblés, succès simulé"],
  processGlobalUnsubscribe: ["HMAC autre opération refusé ; do_not_contact, blacklist email et séquences ciblés, succès simulé ; chacune des trois écritures en échec empêche le faux succès (test rouge avant correction)"],
  processReviewUnsubscribe: ["HMAC autre email refusé ; upsert ciblé email, succès simulé"],
  submitTechProject: ["Catégorie forgée refusée avant IA"],
};
const existing = {
  submitClaim: ["tests/security-migrations.test.mjs : quotas atomiques émission OTP, SQL09"],
  verifyClaim: ["tests/security-migrations.test.mjs : consommation OTP unique, essais/expiry/type/cible exacte ; enregistrement queue et email Auth confirmé"],
  reviewClaim: ["tests/security-migrations.test.mjs : rôle admin, note, preuve/email/SIRET/cible, replay et transitions transactionnelles ; cycle de vie FK"],
  verifyDeletion: ["tests/pro-ownership.test.ts : liaison compte/email/opération/SIRET/cible", "tests/security-migrations.test.mjs : purge journal email lors suppression"],
  deleteProject: ["tests/lead-detail-query.test.ts, tests/lead-detail-data.test.ts : token non sérialisé", "tests/security-migrations.test.mjs : purge journal email lors suppression"],
  deleteProRgpd: ["tests/security-migrations.test.mjs : purge journal email lors soft-delete pro"],
  submitProject: ["tests/btp-matching.test.ts, tests/project-delivery.test.ts : règles diffusion, reprises et idempotence email"],
  submitTechProject: ["tests/project-delivery.test.ts : reprises et idempotence email"],
};
function limits(action) {
  if (/Checkout|Portal|Subscription|Unlock/.test(action)) return "Paiement/portail Stripe et quota gratuit concurrent inter-projets non exécutés ; pas de transaction financière réelle";
  if (/upload|Avatar|Portfolio|Photo|Cover/i.test(action)) return "Transfert/suppression réelle Storage, contrôle des octets des images et concurrence non exécutés";
  if (/Claim/.test(action)) return "Emails, création/login Auth et callback after() de succès non exécutés ; RPC testées séparément en PostgreSQL isolé";
  if (/Deletion|deleteAiAccount|deleteProRgpd/.test(action)) return "Suppression complète, annulation Stripe et notifications réelles non exécutées";
  if (action === "deleteProject") return "Succès avec destinataires email non exécuté ; SQL de purge testé séparément";
  if (/submitProject|submitTechProject|submitInscription|createFiche/.test(action)) return "Dépôt/activation réels, qualification facturée et diffusion réelle non exécutés";
  if (/signIn|Connexion|verifyCode|Password/.test(action)) return "Délivrabilité email, session Auth réelle, reset/login réussi et anti-rejeu en production non exécutés";
  if (/Unsubscribe/.test(action)) return "Persistance production et erreurs partielles multi-écritures non validées en base réelle";
  if (/Review/.test(action)) return "Publication complète, recalcul SQL notes et notifications réelles non exécutés";
  return "Scénarios HTTP/RSC de bout en bout, RLS production et modifications concurrentes non exécutés";
}

for (const [file, source] of sources) {
  if (!source.includes("use server")) continue;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const directive = ast.statements[0];
  const isServerModule = ts.isExpressionStatement(directive) && ts.isStringLiteral(directive.expression) && directive.expression.text === "use server";
  assert.ok(isServerModule, `New inline/server directive requires explicit inventory support: ${file}`);
  for (const node of ast.statements) {
    if (!ts.isFunctionDeclaration(node) || !node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    const action = node.name.text;
    const item = actionCases.find(entry => entry.module === file && entry.action === action);
    assert.ok(item, `Missing executable action case: ${file}#${action}`);
    actions.push({ module: file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, action,
      route: routeOf(file), directImporters: [],
      newTests: [action === "reviewClaim" ? "Session absente : redirection login admin sans accès aux données" : descriptions[item.kind], ...(item.localized ? ["Variante FR et EN"] : []), ...(extra[action] || [])],
      existingTests: existing[action] || [], limitations: limits(action) });
  }
}
assert.equal(actions.length, actionCases.length, "Executable case map must have exactly one entry per exported action");

for (const [file, source] of sources) {
  if (!source.includes("actions")) continue;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const specifier = node.moduleSpecifier.text;
    const target = specifier.startsWith("@/") ? specifier.slice(2) : specifier.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)) : null;
    if (!target) continue;
    const named = node.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    for (const element of named.elements) {
      const imported = (element.propertyName || element.name).text;
      const action = actions.find(entry => entry.action === imported && [entry.module, entry.module.replace(/\.ts$/, "")].includes(target));
      if (action) action.directImporters.push(file);
    }
  }
}
actions.sort((a, b) => a.route.localeCompare(b.route) || a.line - b.line);
const report = {
  date: "2026-09-12", scope: "Server Actions du dossier app ; les routes API et pages sont couvertes par les audits compagnons",
  modules: new Set(actions.map(action => action.module)).size, exportedActions: actions.length,
  lastVerifiedActionTests: { command: "node --import tsx --test tests/server-actions.test.mjs", passed: 70, failed: 0 },
  safety: "Transport HTTP entièrement intercepté, identifiants factices, aucun .env chargé, clés IA factices pour neutraliser le fallback .env.local. Stripe non configuré. Aucune écriture/email/transaction/IA réelle.",
  methodology: "Import des vrais points d’entrée et des vrais SDK. Contexte cookies/auth/revalidation Next16.2.3 isolé. Stripe/Anthropic chargés en ESM natif pour éviter un blocage tsx/CJS. Les branches de succès qui déclencheraient un email ne sont pas exercées.",
  fixedFinding: { severity: "critical", action: "updateProByAdmin", file: "app/admin/(dashboard)/pros/[id]/actions.ts", evidence: "Avant correction, un appel sans session produit SELECT+PATCH pros et {ok:true} dans le test isolé. verifyAdmin est désormais exécuté dès l’entrée. Cas anonyme/non-admin/admin passent." },
  otherFixedFindings: [
    { action: "processGlobalUnsubscribe", evidence: "Chaque échec simulé d’écriture pouvait auparavant retourner success:true. Les trois résultats sont désormais contrôlés ; les oppositions déjà enregistrées restent conservées et un nouvel essai est idempotent." },
    { action: "updateAiPreferences", evidence: "Un PATCH échoué redirigeait auparavant vers saved=1. La réponse d’erreur affiche désormais error=save_failed en FR et EN ; le parcours réussi reste inchangé." },
  ],
  remainingValidation: [
    "Pas de scénario navigateur authentifié complet, paiement test Stripe, délivrabilité email ou appel IA facturé.",
    "Les 18 tests PostgreSQL PGlite des migrations08/09 utilisent un schéma minimal et une session unique ; pas de stress multi-connexion ni validation de toutes les RLS/contraintes production.",
    "La limite de deux leads offerts est un count puis insert : concurrence sur deux projets distincts non garantie par la contrainte unique projet/pro.",
    "Les actions unlock refusent deleted mais pas closed/ancienneté. Les règles de visibilité dashboard ne suffisent pas à valider les actions directes ; décision métier/test complémentaire requis.",
    "Un test d'entrée invalide ou de session absente ne prouve pas le succès de toutes les branches d’une action.",
  ],
  actions,
};
const base = "docs/audits/2026-09-12-routes-actions";
fs.mkdirSync(path.join(root, "docs/audits"), { recursive: true });
fs.writeFileSync(path.join(root, `${base}.json`), JSON.stringify(report, null, 2) + "\n");
const lines = ["# Vérification des Server Actions — 12 septembre 2026", "", `${report.modules} modules et ${report.exportedActions} fonctions exportées recensés depuis le code. **${report.lastVerifiedActionTests.passed} tests passent**, sans accès réseau réel. Chaque action possède un test direct minimal ; les contrôles de propriété, mutations ciblées et parcours à risque ont des cas supplémentaires.`, "", "## Méthode et portée", "", report.safety, "", report.methodology, "", "La matrice indique la couverture effective, pas une validation de bout en bout des 51 parcours. Les routes API, pages publiques/privées et pages SEO font l’objet de rapports compagnons.", "", "```sh", report.lastVerifiedActionTests.command, "node scripts/audit-server-actions.mjs", "```", "", "Les cas exécutables sont dans `tests/server-action-cases.mjs` et `tests/server-actions.test.mjs`. Le générateur compare l’inventaire AST aux cas et échoue si une action manque. Le JSON compagnon contient les fichiers appelants directs et les références aux tests antérieurs.", "", "## Défauts confirmés et corrigés", "", "**Critique — édition administrateur sans authentification.** `updateProByAdmin` utilisait le client service_role sans appeler `verifyAdmin`. Le test direct sans session obtenait `{ok:true}` après un PATCH simulé de `pros`. Le contrôle est ajouté dès l’entrée ; le test confirme maintenant le refus anonyme sans lecture/écriture, le refus d’un compte non-admin, puis l’édition ciblée par un administrateur. Aucun changement déployé.", "", ...report.otherFixedFindings.map(finding => `- **${finding.action}** : ${finding.evidence}`), "", "## Matrice route → action → couverture", "", "Les chemins de routes sont les chemins de déclaration, groupes Next retirés. Les composants FR/EN réutilisent certaines actions ; les importateurs exacts figurent dans le JSON. Les cinq actions d’abonnement historiques et `markLeadOpened` n’ont aucun importateur direct repéré dans app/components/lib : elles restent recensées et testées, sans présumer qu’elles sont accessibles dans le build final.", "", "| Route | Action et source | Nouveaux tests | Tests antérieurs | Limites |", "| --- | --- | --- | --- | --- |"];
for (const action of actions) lines.push(`| \`${action.route}\` | \`${action.action}\` — [source](../../${action.module}#L${action.line}) | ${action.newTests.join(" ; ")} | ${action.existingTests.join(" ; ") || "Aucun test direct repéré avant ce lot"} | ${action.limitations} |`);
lines.push("", "## Validations encore nécessaires", "", ...report.remainingValidation.map(item => `- ${item}`), "");
fs.writeFileSync(path.join(root, `${base}.md`), lines.join("\n"));
console.log(JSON.stringify({ modules: report.modules, exportedActions: report.exportedActions, output: [`${base}.md`, `${base}.json`], noDirectImporterLocated: actions.filter(action => action.directImporters.length === 0).map(action => action.action) }, null, 2));
