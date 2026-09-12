// Actual Server Actions, real Supabase SDK and Next request context. Only the
// HTTP transport is simulated; no production URL or credential is loaded.
// Run: node --import tsx --test tests/server-actions.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { actionCases } from "./server-action-cases.mjs";

globalThis.AsyncLocalStorage = AsyncLocalStorage;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://actions-test.invalid";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-only-anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-service";
process.env.NEXT_PUBLIC_BASE_URL = "https://actions-test.invalid";
// A paid branch must fail closed locally if reached by mistake.
delete process.env.STRIPE_SECRET_KEY;
delete process.env.RESEND_API_KEY;
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

async function inRequest(action, { user = null, respond } = {}) {
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
    if (url.hostname === "actions-test.invalid" && respond) {
      const response = await respond(call);
      if (response) return response;
    }
    unexpected.push(`${call.method} ${url.hostname}${url.pathname}`);
    throw new Error("Blocked unexpected test transport");
  };
  const hdrs = new Headers({ "x-forwarded-for": "192.0.2.42", "user-agent": "isolated-action-test" });
  const cookieJar = new RequestCookies(hdrs);
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
    assert.deepEqual(unexpected, [], "all attempted requests must be explicitly simulated, even if app code catches a transport error");
    return { result, thrown, calls, store };
  } finally { globalThis.fetch = oldFetch; }
}

test("admin update refuses an anonymous caller before reading or writing service-role data", async () => {
  const { updateProByAdmin } = await import("../app/admin/(dashboard)/pros/[id]/actions.ts");
  const outcome = await inRequest(() => updateProByAdmin({ proId: 42, description: "Simulated edit" }), {
    respond: ({ method }) => method === "GET" ? Response.json({ slug: "test-pro" }) : new Response(null, { status: 204 }),
  });
  assert.equal(outcome.thrown, undefined);
  assert.deepEqual(outcome.result, { ok: false, error: "Non autorisé" });
  assert.deepEqual(outcome.calls, []);
});

test("admin update refuses an authenticated non-admin, then permits a scoped admin edit", async () => {
  const { updateProByAdmin } = await import("../app/admin/(dashboard)/pros/[id]/actions.ts");
  for (const allowed of [false, true]) {
    const outcome = await inRequest(() => updateProByAdmin({ proId: 42, description: "  Simulated edit  " }), {
      user: USER,
      respond: ({ url, method, body }) => {
        if (url.pathname === "/rest/v1/admins") {
          assert.equal(url.searchParams.get("user_id"), `eq.${USER.id}`);
          return Response.json(allowed ? { id: 1, user_id: USER.id, email: USER.email, role: "admin" } : null);
        }
        if (allowed && url.pathname === "/rest/v1/pros") {
          assert.equal(url.searchParams.get("id"), "eq.42");
          if (method === "GET") return Response.json({ slug: "test-pro" });
          assert.equal(method, "PATCH");
          assert.equal(body.description, "Simulated edit");
          return new Response(null, { status: 204 });
        }
      },
    });
    assert.equal(outcome.thrown, undefined);
    assert.deepEqual(outcome.result, allowed ? { ok: true } : { ok: false, error: "Non autorisé" });
    assert.equal(outcome.calls.filter((call) => call.method === "PATCH").length, allowed ? 1 : 0);
    assert.equal(outcome.calls.filter((call) => call.url.pathname === "/rest/v1/admins").length, 1);
  }
});

