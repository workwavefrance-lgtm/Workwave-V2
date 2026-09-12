/**
 * Audit reproductible des API. Aucun secret n'est chargé.
 * node scripts/audit-api-routes.mjs              -> handlers isolés, réseau interdit
 * node scripts/audit-api-routes.mjs --live       -> ajoute les seuls cas HTTP sûrs
 * Les sondes HTTP n'envoient aucun cookie, secret, signature ou identifiant réel.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as zod from 'zod';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = path.join(ROOT, 'docs/audits/2026-09-12-routes-api');
const LIVE = process.argv.includes('--live');
const REUSE_HTTP = process.argv.includes('--reuse-http');
if (LIVE && REUSE_HTTP) throw new Error('Choisir --live ou --reuse-http, pas les deux.');
const prior = REUSE_HTTP ? JSON.parse(fs.readFileSync(REPORT + '-avant-correctifs.json', 'utf8')) : null;
const BASE = 'https://workwave.fr';
const sha = (s) => createHash('sha256').update(s).digest('hex');
const HTTP = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesIn(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

const descriptions = {
  '/api/admin/alerts': ['Admin', 'Lecture des alertes et indicateurs'],
  '/api/admin/analytics/kpis': ['Admin', 'Lecture analytics et données business'],
  '/api/admin/auth/check': ['Admin', 'Lecture du rôle et de l’identité admin'],
  '/api/admin/enquete/export': ['Admin', 'Export de données et contacts de questionnaire'],
  '/api/admin/finances/mrr': ['Admin', 'Lecture Stripe et agrégats financiers'],
  '/api/admin/finances/transactions': ['Admin', 'Lecture Stripe et transactions'],
  '/api/admin/impersonate/exit': ['Cookie impersonation requis', 'Suppression cookie et déconnexion de la session courante'],
  '/api/admin/lea-journal/[id]/reviewed': ['Admin', 'Écriture de la date de relecture'],
  '/api/admin/leads': ['Admin', 'Lecture de prospects'],
  '/api/admin/logs': ['Admin', 'Lecture des journaux admin'],
  '/api/admin/overview': ['Admin', 'Lecture agrégats et activité'],
  '/api/admin/projects/[id]/resend-notification': ['Admin', 'Email admin, écriture du suivi et journal'],
  '/api/admin/projects/[id]': ['Admin', 'GET : lecture projet ; PUT : statut projet et journal'],
  '/api/admin/projects': ['Admin', 'Lecture de projets'],
  '/api/admin/pros/[id]/impersonate': ['Superadmin', 'Lien Auth, cookie impersonation, journal et email au professionnel'],
  '/api/admin/pros/[id]': ['Admin', 'GET : lecture fiche ; PUT : abonnement/activité et journal'],
  '/api/admin/pros': ['Admin', 'Lecture de fiches'],
  '/api/admin/search': ['Admin', 'Lecture de fiches et projets'],
  '/api/admin/settings/admins': ['Admin en GET ; superadmin en POST/DELETE', 'Lecture, création ou suppression d’un rôle admin'],
  '/api/admin/support/[id]/draft': ['Admin', 'Lecture ticket, appel Anthropic et journal admin'],
  '/api/admin/support/[id]/note': ['Admin', 'Écriture note interne et journal'],
  '/api/admin/support/[id]/reply': ['Admin', 'Email client, écritures message/statut/journal'],
  '/api/admin/support/[id]': ['Admin', 'Écriture statut ticket et journal'],
  '/api/agent-chat': ['Public ; quota mémoire par IP', 'Anthropic ; selon réponse : ticket, tri IA, journal, email admin'],
  '/api/agent-context': ['Public', 'Lecture de contexte public selon pathname'],
  '/api/auth/signout': ['Session courante, éventuellement absente', 'Déconnexion Auth et redirection'],
  '/api/brevo/webhook': ['Secret query BREVO_WEBHOOK_SECRET', 'Écritures delivery/bounce/opposition et blacklist'],
  '/api/cities/search': ['Public', 'Lecture de communes et départements'],
  '/api/couverture': ['Public', 'Lecture et comptage de fiches'],
  '/api/cron/broadcast-rescue': ['Bearer CRON_SECRET', 'Reprises email et écritures de livraison/projets'],
  '/api/cron/daily-blog': ['Bearer CRON_SECRET', 'Génération IA et publication article, écritures file blog'],
  '/api/cron/feedback-relance': ['Bearer CRON_SECRET', 'Emails de retour et dates d’envoi'],
  '/api/cron/healthcheck': ['Bearer CRON_SECRET', 'Requêtes HTTP publiques et email d’alerte éventuel'],
  '/api/cron/relance-projets': ['Bearer CRON_SECRET', 'Emails de relance et suivi des projets'],
  '/api/cron/review-requests': ['Bearer CRON_SECRET', 'Création demandes d’avis, emails et suivi'],
  '/api/cron/sitemap-audit': ['Bearer CRON_SECRET', 'Lectures HTTP/DB, email d’alerte, rafraîchissement SQL listings'],
  '/api/cron/stats-jour': ['Bearer CRON_SECRET', 'Upsert des statistiques quotidiennes'],
  '/api/feedback-chat': ['Public ; contrôle origin et quotas', 'Compteur SQL, Anthropic ; save : email admin et archive'],
  '/api/health': ['Public', 'Aucun accès DB ni service externe'],
  '/api/public/categories': ['Public', 'Lecture des catégories publiques'],
  '/api/recent-claims': ['Public', 'Lecture noms commerciaux/catégories/villes/dates'],
  '/api/resend/inbound': ['GET public ; POST signature Svix', 'POST valide : lecture email, ticket, tri IA, transfert email, suivi'],
  '/api/revalidate-sitemap': ['Bearer CRON_SECRET', 'Invalidation du cache de pages/sitemaps'],
  '/api/stripe/webhook': ['Signature Stripe', 'Écritures paiements/abonnements/dédoublonnage, lectures Stripe, emails'],
  '/api/track': ['Public ; consent_analytics=accepted pour enregistrer', 'Insertion analytics si événement admis et consentement présent'],
  '/api/unsubscribe-review': ['Token signé lié à l’email', 'Upsert opposition aux demandes d’avis'],
  '/auth/callback': ['Code PKCE et vérificateur du navigateur', 'Échange Auth, cookies de session et redirection après connexion'],
};

const routes = filesIn(path.join(ROOT, 'app')).filter((f) => f.endsWith('/route.ts')
  && (f.includes('/api/') || f === path.join(ROOT, 'app/auth/callback/route.ts'))).sort().map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const methods = ast.statements.filter((s) => ts.isFunctionDeclaration(s)
    && s.name && HTTP.has(s.name.text)
    && s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
    .map((s) => ({ method: s.name.text, line: ast.getLineAndCharacterOfPosition(s.getStart()).line + 1 }));
  const relative = path.relative(ROOT, file);
  const template = '/' + relative.slice(4, -9).split('/').filter((p) => !p.startsWith('(')).join('/');
  if (!descriptions[template]) throw new Error(`Nouvelle route à relire avant toute sonde : ${template}`);
  return { template, file: relative, source_sha256: sha(source), methods, auth: descriptions[template][0], effects: descriptions[template][1], cases: [] };
});

function add(route, method, label, expectedStatus, opts = {}) {
  const c = { route, method, label, expected_status: expectedStatus,
    request_path: route.template.replaceAll('[id]', 'invalid'),
    body: !['GET', 'HEAD'].includes(method) ? '{}' : undefined,
    live: true, ...opts };
  route.cases.push(c);
  return c;
}

for (const r of routes) {
  for (const { method } of r.methods) {
    if (r.template.startsWith('/api/admin/')) {
      add(r, method, 'Sans session ni cookie', r.template.endsWith('/impersonate/exit') ? 403 : 401);
    } else if (r.template.startsWith('/api/cron/') || r.template === '/api/revalidate-sitemap' || r.template === '/api/brevo/webhook') {
      add(r, method, 'Sans secret ni Authorization', 401);
    } else if (r.template === '/api/stripe/webhook') {
      add(r, method, 'Sans signature Stripe', 400);
    } else if (r.template === '/api/resend/inbound') {
      add(r, method, method === 'GET' ? 'Information publique' : 'Sans signature Svix', method === 'GET' ? 200 : 401);
    } else if (r.template === '/auth/callback') {
      add(r, method, 'Callback sans code (simulé)', 307, { live: false, expectedLocation: BASE + '/pro/connexion', note: 'Le contrôle HTTP sans code est réalisé séparément par le coordinateur.' });
    } else if (r.template === '/api/auth/signout') {
      add(r, method, 'Déconnexion entièrement simulée', 307, { live: false, simulateSignout: true, note: 'Aucune session réelle déconnectée.' });
    } else if (r.template === '/api/unsubscribe-review') {
      add(r, method, 'Sans email ni token', 400);
    } else if (['/api/agent-chat', '/api/feedback-chat', '/api/track'].includes(r.template)) {
      add(r, method, 'Objet JSON vide', 400);
    } else {
      const dbRead = ['/api/public/categories', '/api/recent-claims'].includes(r.template);
      add(r, method, dbRead ? 'Lecture publique' : 'Requête minimale sans donnée métier', 200, { local: !dbRead });
    }
  }
}

const byPath = (p) => routes.find((r) => r.template === p);
for (const p of ['/api/admin/pros/[id]/impersonate', '/api/admin/settings/admins']) {
  for (const method of p.endsWith('/admins') ? ['POST', 'DELETE'] : ['POST']) {
    add(byPath(p), method, 'Admin simple sans rôle superadmin (simulé)', 403, { live: false, adminRole: 'admin' });
  }
}
for (const p of ['/api/admin/lea-journal/[id]/reviewed', '/api/admin/projects/[id]/resend-notification',
  '/api/admin/support/[id]/draft', '/api/admin/support/[id]/note', '/api/admin/support/[id]/reply', '/api/admin/support/[id]']) {
  add(byPath(p), p.endsWith('/support/[id]') ? 'PATCH' : 'POST', 'Admin simulé et identifiant non numérique', 400, { live: false, adminRole: 'admin' });
}
for (const p of ['/api/admin/projects/[id]', '/api/admin/pros/[id]']) {
  add(byPath(p), 'PUT', 'Admin simulé et aucun champ autorisé', 400, { live: false, adminRole: 'admin' });
}
for (const method of ['POST', 'DELETE']) {
  add(byPath('/api/admin/settings/admins'), method, 'Superadmin simulé, email/identifiant absent', 400, { live: false, adminRole: 'superadmin' });
}
for (const body of ['{', '{"jour":"2026-02-30","sessions":0}', '{"jour":"2026-09-12","sessions":-1}', '{"jour":"2026-09-12"}']) {
  add(byPath('/api/cron/stats-jour'), 'POST', 'Secret fictif local et payload invalide', 400, { live: false, body, syntheticAuth: true });
}
add(byPath('/api/track'), 'POST', 'Événement valide, consentement absent', 200, { body: '{"event":"page_view"}', expectedField: ['skipped', true] });
add(byPath('/api/track'), 'POST', 'JSON malformé', 400, { body: '{' });
add(byPath('/api/agent-context'), 'POST', 'JSON malformé : contexte neutre', 200, { body: '{', expectedField: ['type', 'other'] });
add(byPath('/api/agent-context'), 'POST', 'Contexte dépôt sans requête DB', 200, { body: '{"pathname":"/deposer-projet"}', expectedField: ['type', 'deposer'] });
add(byPath('/api/cities/search'), 'GET', 'Recherche publique de commune', 200, { request_path: '/api/cities/search?q=Paris', local: false });
add(byPath('/api/couverture'), 'GET', 'Identifiants non numériques', 200, { request_path: '/api/couverture?categoryId=invalid&cityId=invalid', expectedField: ['count', null] });
add(byPath('/api/feedback-chat'), 'POST', 'Origine étrangère refusée avant traitement', 403, { headers: { Origin: 'https://audit.invalid' } });
add(byPath('/api/feedback-chat'), 'POST', 'Nom de domaine trompeur contenant workwave.fr (simulé)', 403, { live: false, headers: { Origin: 'https://workwave.fr.audit.invalid' }, finding: 'Le contrôle origin accepte une sous-chaîne au lieu du nom d’hôte exact.' });
for (const origin of ['https://audit.invalid/?next=https://workwave.fr', 'https://workwave.fr@audit.invalid', 'null',
  'https://localhost.audit.invalid', 'http://workwave.fr', 'https://workwave.fr:8443']) {
  add(byPath('/api/feedback-chat'), 'POST', `Origine non autorisée ${origin} (simulé)`, 403, { live: false, headers: { Origin: origin } });
}
for (const origin of ['https://workwave.fr', 'https://www.workwave.fr']) {
  add(byPath('/api/feedback-chat'), 'POST', `Origine autorisée ${origin}, messages absents (simulé)`, 400, { live: false, headers: { Origin: origin } });
}
add(byPath('/api/feedback-chat'), 'POST', 'Origine localhost interdite en production (simulé)', 403, { live: false, headers: { Origin: 'http://localhost:4400' } });
add(byPath('/api/feedback-chat'), 'POST', 'Même origine localhost en développement (simulé)', 400, { live: false, headers: { Origin: 'http://localhost:4400' }, localBase: 'http://localhost:4400', localNodeEnv: 'development' });
add(byPath('/api/feedback-chat'), 'POST', 'Port localhost différent en développement (simulé)', 403, { live: false, headers: { Origin: 'http://localhost:4401' }, localBase: 'http://localhost:4400', localNodeEnv: 'development' });
add(byPath('/api/feedback-chat'), 'POST', 'Même origine 127.0.0.1 en développement (simulé)', 400, { live: false, headers: { Origin: 'http://127.0.0.1:4400' }, localBase: 'http://127.0.0.1:4400', localNodeEnv: 'development' });
add(byPath('/api/feedback-chat'), 'POST', 'Referer valide et messages absents (simulé)', 400, { live: false, headers: { Referer: 'https://workwave.fr/deposer-projet' } });
for (const p of ['/api/agent-chat', '/api/feedback-chat']) {
  add(byPath(p), 'POST', 'JSON null (simulé)', 400, { live: false, body: 'null', finding: 'Un JSON null provoque une exception non interceptée avant les appels externes.' });
  for (const body of ['[]', '42', '"texte"']) {
    add(byPath(p), 'POST', `JSON hors objet : ${body} (simulé)`, 400, { live: false, body });
  }
}
add(byPath('/api/auth/signout'), 'GET', 'Redirection externe fournie par le client (simulé)', 307, { live: false, simulateSignout: true,
  request_path: '/api/auth/signout?redirect=https%3A%2F%2Faudit.invalid', expectSameOrigin: true,
  finding: 'La déconnexion accepte une redirection externe arbitraire.' });
for (const redirect of ['//audit.invalid', '\\\\audit.invalid', '/\\audit.invalid', 'https:\\\\audit.invalid',
  'javascript:alert(1)', 'data:text/html,x', 'https://user:pass@workwave.fr/pro/dashboard',
  'https://workwave.fr.audit.invalid', 'https://workwave.fr@audit.invalid', 'http://workwave.fr',
  '%2F%2Faudit.invalid', '%5C%5Caudit.invalid']) {
  add(byPath('/api/auth/signout'), 'GET', `Redirection ambiguë ${redirect} (simulé)`, 307, { live: false, simulateSignout: true,
    request_path: '/api/auth/signout?redirect=' + encodeURIComponent(redirect), expectSameOrigin: true });
}
for (const redirect of ['/pro/connexion', '/ai?x=1#retour', 'https://workwave.fr/pro/dashboard', '../ai']) {
  add(byPath('/api/auth/signout'), 'GET', `Redirection interne ${redirect} (simulé)`, 307, { live: false, simulateSignout: true,
    request_path: '/api/auth/signout?redirect=' + encodeURIComponent(redirect), expectSameOrigin: true,
    expectedLocation: new URL(redirect, BASE).href });
}
for (const next of ['https://audit.invalid', '//audit.invalid', '\\\\audit.invalid', '/\\audit.invalid',
  'javascript:</script><script>alert(1)</script>', 'https://workwave.fr@audit.invalid', '%2F%2Faudit.invalid', '%5C%5Caudit.invalid',
  '/pro/dashboard', '/ai/dashboard?retour=1', '/pro/dashboard?texte=</script><script>alert(1)</script>']) {
  add(byPath('/auth/callback'), 'GET', `Code fictif, destination ${next} (simulé)`, 200, { live: false,
    request_path: '/auth/callback?code=local-pkce-code-not-real&next=' + encodeURIComponent(next), simulateExchange: 'success',
    checkHtmlRedirect: true, expectSameOrigin: true, expectCallbackCookie: true,
    ...(next === 'https://audit.invalid' ? { finding: 'Le callback accepte une redirection externe après échange PKCE.' } : {}),
    ...(next.startsWith('javascript:') ? { finding: 'Une URL javascript peut fermer le script HTML du callback.' } : {}) });
}
add(byPath('/auth/callback'), 'GET', 'Code PKCE invalide (simulé)', 307, { live: false, request_path: '/auth/callback?code=local-invalid-code',
  simulateExchange: 'failure', expectedLocation: BASE + '/pro/connexion' });

class AuditResponse extends Response {
  auditCookies = [];
  cookies = { set: (name) => this.auditCookies.push(name) };
  static json(data, init = {}) { return new AuditResponse(JSON.stringify(data), { ...init, headers: { 'content-type': 'application/json', ...init.headers } }); }
  static redirect(url, init = 307) { return new AuditResponse(null, { status: typeof init === 'number' ? init : init.status ?? 307, headers: { location: String(url) } }); }
}

function sandboxFor(c) {
  const forbidden = [];
  const simulated = [];
  const deny = (label) => { forbidden.push(label); throw new Error(`EXTERNAL_OPERATION_BLOCKED: ${label}`); };
  const deniedValue = (label) => new Proxy(function () {}, {
    get(_t, key) { if (key === '__esModule') return true; if (key === 'then') return undefined; return deniedValue(`${label}.${String(key)}`); },
    apply() { return deny(label); }, construct() { return deny(`new ${label}`); },
  });
  const client = deniedValue('database');
  const jar = { get: () => undefined, getAll: () => [], set: () => deny('cookie.set'), delete: () => deny('cookie.delete') };
  const session = { auth: { getUser: async () => ({ data: { user: null }, error: null }), signOut: async () => {
    if (!c.simulateSignout) return deny('auth.signOut');
    simulated.push('auth.signOut'); return { error: null };
  } } };
  const fakeSecret = 'local-audit-secret-never-used-over-http';
  const env = { NODE_ENV: c.localNodeEnv ?? 'production', ANTHROPIC_API_KEY: 'local-placeholder', CRON_SECRET: fakeSecret, BREVO_WEBHOOK_SECRET: fakeSecret, RESEND_WEBHOOK_SECRET: fakeSecret,
    RESEND_API_KEY: 'local-placeholder', ADMIN_EMAIL: 'audit@example.invalid' };
  const cjsModule = { exports: {} };
  const context = vm.createContext({
    module: cjsModule, exports: cjsModule.exports, URL, Request, Response, Headers, AbortSignal, TextEncoder, TextDecoder,
    process: { env }, console: { log() {}, warn() {}, error() {} },
    fetch: () => deny('fetch'), setTimeout: () => deny('timer'),
    require(id) {
      if (id === 'next/server') return { NextResponse: AuditResponse };
      if (id === 'next/headers') return { cookies: async () => jar, headers: async () => new Headers() };
      if (id === 'zod') return zod;
      if (id === '@/lib/admin/auth') return { verifyAdmin: async () => c.adminRole
        ? { id: -1, userId: 'local-audit-admin', email: 'audit@example.invalid', role: c.adminRole } : null };
      if (id === '@/lib/admin/service-client') return { getAdminServiceClient: () => client };
      if (id === '@/lib/supabase/service-client') return { getServiceClient: () => client };
      if (id === '@/lib/supabase/server') return { createClient: async () => session };
      if (id === '@supabase/ssr') return { createServerClient: (_url, _key, options) => ({ auth: {
        exchangeCodeForSession: async () => {
          if (!c.simulateExchange) return deny('auth.exchangeCodeForSession');
          simulated.push('auth.exchangeCodeForSession');
          if (c.simulateExchange === 'failure') return { error: { message: 'Synthetic invalid PKCE code' } };
          options.cookies.setAll([{ name: 'local-audit-session', value: 'not-a-real-session', options: { httpOnly: true } }]);
          return { error: null };
        },
      } }) };
      if (id === '@/lib/analytics/events' || id === '@/lib/auth/safe-redirect') {
        const eventModule = { exports: {} };
        const pureFile = id === '@/lib/analytics/events' ? 'lib/analytics/events.ts' : 'lib/auth/safe-redirect.ts';
        const js = ts.transpileModule(fs.readFileSync(path.join(ROOT, pureFile), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
        vm.runInNewContext(js, { exports: eventModule.exports, module: eventModule, URL });
        return eventModule.exports;
      }
      if (id === 'resend') return { Resend: class { webhooks = { verify: () => { throw new Error('Missing synthetic signature'); } }; } };
      // Aucun module du projet ni SDK externe n'est chargé par défaut. Toute
      // utilisation imprévue échoue et rend le cas rouge, même si le handler catch.
      return deniedValue(`module:${id}`);
    },
  });
  const source = fs.readFileSync(path.join(ROOT, c.route.file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInContext(js, context, { filename: c.route.file, timeout: 5000 });
  return { handler: cjsModule.exports[c.method], forbidden, simulated, fakeSecret };
}

async function resultOf(response, c) {
  const body = await response.text();
  let parsed;
  try { parsed = JSON.parse(body); } catch { /* HTML éventuel : jamais recopié */ }
  let location = response.headers.get('location');
  if (c.checkHtmlRedirect) {
    const literal = body.match(/window\.location\.href=([\s\S]*?);<\/script>/)?.[1];
    try { location = JSON.parse(literal); } catch { location = null; }
  }
  const assertions = {
    status: response.status === c.expected_status,
    ...(c.expectedField ? { body_field: parsed?.[c.expectedField[0]] === c.expectedField[1] } : {}),
    ...(c.expectSameOrigin ? { redirect_same_origin: location && new URL(location, BASE).origin === BASE } : {}),
    ...(c.expectedLocation ? { redirect_target: location === c.expectedLocation } : {}),
    ...(c.checkHtmlRedirect ? { inline_script_intact: (body.match(/<script>/gi) ?? []).length === 1 && (body.match(/<\/script>/gi) ?? []).length === 1 } : {}),
    ...(c.expectCallbackCookie ? { session_cookie_preserved: response.auditCookies?.length === 1 } : {}),
  };
  return { status: response.status, passed: Object.values(assertions).every(Boolean), assertions,
    content_type: response.headers.get('content-type'), bytes: Buffer.byteLength(body), body_sha256: sha(body),
    json_keys: parsed && !Array.isArray(parsed) && typeof parsed === 'object' ? Object.keys(parsed) : undefined,
    array_length: Array.isArray(parsed) ? parsed.length : undefined,
    // Le contenu métier (noms, emails, détails de projets) n'est jamais conservé.
    location: location && (c.simulateSignout || c.checkHtmlRedirect) ? location : undefined };
}

