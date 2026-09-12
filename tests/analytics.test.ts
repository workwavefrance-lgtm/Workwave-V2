import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AnalyticsClient from "../app/admin/(dashboard)/analytics/AnalyticsClient";
import { isAnalyticsTestActivity } from "../lib/analytics/test-accounts";
import {
  computeBusinessActivity,
  computeFormActivity,
  computeKpis,
  getAdminAnalytics,
  isValidAnalyticsProject,
  type RawEvent,
  type RawProject,
  type RawUnlock,
} from "../lib/queries/admin-events";
import {
  agregerEvents,
  agregerProjets,
  agregerUnlocks,
  construireEntonnoir,
  type Contexte,
} from "../lib/queries/stats-jour";

const createdAt = "2026-09-11T12:00:00.000Z";
const event = (name: string, changes: Partial<RawEvent> = {}): RawEvent => ({
  event_name: name, created_at: createdAt, project_id: null, pro_id: null, metadata: null,
  ...changes,
});
const unlock = (proId: number, amount: number): RawUnlock => ({
  pro_id: proId, project_id: 1, amount_cents: amount, paid_at: createdAt, created_at: createdAt,
});
const project = (id: number, vertical: string, status = "new"): RawProject => ({
  id, vertical, status, created_at: createdAt,
});

test("les trois comptes de test et leurs événements historiques sont exclus précisément", () => {
  for (const proId of [4393, 99999, 1432477]) {
    assert.equal(isAnalyticsTestActivity({ pro_id: proId }), true);
    assert.equal(isAnalyticsTestActivity({ metadata: { pro_id: String(proId) } }), true);
    assert.equal(isAnalyticsTestActivity({ metadata: { proId } }), true);
  }
  const users = new Set(["test-account-user"]);
  assert.equal(isAnalyticsTestActivity({ user_id: "test-account-user" }, users), true);
  assert.equal(isAnalyticsTestActivity({ user_id: "real-account-user" }, users), false);
  assert.equal(isAnalyticsTestActivity({ pro_id: null }), false);
  assert.equal(isAnalyticsTestActivity({ metadata: { name: "test", text: "4393" } }), false);
  assert.equal(isAnalyticsTestActivity({ pro_id: 12, user_id: "test-account-user", metadata: { pro_id: 4393 } }, users), false);
});

test("revenus, contacts et activité comparent les deux périodes sans comptes tests", () => {
  const users = new Set(["test-account-user"]);
  const currentEvents = [
    event("dashboard_visit", { pro_id: 12 }),
    event("dashboard_visit", { pro_id: 12 }),
    event("dashboard_visit", { pro_id: 4393 }),
    event("claim_completed", { user_id: "test-account-user" }),
    event("claim_completed", { pro_id: 12 }),
    ...Array.from({ length: 8 }, () => event("project_form_submitted")),
  ].filter((row) => !isAnalyticsTestActivity(row, users));
  const currentUnlocks = [unlock(12, 990), unlock(13, 0), unlock(4393, 990), unlock(99999, 0)]
    .filter((row) => !isAnalyticsTestActivity(row));
  const previousUnlocks = [unlock(12, 990), unlock(13, 990), unlock(1432477, 990)]
    .filter((row) => !isAnalyticsTestActivity(row));
  const projects = [project(1, "btp"), project(2, "tech"), project(3, "btp", "deleted"), project(4, "tech", "suspicious")]
    .filter(isValidAnalyticsProject);

  const kpis = computeKpis(currentEvents, [], currentUnlocks, previousUnlocks, projects, [project(5, "tech")]);
  assert.deepEqual(kpis.revenueCents, { current: 990, previous: 1980, pct: -50 });
  assert.equal(kpis.unlocksPaid.current, 1);
  assert.equal(kpis.unlocksFree.current, 1);
  assert.equal(kpis.activePros.current, 1);
  assert.equal(kpis.claimsCompleted.current, 1);
  // Le vrai total BTP + freelance vient des projets, pas des 8 événements serveur.
  assert.deepEqual(kpis.projectsValid, { current: 2, previous: 1, pct: 100 });
});

test("les envois serveur restent séparés des observations après consentement", () => {
  const activity = computeFormActivity([
    event("project_form_viewed"),
    event("project_form_started"),
    event("project_step_reached", { metadata: { step: 2, name: "Métier" } }),
    event("project_step_reached", { metadata: { step: 2, name: "Quand" } }),
    event("project_step_reached", { metadata: { step: 2, name: "Quand" } }),
    ...Array.from({ length: 5 }, () => event("project_form_submitted")),
  ]);
  assert.equal(activity.find((row) => row.label === "Formulaire vu")?.count, 1);
  assert.equal(activity.find((row) => row.label === "Écran 2 · Quand")?.count, 2);
  assert.equal(activity.find((row) => row.label === "Écran 2 · Métier")?.count, 1);
  assert.equal(activity.some((row) => /soumis|envoi/i.test(row.label)), false);
});

test("plusieurs achats du même projet restent des volumes distincts", () => {
  const activity = computeBusinessActivity([project(1, "btp")], [unlock(12, 990), unlock(13, 990), unlock(14, 0)]);
  assert.deepEqual(activity.map((row) => row.count), [1, 2, 1]);
});