for (const item of actionCases) {
  test(`${item.action}: ${item.kind}${item.localized ? " (FR + EN)" : ""}`, async () => {
    const actionModule = await import(`../${item.module}`);
    for (const locale of item.localized ? ["fr", "en"] : ["fr"]) {
      const args = item.args.map(arg => arg === "form" ? form({ ...item.form, locale }) : arg === "state" ? { success: false } : arg);
      const outcome = await inRequest(() => actionModule[item.action](...args));
      assert.deepEqual(outcome.calls, [], "rejected input/session must never reach a provider or database");
      if (item.redirect) {
        assertRedirect(outcome, (locale === "en" ? "/en" : "") + item.redirect);
      } else {
        assert.equal(outcome.thrown, undefined);
        if (item.kind === "auth-result") assert.deepEqual(outcome.result, { error: "Non authentifié" });
        else if (item.kind === "auth-admin") {
          assert.equal(outcome.result.ok, false);
          assert.match(outcome.result.error, /autoris/i);
        } else if (item.kind === "invalid-ok-result") assert.equal(outcome.result.ok, false);
        else if (item.kind === "invalid-french-result") assert.equal(outcome.result.statut, "erreur");
        else assert.equal(outcome.result.success, false);
      }
    }
  });
}

test("all protected pro/AI actions refuse an authenticated account without an owned active profile", async () => {
  const protectedCases = actionCases.filter(item => item.kind.startsWith("auth-") && !item.module.includes("/admin/"));
  for (const item of protectedCases) {
    const actionModule = await import(`../${item.module}`);
    const args = item.args.map(arg => arg === "form" ? form(item.form) : arg === "state" ? { success: false } : arg);
    const outcome = await inRequest(() => actionModule[item.action](...args), {
      user: USER,
      respond: ({ url, method }) => {
        if (method === "GET" && url.pathname === "/rest/v1/pros") {
          assert.equal(url.searchParams.get("claimed_by_user_id"), `eq.${USER.id}`, item.action);
          return Response.json(null);
        }
      },
    });
    assert.equal(outcome.calls.some(call => !["GET", "HEAD"].includes(call.method)), false, item.action);
    if (item.redirect) assert.equal(outcome.thrown?.digest?.split(";")[0], "NEXT_REDIRECT", item.action);
    else {
      assert.equal(outcome.thrown, undefined, item.action);
      assert.ok(outcome.result.error, item.action);
    }
  }
});

test("lead actions reject a different pro's lead and opened writes are scoped and monotonic", async () => {
  const actionModule = await import("../app/pro/dashboard/leads/[id]/actions.ts");
  for (const action of ["markLeadOpened", "markLeadContacted", "markLeadNotRelevant"]) {
    const outcome = await inRequest(() => actionModule[action](9), { user: USER, respond: ({ url, method }) => {
      if (method !== "GET") return;
      if (url.pathname === "/rest/v1/pros") return Response.json({ id: 42 });
      if (url.pathname === "/rest/v1/project_leads") {
        assert.equal(url.searchParams.get("id"), "eq.9");
        assert.equal(url.searchParams.get("pro_id"), "eq.42");
        return Response.json(null);
      }
    }});
    assert.deepEqual(outcome.result, { error: "Lead introuvable" });
  }
  const opened = await inRequest(() => actionModule.markLeadOpened(9), { user: USER, respond: ({ url, method, body }) => {
    if (url.pathname === "/rest/v1/pros" && method === "GET") return Response.json({ id: 42 });
    if (url.pathname === "/rest/v1/project_leads") {
      assert.equal(url.searchParams.get("id"), "eq.9");
      assert.equal(url.searchParams.get("pro_id"), "eq.42");
      if (method === "GET") return Response.json({ id: 9 });
      assert.equal(url.searchParams.get("status"), "in.(sent)");
      assert.equal(body.status, "opened");
      return new Response(null, { status: 204 });
    }
  }});
  assert.equal(opened.thrown, undefined);
  assert.deepEqual(opened.result, { success: true });
});

