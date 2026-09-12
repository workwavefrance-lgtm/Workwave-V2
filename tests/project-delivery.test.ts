import assert from "node:assert/strict";
import test from "node:test";
import {
  deliverProjectEmail, deliveryKind,
  type Delivery, type DeliveryStore, type ProjectEmail, type ProjectEmailSender,
} from "../lib/email/project-delivery";

const email: ProjectEmail = {
  project_id: 10, pro_id: 20, kind: "initial",
  recipient_email: "pro@example.test", subject: "Nouveau chantier", html: "<p>Projet à proximité</p>",
};
const now = () => new Date("2026-09-12T09:00:00Z");
const keyOf = (d: ProjectEmail) => `${d.project_id}/${d.pro_id}/${d.kind}`;

// Journal en mémoire avec les mêmes garanties que la PK + insertion ignorée
// sur conflit. Il subsiste entre appels, à l'inverse d'un mock « toujours OK ».
class Journal implements DeliveryStore {
  rows = new Map<string, Delivery>();
  errors: string[] = [];
  failNextCommit = false;
  async prepare(input: ProjectEmail, timestamp: string) {
    const key = keyOf(input);
    if (!this.rows.has(key)) this.rows.set(key, { ...input, first_attempt_at: timestamp, sent_at: null, provider_id: null });
    return { ...this.rows.get(key)! };
  }
  async markSent(input: Delivery, providerId: string, timestamp: string) {
    if (this.failNextCommit) { this.failNextCommit = false; throw new Error("base indisponible après acceptation"); }
    this.rows.set(keyOf(input), { ...input, provider_id: providerId, sent_at: timestamp, html: "", subject: "", recipient_email: "" });
  }
  async markError(_delivery: Delivery, reason: string) { this.errors.push(reason); }
}

function provider() {
  const accepted = new Map<string, { payload: string; id: string }>();
  const calls: string[] = [];
  const send: ProjectEmailSender = async (input, key) => {
    calls.push(key);
    const payload = JSON.stringify([input.recipient_email, input.subject, input.html]);
    if (accepted.has(key)) {
      assert.equal(payload, accepted.get(key)!.payload, "une clé ne doit pas changer de payload");
      return { id: accepted.get(key)!.id };
    }
    const result = { payload, id: `email-${accepted.size + 1}` };
    accepted.set(key, result);
    return { id: result.id };
  };
  return { accepted, calls, send };
}

test("relanceKind j1/j3 et ancien isRelance activent tous le chemin de relance", () => {
  assert.equal(deliveryKind({}), "initial");
  assert.equal(deliveryKind({ relanceKind: "j1" }), "j1");
  assert.equal(deliveryKind({ relanceKind: "j3" }), "j3");
  assert.equal(deliveryKind({ isRelance: true }), "j3");
  assert.equal(deliveryKind({ isRelance: true, relanceKind: "j1" }), "j1");
});

test("échec partiel : la reprise n'envoie pas une deuxième fois au destinataire servi", async () => {
  const journal = new Journal(); const remote = provider();
  const second = { ...email, pro_id: 21 };
  assert.equal((await deliverProjectEmail(journal, remote.send, email, now)).ok, true);
  assert.equal((await deliverProjectEmail(journal, async () => { throw new Error("quota"); }, second, now)).ok, false);
  assert.equal(journal.rows.get(keyOf(second))!.sent_at, null);
  const results = await Promise.all([email, second].map((d) => deliverProjectEmail(journal, remote.send, d, now)));
  assert.ok(results.every((r) => r.ok));
  assert.equal(remote.accepted.size, 2);
  assert.equal(remote.calls.length, 2);
});

test("succès provider puis panne DB : même clé et payload figé malgré évolution du mail", async () => {
  const journal = new Journal(); const remote = provider(); journal.failNextCommit = true;
  assert.equal((await deliverProjectEmail(journal, remote.send, email, now)).ok, false);
  const retry = await deliverProjectEmail(journal, remote.send, { ...email, html: "Offre changée depuis" }, now);
  assert.equal(retry.ok, true);
  assert.equal(remote.accepted.size, 1);
  assert.equal(remote.calls.length, 2);
  assert.equal(journal.rows.get(keyOf(email))!.html, "");
});

test("appels concurrents gardent une clé commune et un seul envoi provider", async () => {
  const journal = new Journal(); const remote = provider();
  const results = await Promise.all(Array.from({ length: 8 }, () => deliverProjectEmail(journal, remote.send, email, now)));
  assert.ok(results.every((r) => r.ok));
  assert.equal(remote.accepted.size, 1);
});

test("un succès confirmé reste dédupliqué après expiration des clés provider", async () => {
  const journal = new Journal(); const remote = provider();
  await deliverProjectEmail(journal, remote.send, email, now);
  const replay = await deliverProjectEmail(journal, remote.send, email, () => new Date("2026-10-12T09:00:00Z"));
  assert.equal(replay.ok, true);
  assert.equal(remote.calls.length, 1);
});

test("résultat incertain trop ancien ou adresse changée : aucun nouvel envoi automatique", async () => {
  for (const changed of [false, true]) {
    const journal = new Journal(); const remote = provider();
    await journal.prepare(email, now().toISOString());
    const result = await deliverProjectEmail(journal, remote.send,
      changed ? { ...email, recipient_email: "autre@example.test" } : email,
      changed ? now : () => new Date("2026-09-13T08:00:00Z"));
    assert.equal(result.ok, false);
    assert.equal(remote.calls.length, 0);
    assert.match(journal.errors[0], /delivery_needs_review/);
  }
});

test("initial, j1 et j3 sont trois notifications indépendantes", async () => {
  const journal = new Journal(); const remote = provider();
  for (const kind of ["initial", "j1", "j3"] as const) {
    assert.equal((await deliverProjectEmail(journal, remote.send, { ...email, kind }, now)).ok, true);
  }
  assert.equal(remote.accepted.size, 3);
});

test("journal indisponible : le fournisseur n'est jamais appelé sans trace préalable", async () => {
  const journal = new Journal(); const remote = provider();
  journal.prepare = async () => { throw new Error("migration manquante"); };
  const result = await deliverProjectEmail(journal, remote.send, email, now);
  assert.equal(result.ok, false);
  assert.equal(remote.calls.length, 0);
});