function statsContext(): Contexte {
  return {
    fA: { debut: "2026-09-11", fin: "2026-09-11", nbJours: 1 },
    fP: { debut: "2026-09-10", fin: "2026-09-10", nbJours: 1 },
    statsJour: null,
    events: agregerEvents([
      event("project_form_viewed"),
      event("project_form_started"),
      ...Array.from({ length: 3 }, () => event("project_step_reached", { metadata: { step: 2, name: "Quand" } })),
      ...Array.from({ length: 5 }, () => event("project_form_submitted")),
    ].map((row, i) => ({ ...row, id: i + 1 }))),
    projets: agregerProjets([
      { id: 1, created_at: createdAt, broadcast_count: 4 },
      { id: 2, created_at: createdAt, broadcast_count: 0 },
    ]),
    unlocks: agregerUnlocks(Array.from({ length: 5 }, (_, i) => ({
      id: i + 1, pro_id: i + 12, amount_cents: i < 2 ? 990 : 0, created_at: createdAt,
    }))),
  };
}

test("Statistiques ne fabrique aucun taux entre visiteurs, écrans, envois et achats", () => {
  const rows = construireEntonnoir(statsContext());
  const allRows = rows.flatMap((row) => [row, ...(row.sous ?? [])]);
  for (const row of allRows.filter((row) => row.cle !== "diffuses")) {
    assert.equal(row.conversionPct, null, row.cle);
    assert.equal(row.conversionPrecPct, null, row.cle);
  }
  assert.equal(rows.find((row) => row.cle === "envoye")?.actuel, 5);
  assert.equal(rows.find((row) => row.cle === "debloques")?.actuel, 5);
  // 1 projet diffusé parmi 2 projets valides de la même période : part démontrable.
  assert.equal(rows.find((row) => row.cle === "diffuses")?.conversionPct, 50);
  assert.equal(rows.find((row) => row.cle === "diffuses")?.conversionPrecPct, null);
});

test("une source indisponible et un dénominateur vide ne deviennent pas une conversion à zéro", () => {
  const ctx = statsContext();
  ctx.events = null;
  ctx.projets = new Map();
  const rows = construireEntonnoir(ctx);
  assert.equal(rows.find((row) => row.cle === "vu")?.actuel, null);
  assert.equal(rows.find((row) => row.cle === "diffuses")?.conversionPct, null);
});

test("chargement complet et rendu utilisent des volumes réels filtrés, sans accepter une page manquante", async (t) => {
  // Aucun réseau : tout fetch est intercepté, avec un hôte réservé invalide.
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://analytics.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-test-key";
  const now = new Date(Date.now() - 60_000).toISOString();
  const projects = [project(1, "btp"), project(2, "tech"), project(3, "btp", "deleted")]
    .map((row) => ({ ...row, created_at: now }));
  const events = [
    event("project_form_started"),
    event("claim_completed", { user_id: "test-account-user" }),
    event("dashboard_visit", { pro_id: 4393 }),
    event("dashboard_visit", { pro_id: 12 }),
    ...Array.from({ length: 8 }, () => event("project_form_submitted", { project_id: 1 })),
  ].map((row) => ({ ...row, created_at: now }));
  const unlocks = [unlock(12, 990), { ...unlock(13, 0), project_id: 2 }, unlock(1432477, 990)]
    .map((row) => ({ ...row, created_at: now, paid_at: now }));
  let failSecondEventPage = false;
  const requests: URL[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(url.hostname, "analytics.invalid", "aucune requête externe autorisée dans le test");
    requests.push(url);
    const table = url.pathname.split("/").at(-1);
    const select = url.searchParams.get("select") ?? "";
    const offset = Number(url.searchParams.get("offset") ?? "0");
    if (table === "events" && offset > 0 && failSecondEventPage) {
      return Response.json({ message: "synthetic pagination failure" }, { status: 400 });
    }
    if (offset > 0) return Response.json([]);
    if (table === "events") return Response.json(events);
    if (table === "lead_unlocks") return Response.json(unlocks);
    if (table === "projects") return Response.json(projects);
    if (table === "pros" && select === "claimed_by_user_id") {
      return Response.json([{ claimed_by_user_id: "test-account-user" }]);
    }
    if (table === "pros") {
      return Response.json([{ id: 12, categories: { vertical: "btp" } }, { id: 13, categories: { vertical: "tech" } }]);
    }
    throw new Error("unexpected synthetic request");
  });
  try {
    const analytics = await getAdminAnalytics(7);
    assert.equal(analytics.all.kpis.projectsValid.current, 2);
    assert.equal(analytics.btp.kpis.projectsValid.current, 1);
    assert.equal(analytics.ai.kpis.projectsValid.current, 1);
    assert.equal(analytics.all.kpis.revenueCents.current, 990);
    assert.equal(analytics.all.kpis.unlocksFree.current, 1);
    assert.equal(analytics.all.kpis.claimsCompleted.current, 0);
    assert.equal(analytics.all.kpis.activePros.current, 1);
    assert.equal(analytics.all.totalEvents, 10);
    const eventQuery = requests.find((url) => url.pathname.endsWith("/events"));
    assert.equal(eventQuery?.searchParams.get("order"), "created_at.asc,id.asc");
    assert.ok(eventQuery?.searchParams.getAll("created_at").some((value) => value.startsWith("lte.")));

    const markup = renderToStaticMarkup(createElement(AnalyticsClient, { initialAnalytics: analytics, initialPeriod: "7d" }));
    assert.match(markup, /Formulaires BTP observés/);
    assert.match(markup, /Activité commerciale/);
    assert.doesNotMatch(markup, /Entonnoir de conversion|Taux de validation|Complétion formulaire|ouvert → débloqué/);

    failSecondEventPage = true;
    await assert.rejects(getAdminAnalytics(7), /Impossible de charger les statistiques \(events\)/);
  } finally {
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});