for (const vertical of ["btp", "tech"]) {
  test(`${vertical} unlock: invalid/consent, profile, vertical, deleted and duplicate guards; free duplicate is idempotent`, async () => {
    const actionModule = await import(vertical === "btp" ? "../app/pro/dashboard/leads/actions.ts" : "../app/(ai)/ai/dashboard/projets/actions.ts");
    const action = actionModule[vertical === "btp" ? "startBtpUnlock" : "startTechUnlock"];
    const base = vertical === "btp" ? "/pro/dashboard/leads" : "/ai/dashboard/projets";
    assertRedirect(await inRequest(() => action(form())), `${base}?error=invalid_project`);
    assertRedirect(await inRequest(() => action(form({ projectId: 9 }))), `${base}?error=cgv_required`);
    for (const branch of ["no-pro", "missing", "wrong-vertical", "deleted", "already", "free-replay", ...(vertical === "btp" ? ["paused"] : [])]) {
      const outcome = await inRequest(() => action(form({ projectId: 9, cgvAccepted: "on" })), { user: USER, respond: ({ url, method, body }) => {
        if (url.pathname === "/rest/v1/pros" && method === "GET") {
          assert.equal(url.searchParams.get("claimed_by_user_id"), `eq.${USER.id}`);
          assert.equal(url.searchParams.get("is_active"), "eq.true");
          assert.equal(url.searchParams.get("deleted_at"), "is.null");
          assert.ok(url.searchParams.get("category_id")?.includes("in."));
          return Response.json(branch === "no-pro" ? null : { id: 42, name: "Test", paused_until: branch === "paused" ? "2099-01-01" : null });
        }
        if (url.pathname === "/rest/v1/projects" && method === "GET") return Response.json(branch === "missing" ? null : {
          id: 9, vertical: branch === "wrong-vertical" ? "other" : vertical, status: branch === "deleted" ? "deleted" : "new",
        });
        if (url.pathname === "/rest/v1/lead_unlocks") {
          if (method === "GET") return Response.json(branch === "already" ? { id: 77 } : null);
          assert.equal(branch, "free-replay");
          if (method === "HEAD") {
            assert.equal(url.searchParams.get("pro_id"), "eq.42");
            assert.equal(url.searchParams.get("amount_cents"), "eq.0");
            return new Response(null, { status: 200, headers: { "content-range": "0-0/1" } });
          }
          assert.equal(method, "POST");
          assert.equal(body.pro_id, 42);
          assert.equal(body.project_id, 9);
          assert.equal(body.amount_cents, 0);
          assert.equal(body.stripe_payment_intent_id, "free_42_9");
          return Response.json({ code: "23505", message: "Simulated concurrent unlock" }, { status: 409 });
        }
      }});
      const error = vertical === "btp"
        ? { "no-pro": "no_pro", missing: "project_not_found", "wrong-vertical": "not_btp_project", deleted: "project_deleted", paused: "paused" }
        : { "no-pro": "unauthorized", missing: "project_not_found", "wrong-vertical": "project_not_found", deleted: "project_not_found" };
      const expected = branch === "already" ? `${base}?already_unlocked=9`
        : branch === "free-replay" ? `${base}?unlocked=9&offert=1` : `${base}?error=${error[branch]}`;
      assertRedirect(outcome, expected);
    }
  });
}

test("media actions reject forged photo ownership and unsupported files before storage writes", async () => {
  const proModule = await import("../app/pro/dashboard/fiche/actions.ts");
  const aiModule = await import("../app/(ai)/ai/dashboard/profil/actions.ts");
  const foreign = "https://actions-test.invalid/pro-photos/other-pro/foreign.jpg";
  const respond = ({ url, method }) => {
    if (url.pathname === "/rest/v1/pros" && method === "GET") {
      assert.equal(url.searchParams.get("claimed_by_user_id"), `eq.${USER.id}`);
      return Response.json({ id: 42, slug: "test-pro", photos: [] });
    }
  };
  for (const invoke of [() => proModule.deleteProPhoto(foreign), () => proModule.saveProPhotoCaption({}, form({ url: foreign, legende: "test" }))]) {
    const outcome = await inRequest(invoke, { user: USER, respond });
    assert.deepEqual(outcome.result, { error: "Photo introuvable" });
  }
  const ai = await inRequest(() => aiModule.deleteAiPortfolioPhoto(form({ photoUrl: foreign })), { user: USER, respond });
  assertRedirect(ai, "/ai/dashboard/profil?error=photo_not_yours#portfolio");
  for (const [name, field] of [["uploadProLogo", "logo"], ["uploadProCover", "couverture"], ["uploadProPhoto", "photo"]]) {
    const data = form(); data.set(field, new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }));
    const outcome = await inRequest(() => proModule[name]({}, data), { user: USER, respond });
    assert.match(outcome.result.error, /JPEG, PNG ou WebP/);
  }
});

