// Actual Server Actions, real Supabase SDK and Next request context. Only the
// HTTP transport is simulated; no production URL or credential is loaded.
// Run: node --import tsx --test tests/server-actions.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";

globalThis.AsyncLocalStorage = AsyncLocalStorage;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://actions-test.invalid";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-only-anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-service";
process.env.NEXT_PUBLIC_BASE_URL = "https://actions-test.invalid";
// A paid branch must fail closed locally if reached by mistake.
delete process.env.STRIPE_SECRET_KEY;
process.env.RESEND_API_KEY = "test-only-resend";
process.env.ADMIN_EMAIL = "admin@example.test";
// Qualification helpers otherwise fall back to reading .env.local.
process.env.ANTHROPIC_API_KEY = "test-only-anthropic";
globalThis.fetch = async () => { throw new Error("Network disabled outside an isolated action request"); };

// Stripe 22's CommonJS entry stalls under the installed tsx loader. Reuse its
// real, native ESM implementation in the CJS cache; no Stripe method is mocked.
const require = createRequire(import.meta.url);
const stripeModule = await import("stripe");
const stripePath = require.resolve("stripe");
require.cache[stripePath] = { id: stripePath, filename: stripePath, loaded: true, exports: stripeModule.default };
const anthropicModule = await import("@anthropic-ai/sdk");
const anthropicPath = require.resolve("@anthropic-ai/sdk");
require.cache[anthropicPath] = { id: anthropicPath, filename: anthropicPath, loaded: true, exports: anthropicModule.default };

const { workAsyncStorage } = await import("next/dist/server/app-render/work-async-storage.external.js");
const { workUnitAsyncStorage } = await import("next/dist/server/app-render/work-unit-async-storage.external.js");
const { RequestCookies } = await import("next/dist/server/web/spec-extension/cookies.js");
const USER = { id: "00000000-0000-4000-8000-000000000042", email: "owner@example.test" };

function form(values = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, String(value));
  return data;
}

function assertRedirect(outcome, location) {
  assert.equal(outcome.thrown?.digest?.split(";")[0], "NEXT_REDIRECT", outcome.thrown?.stack);
  assert.equal(outcome.thrown.digest.split(";")[2], location);
}

async function inRequest(action, { user = null, respond, analyticsConsent = false } = {}) {
  const calls = [];
  const unexpected = [];
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    // Record the attempt before parsing: app code may swallow a malformed
    // transport/body error, but that must never make an attempted write vanish.
    const call = { url: null, method: init.method || (input instanceof Request ? input.method : "GET"), body: null };
    calls.push(call);
    let url;
    try {
      url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      call.url = url;
    } catch {
      unexpected.push(`${call.method} malformed-url`);
      throw new Error("Blocked malformed test URL");
    }
    const requestBody = init.body ?? (input instanceof Request ? input.body : null);
    if (requestBody !== null && requestBody !== undefined) {
      try {
        if (typeof requestBody !== "string") throw new Error("unsupported body");
        call.body = JSON.parse(requestBody);
      } catch {
        unexpected.push(`${call.method} ${url.hostname}${url.pathname} malformed-or-unsupported-body`);
        throw new Error("Blocked malformed or unsupported test body");
      }
    }
    if (url.hostname === "actions-test.invalid" && url.pathname === "/auth/v1/user" && user) return Response.json(user);
    if (["actions-test.invalid", "api.anthropic.com", "api.resend.com"].includes(url.hostname) && respond) {
      const response = await respond(call);
      if (response) return response;
    }
    unexpected.push(`${call.method} ${url.hostname}${url.pathname}`);
    throw new Error("Blocked unexpected test transport");
  };
  const hdrs = new Headers({ "x-forwarded-for": "192.0.2.42", "user-agent": "isolated-action-test" });
  const cookieJar = new RequestCookies(hdrs);
  if (analyticsConsent) cookieJar.set("consent_analytics", "accepted");
  if (user) cookieJar.set("sb-actions-test-auth-token", "base64-" + Buffer.from(JSON.stringify({
    access_token: "test-access-token", refresh_token: "test-refresh-token", expires_at: 4102444800,
    expires_in: 3600, token_type: "bearer", user,
  })).toString("base64url"));
  const store = { route: "/isolated-action-test", page: "/isolated-action-test/page", isStaticGeneration: false, incrementalCache: {} };
  const request = { type: "request", phase: "action", cookies: cookieJar, userspaceMutableCookies: cookieJar, mutableCookies: cookieJar, headers: hdrs };
  let result, thrown;
  try {
    try { result = await workAsyncStorage.run(store, () => workUnitAsyncStorage.run(request, action)); }
    catch (error) { thrown = error; }
    await new Promise(setImmediate);
    assert.deepEqual(unexpected, [], "all attempted requests must be explicitly simulated, even if app code catches a transport error");
    return { result, thrown, calls, store };
  } finally { globalThis.fetch = oldFetch; }
}