async function localCase(c) {
  if (c.local === false) return { exercised: false, reason: 'Lecture DB publique vérifiée par HTTP si --live ; aucune donnée de production dans le harness.' };
  let box;
  try {
    box = sandboxFor(c);
    const headers = new Headers(c.headers);
    if (c.body !== undefined) headers.set('content-type', 'application/json');
    if (c.syntheticAuth) headers.set('authorization', `Bearer ${box.fakeSecret}`);
    const request = new Request((c.localBase ?? BASE) + c.request_path, { method: c.method, headers, body: c.body });
    request.nextUrl = new URL(request.url);
    request.cookies = { getAll: () => [] };
    const response = await box.handler(request, { params: Promise.resolve({ id: 'invalid' }) });
    const result = await resultOf(response, c);
    return { exercised: true, ...result, passed: result.passed && box.forbidden.length === 0,
      blocked_operations: box.forbidden, simulated_operations: box.simulated };
  } catch (error) {
    return { exercised: true, passed: false, exception: error.name, error: error.message,
      blocked_operations: box?.forbidden ?? [], simulated_operations: box?.simulated ?? [] };
  }
}

async function liveCase(c) {
  if (!c.live) return { exercised: false, reason: 'Identité, mutation, secret fictif ou cas de sécurité réservé à la simulation.' };
  if (prior) {
    const previous = prior.routes.find((r) => r.template === c.route.template)?.cases.find((x) => x.method === c.method
      && x.label === c.label && x.request_path === c.request_path && x.body === c.body);
    return previous?.http_result?.exercised ? { ...previous.http_result, historical: true, observed_at: prior.generated_at }
      : { exercised: false, reason: 'Aucune sonde HTTP archivée pour ce cas.' };
  }
  if (!LIVE) return { exercised: false, reason: 'Exécution hors réseau ; ajouter --live pour les sondes HTTP autorisées.' };
  if (c.adminRole || c.syntheticAuth || c.simulateSignout) throw new Error('Une simulation ne peut jamais devenir une requête HTTP.');
  const headers = new Headers(c.headers);
  for (const name of ['authorization', 'cookie', 'stripe-signature', 'svix-signature']) {
    if (headers.has(name)) throw new Error(`Identifiant interdit dans les sondes HTTP : ${name}`);
  }
  headers.set('user-agent', 'Workwave-ReadOnlyAudit/1.0');
  if (c.body !== undefined) headers.set('content-type', 'application/json');
  const started = Date.now();
  try {
    const response = await fetch(BASE + c.request_path, { method: c.method, body: c.body, headers,
      credentials: 'omit', redirect: 'manual', signal: AbortSignal.timeout(20000) });
    return { exercised: true, ...await resultOf(response, c), duration_ms: Date.now() - started };
  } catch (error) {
    return { exercised: true, passed: false, error: error.message, cause: error.cause?.code, duration_ms: Date.now() - started };
  }
}

