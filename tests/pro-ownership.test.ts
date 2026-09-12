import test from "node:test";
import assert from "node:assert/strict";
import { deletionAttemptMatches } from "../lib/pro/ownership";

const attempt = { type: "deletion", target_pro_id: 1, siret: "12345678901234", email: "owner@example.com" };
const pro = { id: 1, siret: attempt.siret, claimed_by_user_id: "owner-id" };
const user = { id: "owner-id", email: "OWNER@example.com" };
test("suppression réservée au propriétaire connecté de la fiche vérifiée", () => {
  assert.equal(deletionAttemptMatches(attempt, pro, user), true);
  assert.equal(deletionAttemptMatches(attempt, pro, null), false);
  assert.equal(deletionAttemptMatches(attempt, { ...pro, id: 2 }, user), false);
  assert.equal(deletionAttemptMatches({ ...attempt, target_pro_id: null }, pro, user), false);
  assert.equal(deletionAttemptMatches(attempt, { ...pro, siret: "99999999999999" }, user), false);
  assert.equal(deletionAttemptMatches(attempt, { ...pro, claimed_by_user_id: "third-party" }, user), false);
  assert.equal(deletionAttemptMatches(attempt, { ...pro, claimed_by_user_id: null }, user), false);
  assert.equal(deletionAttemptMatches({ ...attempt, email: "other@example.com" }, pro, user), false);
  assert.equal(deletionAttemptMatches({ ...attempt, type: "claim" }, pro, user), false);
});