test("public deposit rejects embedded contact details and missing consent before AI/database work", async () => {
  const { submitProject } = await import("../app/(public)/deposer-projet/actions.ts");
  const valid = { firstName: "Test", email: "client@example.test", phone: "0600000000", categoryId: 1, cityId: 1,
    description: "Un projet de rénovation de salle de bains à étudier.", urgency: "this_month", budget: "unknown", consent: "on", website: "" };
  for (const [field, value] of [["description", "Pour refaire ma cuisine contactez client@example.test."], ["consent", "false"]]) {
    const outcome = await inRequest(() => submitProject({}, form({ ...valid, [field]: value })));
    assert.equal(outcome.thrown, undefined);
    assert.equal(outcome.result.success, false);
    assert.ok(outcome.result.errors[field]);
    assert.deepEqual(outcome.calls, []);
  }
});

test("claim verification consumes a hashed exact-target proof and never creates auth users after a denied proof", async () => {
  const { verifyClaim } = await import("../app/(public)/pro/reclamer/[slug]/actions.ts");
  for (const error of ["invalid", "expired", "blocked", "unavailable", "code"]) {
    const outcome = await inRequest(() => verifyClaim({}, form({ attemptId: 7, slug: "test-pro", code: "123456" })), { respond: ({ url, method, body }) => {
      if (url.pathname === "/rest/v1/rpc/consume_pro_claim_code" && method === "POST") {
        assert.deepEqual(body, { p_attempt_id: 7, p_slug: "test-pro", p_code_hash: createHash("sha256").update("123456").digest("hex") });
        return Response.json({ error, remaining: 2 });
      }
    }});
    assert.equal(outcome.result.success, false);
    assert.ok(outcome.result.message);
    assert.equal(outcome.calls.length, 1);
  }
});

test("deletion verification rejects no session, another owner/email, another operation or exact target", async () => {
  const { verifyDeletion } = await import("../app/(public)/artisan/[slug]/supprimer/actions.ts");
  for (const branch of ["anonymous", "other-owner", "other-email", "other-operation", "other-target"]) {
    const outcome = await inRequest(() => verifyDeletion({}, form({ attemptId: 7, slug: "test-pro", code: "123456" })), {
      user: branch === "anonymous" ? null : USER,
      respond: ({ url, method }) => {
        if (method !== "GET") return;
        if (url.pathname === "/rest/v1/claim_attempts") {
          assert.equal(url.searchParams.get("id"), "eq.7");
          assert.equal(url.searchParams.get("type"), "eq.deletion");
          return Response.json({ id: 7, target_pro_id: branch === "other-target" ? 99 : 42, siret: "00000000000042", email: branch === "other-email" ? "other@example.test" : USER.email, type: branch === "other-operation" ? "claim" : "deletion" });
        }
        if (url.pathname === "/rest/v1/pros") return Response.json({ id: 42, siret: "00000000000042", claimed_by_user_id: branch === "other-owner" ? "other-user" : USER.id });
      },
    });
    assert.equal(outcome.thrown, undefined);
    assert.equal(outcome.result.success, false);
    assert.match(outcome.result.message, /ne permet pas de supprimer/);
  }
});