// Real submission, qualification, notifications and broadcast functions.
// All SDK HTTP calls terminate in the simulator below; no external fetch.
const VALID = { firstName: "Test", email: "client@example.test", phone: "0100000000",
  categoryId: 1, categoryIds: "1", cityId: 86,
  description: "Remplacer le mitigeur de cuisine et vérifier les raccordements existants.",
  urgency: "not_urgent", budget: "unknown", consent: "on", website: "" };
const CATEGORIES = [
  { id: 1, name: "Plombier", slug: "plombier", vertical: "btp" },
  { id: 2, name: "Électricien", slug: "electricien", vertical: "btp" },
  { id: 4, name: "Chauffagiste", slug: "chauffagiste", vertical: "btp" },
  { id: 5, name: "Climaticien", slug: "climaticien", vertical: "btp" },
  { id: 6, name: "Multiservice", slug: "multiservice", vertical: "domicile" },
  { id: 7, name: "Petit bricolage", slug: "petit-bricolage", vertical: "domicile" },
];
const CITY = { id: 86, name: "Poitiers", department_id: 86, country: "FR", postal_code: "86000",
  latitude: 46.58, longitude: 0.34, department: { name: "Vienne", code: "86" } };

async function simulate(options = {}, fields = {}) {
  const projects = [], emails = [], deliveries = new Map(), leads = [];
  let qualifications = 0;
  const empty = () => new Response(null, { status: 204 });
  const eqId = (url, name = "id") => Number((url.searchParams.get(name) || "").replace("eq.", ""));
  const deliveryKey = (value) => `${value.project_id}/${value.pro_id}/${value.kind}`;
  const keyFromUrl = (url) => `${eqId(url, "project_id")}/${eqId(url, "pro_id")}/${url.searchParams.get("kind")?.replace("eq.", "")}`;
  const { submitProject } = await import("../app/(public)/deposer-projet/actions.ts");
  const outcome = await inRequest(() => submitProject({ success: false }, form({ ...VALID, ...fields })), {
    analyticsConsent: options.analyticsConsent,
    respond: ({ url, method, body }) => {
      if (url.hostname === "api.anthropic.com" && url.pathname === "/v1/messages") {
        qualifications++;
        if (options.aiUnavailable) return Response.json({ type: "error", error: { type: "invalid_request_error", message: "Simulated unavailable provider" } }, { status: 400 });
        return Response.json({ id: "test-message", type: "message", role: "assistant", model: "test-only",
          content: [{ type: "text", text: JSON.stringify({ suspicion_score: 0, summary: "Remplacement d'un mitigeur", category_match: true }) }],
          stop_reason: "end_turn", usage: { input_tokens: 0, output_tokens: 0 } });
      }
      if (url.hostname === "api.resend.com" && url.pathname === "/emails" && method === "POST") {
        const to = Array.isArray(body.to) ? body.to : [body.to];
        assert(to.every((email) => email.endsWith("@example.test")), "Only synthetic recipients are allowed");
        emails.push({ ...body, recipients: to });
        if (options.proEmailFailure && to.includes("pro@example.test")) return Response.json({ name: "validation_error", message: "Simulated provider refusal" }, { status: 422 });
        return Response.json({ id: `simulated-mail-${emails.length}` });
      }
      if (url.hostname !== "actions-test.invalid") return;
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "categories" && method === "GET") {
        const id = url.searchParams.get("id");
        if (id?.startsWith("eq.")) return Response.json(CATEGORIES.find(c => c.id === eqId(url)) ?? null);
        if (id?.startsWith("in.")) return Response.json(CATEGORIES.filter(c => id.slice(3, -1).split(",").includes(String(c.id))));
        return Response.json(CATEGORIES);
      }
      if (table === "cities" && method === "GET") return Response.json(CITY);
      if (table === "projects") {
        if (method === "GET") {
          assert.equal(url.searchParams.get("email"), "eq.client@example.test");
          assert.equal(url.searchParams.get("status"), "neq.deleted");
          assert(url.searchParams.get("created_at")?.startsWith("gte."));
          return Response.json(options.duplicate ? [{ id: 9001 }] : []);
        }
        if (method === "POST") {
          if (options.insertFailure) return Response.json({ code: "23514", message: "Simulated database rejection" }, { status: 400 });
          const id = 9001 + projects.length;
          projects.push({ id, ...body });
          return Response.json({ id });
        }
        if (method === "PATCH") {
          const project = projects.find(p => p.id === eqId(url));
          assert(project, "A notification may only update a created project");
          Object.assign(project, body);
          return empty();
        }
      }
      if (table === "pros" && method === "GET") {
        assert.equal(url.searchParams.get("do_not_contact"), "eq.false");
        assert.equal(url.searchParams.get("deleted_at"), "is.null");
        assert.equal(url.searchParams.get("claimed_by_user_id"), "not.is.null");
        return Response.json([{ id: 42, email: "pro@example.test", name: "Test pro", paused_until: null, intervention_radius_km: 200, city: CITY }]);
      }
      if (table === "lead_unlocks" && method === "GET") return Response.json([]);
      if (table === "events" && method === "POST") return empty();
      if (table === "project_email_deliveries") {
        if (method === "POST") {
          const key = deliveryKey(body);
          if (!deliveries.has(key)) deliveries.set(key, { ...body, sent_at: null, provider_id: null });
          return empty();
        }
        if (method === "GET") return Response.json(deliveries.get(keyFromUrl(url)) ?? null);
        if (method === "PATCH") {
          const delivery = deliveries.get(keyFromUrl(url));
          assert(delivery, "The email journal must exist before its confirmation");
          Object.assign(delivery, body);
          return empty();
        }
        if (method === "HEAD") {
          const count = [...deliveries.values()].filter(d => d.project_id === eqId(url, "project_id") && d.sent_at).length;
          return new Response(null, { status: 200, headers: { "content-range": count ? `0-${count - 1}/${count}` : "*/0" } });
        }
      }
      if (table === "project_leads") {
        if (method === "GET") return Response.json(leads.filter(l => l.project_id === eqId(url, "project_id")));
        if (method === "POST") { leads.push(...body); return empty(); }
      }
    },
  });
  return { outcome, projects, emails, deliveries: [...deliveries.values()], leads, qualifications };
}