const cases = routes.flatMap((r) => r.cases);
for (const c of cases) c.local_result = await localCase(c);
// Exactement deux workers au maximum, aucune reprise automatique.
let cursor = 0;
await Promise.all([0, 1].map(async () => {
  while (cursor < cases.length) {
    const c = cases[cursor++];
    c.http_result = await liveCase(c);
  }
}));

const counts = (key) => ({ exercised: cases.filter((c) => c[key].exercised).length,
  passed: cases.filter((c) => c[key].passed).length,
  failed: cases.filter((c) => c[key].exercised && !c[key].passed).length });
const report = {
  generated_at: new Date().toISOString(), production_base: LIVE || prior ? BASE : null,
  ...(prior ? { http_observed_at: prior.generated_at, http_archive: '2026-09-12-routes-api-avant-correctifs.json' } : {}),
  scope: 'Tous les fichiers app/**/api/**/route.ts et app/auth/callback/route.ts ; méthodes explicitement exportées uniquement.',
  limitations: [
    'Un refus anonyme ne valide pas le parcours métier authentifié ni ses permissions détaillées.',
    'Les handlers locaux sont réellement exécutés après transpilation ; session, cookies et services sont remplacés par des doubles contrôlés. Tout appel externe inattendu est bloqué et fait échouer le cas.',
    'Les sondes HTTP concernent la version déployée ; les correctifs locaux ne sont pas déployés.',
    'HEAD implicite de GET et OPTIONS automatique Next ne sont pas des handlers supplémentaires ; aucune sonde HEAD sur GET à effets de bord.',
    'Aucun paiement, email, appel Anthropic, cron authentifié, désinscription réelle ou modification de production déclenché volontairement. Les logs HTTP et quotas mémoire peuvent compter les requêtes de contrôle.',
    'Les tableaux et états de production sont résumés sans conserver de contenu métier ou de données personnelles.',
  ],
  totals: { templates: routes.length, api_templates: routes.filter((r) => r.template.startsWith('/api/')).length,
    callback_templates: 1, methods: routes.reduce((n, r) => n + r.methods.length, 0), cases: cases.length,
    local: counts('local_result'), http: counts('http_result') },
  findings: cases.filter((c) => c.finding).map((c) => ({ template: c.route.template, method: c.method,
    description: c.finding, status: c.local_result.passed ? 'fixed_locally_not_deployed' : 'reproduced_locally' })),
  routes: routes.map((r) => ({ ...r, cases: r.cases.map((c) => ({ ...c, route: undefined,
    ...(c.finding ? { finding_status: c.local_result.passed ? 'fixed_locally_not_deployed' : 'reproduced_locally' } : {}) })) })),
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT + '.json', JSON.stringify(report, null, 2) + '\n');
const status = (result) => !result.exercised ? 'non exercé' : `${result.passed ? 'OK' : 'ÉCHEC'} ${result.status ?? result.cause ?? result.exception ?? 'réseau'}`;
const lines = ['# Audit des routes API — 12 septembre 2026', '',
  `${report.totals.api_templates} templates API + 1 callback Auth hors /api, soit ${report.totals.templates} templates, ${report.totals.methods} méthodes explicites, ${cases.length} cas.`, '',
  `Handlers locaux : ${report.totals.local.passed}/${report.totals.local.exercised} cas conformes. HTTP public : ${report.totals.http.passed}/${report.totals.http.exercised} cas conformes.${prior ? ' Les mesures HTTP ont été conservées avant les correctifs ; aucune correction locale n’a été déployée.' : ''}`, '',
  'Reproduction : `node scripts/audit-api-routes.mjs` (isolé) ou `node scripts/audit-api-routes.mjs --live` (sondes anonymes sûres, concurrence 2). Aucun fichier .env chargé.', '',
  ...(prior ? ['Résultats actuels générés avec `--reuse-http` pour reprendre les mesures HTTP [archivées avant corrections](2026-09-12-routes-api-avant-correctifs.json).', ''] : []),
  ...report.limitations.map((s) => '- ' + s), '',
  '| Méthode et template | Authentification | Effets du parcours complet | Contrôle principal local | HTTP public |',
  '| --- | --- | --- | --- | --- |',
  ...routes.flatMap((r) => r.methods.map(({ method, line }) => {
    const c = r.cases.find((x) => x.method === method);
    return `| [${method} ${r.template}](../../${r.file}#L${line}) | ${r.auth} | ${r.effects} | ${status(c.local_result)} | ${status(c.http_result)} |`;
  })), '', '## Correctifs vérifiés localement', '',
  ...report.findings.map((f) => `- ${f.method} ${f.template} : ${f.description} — ${f.status === 'fixed_locally_not_deployed' ? 'corrigé localement, non déployé' : 'défaut reproduit'}.`), '',
  'Les preuves du callback avant correction sont conservées dans [le rapport isolé](2026-09-12-auth-callback-avant-correctifs.json). Aucun code OAuth réel utilisé ; la pose du cookie de session reste vérifiée avec un double.', '',
  '## Cas détaillés et anomalies actuelles', '',
  ...cases.filter((c) => (c.local_result.exercised && !c.local_result.passed) || (c.http_result.exercised && !c.http_result.passed))
    .map((c) => `- **${c.method} ${c.route.template} — ${c.label}** : attendu ${c.expected_status} ; local ${status(c.local_result)} ; HTTP ${status(c.http_result)}. ${c.finding ?? c.local_result.error ?? c.http_result.error ?? 'Écart à examiner.'}`), '',
  'Les corps, attentes, résultats par cas et empreintes des sources figurent dans [le rapport JSON](2026-09-12-routes-api.json).', ''];
fs.writeFileSync(REPORT + '.md', lines.join('\n'));
console.log(JSON.stringify(report.totals));
for (const c of cases.filter((c) => c.local_result.exercised && !c.local_result.passed)) {
  console.log(JSON.stringify({ method: c.method, path: c.route.template, case: c.label, result: c.local_result }));
}
process.exitCode = report.totals.local.failed || report.totals.http.failed ? 1 : 0;