test("project deletion rejects unknown/already deleted tokens and reports a database write failure", async () => {
  const { deleteProject } = await import("../app/(public)/deposer-projet/supprimer/actions.ts");
  for (const branch of ["unknown", "deleted", "write-fails", "success-no-recipients"]) {
    const outcome = await inRequest(() => deleteProject({}, form({ token: "test-token" })), { respond: ({ url, method, body }) => {
      if (url.pathname === "/rest/v1/projects") {
        if (method === "GET") {
          assert.equal(url.searchParams.get("deletion_token"), "eq.test-token");
          return Response.json(branch === "unknown" ? null : { id: 9, status: branch === "deleted" ? "deleted" : "new" });
        }
        assert.equal(url.searchParams.get("id"), "eq.9");
        assert.deepEqual(body, { status: "deleted" });
        if (branch === "write-fails") return Response.json({ message: "Simulated unavailable database" }, { status: 503 });
        return new Response(null, { status: 204 });
      }
      if (branch === "success-no-recipients" && url.pathname === "/rest/v1/project_leads") return Response.json([]);
    }});
    assert.equal(outcome.thrown, undefined);
    assert.equal(outcome.result.success, branch === "success-no-recipients");
  }
});

test("preferences writes target the authenticated profile; invalid radius/date never writes", async () => {
  const { updatePreferences } = await import("../app/pro/dashboard/preferences/actions.ts");
  const { updateAiPreferences } = await import("../app/(ai)/ai/dashboard/preferences/actions.ts");
  for (const branch of ["btp-valid", "btp-invalid", "ai-valid", "ai-invalid"]) {
    const ai = branch.startsWith("ai");
    const valid = branch.endsWith("-valid");
    const data = form(ai ? { available_for_remote: "true", min_budget: "600000", paused_until: valid ? "" : "bad-date" }
      : { intervention_radius_km: valid ? 50 : 500, urgency_available: "true" });
    const outcome = await inRequest(() => ai ? updateAiPreferences(data) : updatePreferences({}, data), { user: USER, respond: ({ url, method, body }) => {
      if (url.pathname !== "/rest/v1/pros") return;
      if (method === "GET") {
        assert.equal(url.searchParams.get("claimed_by_user_id"), `eq.${USER.id}`);
        return Response.json({ id: 42 });
      }
      assert.equal(valid, true);
      assert.equal(method, "PATCH");
      assert.equal(url.searchParams.get("id"), "eq.42");
      assert.equal(Object.hasOwn(body, "claimed_by_user_id"), false);
      if (ai) { assert.equal(body.min_budget, 500000); assert.equal(body.available_for_remote, true); }
      else { assert.equal(body.intervention_radius_km, 50); assert.equal(body.urgency_available, true); }
      return new Response(null, { status: 204 });
    }});
    if (ai) assertRedirect(outcome, `/ai/dashboard/preferences?${valid ? "saved=1" : "error=invalid_date"}`);
    else if (valid) assert.deepEqual(outcome.result, { success: true });
    else assert.ok(outcome.result.fieldErrors.intervention_radius_km);
  }
});

test("claim moderation rejects non-admin, missing verification, invalid input and a conflicting RPC; rejection is scoped", async () => {
  const { reviewClaim } = await import("../app/admin/(dashboard)/reclamations/actions.ts");
  for (const branch of ["non-admin", "invalid", "missing-evidence", "conflict", "rejected"]) {
    const values = { requestId: branch === "invalid" ? "bad" : 7, decision: branch === "missing-evidence" ? "approved" : "rejected", note: "Justification de test complète." };
    const outcome = await inRequest(() => reviewClaim(form(values)), { user: USER, respond: ({ url, method, body }) => {
      if (url.pathname === "/rest/v1/admins" && method === "GET") return Response.json(branch === "non-admin" ? null : { id: 1, user_id: USER.id, role: "admin", email: USER.email });
      if (["conflict", "rejected"].includes(branch) && url.pathname === "/rest/v1/rpc/review_pro_claim" && method === "POST") {
        assert.deepEqual(body, { p_request_id: 7, p_admin_user_id: USER.id, p_decision: "rejected", p_note: values.note });
        return branch === "conflict" ? Response.json({ code: "P0001", message: "Simulated conflict" }, { status: 409 }) : Response.json({ status: "rejected" });
      }
    }});
    assertRedirect(outcome, branch === "non-admin" ? "/admin/login" : `/admin/reclamations?result=${["invalid", "missing-evidence"].includes(branch) ? "incomplete" : branch === "conflict" ? "conflict" : "saved"}`);
  }
});