function mailTo(result, address) { return result.emails.filter(e => e.recipients.includes(address)); }

test("valid project is saved, confirmed, broadcast and redirected to thank-you", async () => {
  const r = await simulate();
  assertRedirect(r.outcome, "/deposer-projet/merci");
  assert.equal(r.projects.length, 1);
  assert.equal(r.projects[0].status, "new");
  assert.equal(r.projects[0].broadcast_count, 1);
  assert(r.projects[0].broadcasted_at);
  assert.equal(r.qualifications, 1);
  assert.equal(mailTo(r, "client@example.test").length, 1);
  assert.equal(mailTo(r, "admin@example.test").length, 1);
  assert.equal(mailTo(r, "pro@example.test").length, 1);
  assert.equal(r.deliveries.length, 1);
  assert(r.deliveries[0].sent_at);
  assert.equal(r.deliveries[0].html, "");
  assert.equal(r.leads.length, 1);
  assert(!mailTo(r, "pro@example.test")[0].html.includes(r.projects[0].deletion_token));
  assert(!mailTo(r, "pro@example.test")[0].html.includes(VALID.email));
});

test("actual submission carries only consented attribution; invalid or refused context never blocks the project", async () => {
  const context = { version: 1, sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', entryPath: '/artisan/lf-concept-00021?email=private@example.test', startedAt: Date.now(), lastCta: 'profile-project' };
  for (const [consented, acquisition, expected] of [[true, JSON.stringify(context), true], [false, JSON.stringify(context), false], [true, '{bad', false]]) {
    const r = await simulate({ analyticsConsent: consented }, { acquisition });
    assertRedirect(r.outcome, '/deposer-projet/merci');
    const event = r.outcome.calls.find(call => call.url.pathname === '/rest/v1/events' && call.body?.event_name === 'project_form_submitted')?.body;
    assert(event, 'the successful server submission is recorded');
    assert.equal(!!event.metadata?.acquisition, expected);
    assert.equal(event.project_id, r.projects[0].id);
    if (expected) {
      assert.equal(event.session_id, context.sessionId);
      assert.equal(event.metadata.acquisition.entryPath, '/artisan/lf-concept-00021');
    } else assert.equal(event.session_id, null);
  }
});

test("repeated submission creates no second project or notification", async () => {
  const r = await simulate({ duplicate: true });
  assertRedirect(r.outcome, "/deposer-projet/merci");
  assert.equal(r.projects.length, 0);
  assert.equal(r.emails.length, 0);
  assert.equal(r.deliveries.length, 0);
});

test("database refusal displays an error and sends no confirmations", async () => {
  const r = await simulate({ insertFailure: true });
  assert.equal(r.outcome.thrown, undefined);
  assert.equal(r.outcome.result.success, false);
  assert.match(r.outcome.result.message, /erreur/i);
  assert.equal(r.emails.length, 0);
  assert.equal(r.deliveries.length, 0);
});

test("AI provider failure does not prevent a valid project deposit", async () => {
  const r = await simulate({ aiUnavailable: true });
  assertRedirect(r.outcome, "/deposer-projet/merci");
  assert.equal(r.projects.length, 1);
  assert.equal(r.projects[0].ai_qualification, null);
  assert.equal(r.projects[0].broadcast_count, 1);
});

test("professional email refusal keeps the project available for rescue", async () => {
  const r = await simulate({ proEmailFailure: true });
  assertRedirect(r.outcome, "/deposer-projet/merci");
  assert.equal(r.projects.length, 1);
  assert.equal(r.projects[0].broadcast_count, 0);
  assert.equal(r.projects[0].broadcasted_at, undefined);
  assert.equal(r.deliveries[0].sent_at, null);
  assert.match(r.deliveries[0].last_error, /Simulated provider refusal/);
  assert.equal(r.leads.length, 0);
});

test("two trades create two distinct projects but one customer confirmation", async () => {
  const r = await simulate({}, { categoryIds: "1,2,2" });
  assertRedirect(r.outcome, "/deposer-projet/merci");
  assert.deepEqual(r.projects.map(p => p.category_id), [1, 2]);
  assert.equal(r.qualifications, 1);
  assert.equal(new Set(r.projects.map(p => p.deletion_token)).size, 2);
  assert.equal(mailTo(r, "client@example.test").length, 1);
  assert.equal(mailTo(r, "admin@example.test").length, 2);
  assert.equal(mailTo(r, "pro@example.test").length, 2);
  assert.equal(r.deliveries.length, 2);
});