test("review moderation requires pending submitted rows and handles replay without publishing again", async () => {
  const actionModule = await import("../app/admin/(dashboard)/reviews/actions.ts");
  for (const name of ["publishReview", "rejectReview"]) {
    const outcome = await inRequest(() => actionModule[name](7), { user: USER, respond: ({ url, method, body }) => {
      if (url.pathname === "/rest/v1/admins") return Response.json({ id: 1, user_id: USER.id, email: USER.email, role: "admin" });
      if (url.pathname === "/rest/v1/pro_reviews" && method === "PATCH") {
        assert.equal(url.searchParams.get("id"), "eq.7");
        assert.equal(url.searchParams.get("status"), "eq.pending");
        assert.equal(url.searchParams.get("submitted_at"), "not.is.null");
        assert.equal(body.status, name === "publishReview" ? "published" : "rejected");
        return Response.json(null);
      }
    }});
    assert.equal(outcome.thrown, undefined);
    assert.equal(outcome.result.ok, false);
    assert.match(outcome.result.error, /déjà été traité/);
  }
});

test("unsubscribe tokens are bound to their pro/email and operation; valid requests persist scoped opt-outs", async () => {
  const { generateUnsubscribeToken, generateGlobalUnsubscribeToken } = await import("../lib/utils/unsubscribe-token.ts");
  const { generateReviewUnsubscribeToken } = await import("../lib/utils/review-unsubscribe-token.ts");
  const { processUnsubscribe } = await import("../app/(public)/unsubscribe/actions.ts");
  const { processGlobalUnsubscribe } = await import("../app/(public)/unsubscribe-all/actions.ts");
  const { processReviewUnsubscribe } = await import("../app/(public)/unsubscribe-review/actions.ts");
  const cold = generateUnsubscribeToken(42), global = generateGlobalUnsubscribeToken(42), review = generateReviewUnsubscribeToken(USER.email);
  for (const invoke of [() => processUnsubscribe(99, cold), () => processUnsubscribe(42, global), () => processGlobalUnsubscribe(42, cold), () => processReviewUnsubscribe("other@example.test", review)]) {
    const outcome = await inRequest(invoke);
    assert.equal(outcome.result.success, false);
    assert.deepEqual(outcome.calls, []);
  }
  for (const kind of ["cold", "global", "review"]) {
    const invoke = kind === "cold" ? () => processUnsubscribe(42, cold) : kind === "global" ? () => processGlobalUnsubscribe(42, global) : () => processReviewUnsubscribe(USER.email, review);
    const outcome = await inRequest(invoke, { respond: ({ url, method, body }) => {
      if (url.pathname === "/rest/v1/pros") {
        assert.equal(url.searchParams.get("id"), "eq.42");
        if (method === "GET") return Response.json({ email: USER.email });
        assert.equal(body.do_not_contact, true);
        return new Response(null, { status: 204 });
      }
      if (url.pathname === "/rest/v1/email_sequences") {
        assert.equal(url.searchParams.get("pro_id"), "eq.42");
        assert.equal(url.searchParams.get("status"), "in.(pending,active)");
        assert.equal(body.status, "unsubscribed");
        return new Response(null, { status: 204 });
      }
      if (["/rest/v1/email_blacklist", "/rest/v1/review_unsubscribes"].includes(url.pathname)) {
        assert.equal(url.searchParams.get("on_conflict"), "email");
        assert.equal(body.email, USER.email);
        return new Response(null, { status: 201 });
      }
    }});
    assert.equal(outcome.thrown, undefined);
    assert.deepEqual(outcome.result, { success: true });
  }
});

test("AI public forms validate required input and categories before qualification or activation", async () => {
  const { submitTechProject } = await import("../app/(ai)/ai/deposer/actions.ts");
  const { submitInscription } = await import("../app/(ai)/ai/inscription/actions.ts");
  for (const locale of ["fr", "en"]) {
    const base = locale === "en" ? "/en/ai" : "/ai";
    assertRedirect(await inRequest(() => submitTechProject(form({ locale }))), `${base}/deposer?error=missing_fields`);
    const signup = await inRequest(() => submitInscription(form({ locale })));
    assertRedirect(signup, `${base}/inscription?error=missing_fields`);
    const project = await inRequest(() => submitTechProject(form({ locale, category: "forged", title: "Test", description: "Un projet fictif", budget: "tbd", timeline: "flexible", contactName: "Test", contactEmail: USER.email })));
    assertRedirect(project, `${base}/deposer?error=invalid_category`);
  }
});

test("global unsubscribe never reports success when any of its three opt-out writes fails", async () => {
  const { processGlobalUnsubscribe } = await import("../app/(public)/unsubscribe-all/actions.ts");
  const { generateGlobalUnsubscribeToken } = await import("../lib/utils/unsubscribe-token.ts");
  for (const failedTable of ["pros", "email_blacklist", "email_sequences"]) {
    const outcome = await inRequest(() => processGlobalUnsubscribe(42, generateGlobalUnsubscribeToken(42)), { respond: ({ url, method }) => {
      if (url.pathname === "/rest/v1/pros" && method === "GET") return Response.json({ email: USER.email });
      if (method === "GET") return;
      if (url.pathname === `/rest/v1/${failedTable}`) return Response.json({ code: "TEST_FAILURE", message: "Simulated write failure" }, { status: 500 });
      if (["/rest/v1/pros", "/rest/v1/email_blacklist", "/rest/v1/email_sequences"].includes(url.pathname)) return new Response(null, { status: 204 });
    }});
    assert.equal(outcome.thrown, undefined);
    assert.equal(outcome.result.success, false, failedTable);
    assert.match(outcome.result.error, /réessayer/i);
    assert.equal(outcome.calls.filter(call => call.method !== "GET").length, 3, "preserve every successful opt-out even if another write fails");
  }
});

test("AI preferences never reports saved when the profile update fails (FR + EN)", async () => {
  const { updateAiPreferences } = await import("../app/(ai)/ai/dashboard/preferences/actions.ts");
  for (const locale of ["fr", "en"]) {
    const outcome = await inRequest(() => updateAiPreferences(form({ locale, available_for_remote: "true" })), { user: USER, respond: ({ url, method }) => {
      if (url.pathname !== "/rest/v1/pros") return;
      return method === "GET" ? Response.json({ id: 42 }) : Response.json({ code: "TEST_FAILURE", message: "Simulated write failure" }, { status: 500 });
    }});
    assertRedirect(outcome, `${locale === "en" ? "/en" : ""}/ai/dashboard/preferences?error=save_failed`);
  }
});

test("the harness detects malformed/unsupported fetch attempts even when an action swallows the error", async () => {
  for (const body of ["invalid-json", form({ unsafe: "attempt" })]) {
    await assert.rejects(inRequest(async () => {
      try { await fetch("https://actions-test.invalid/rest/v1/pros", { method: "POST", body }); }
      catch { /* Simulate an action that silently catches transport errors. */ }
    }), /all attempted requests must be explicitly simulated/);
  }
});
