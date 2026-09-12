import assert from "node:assert/strict";
import test from "node:test";
import { buildVerificationCodeEmail } from "../lib/email/send-verification-code";

test("le code de suppression annonce une suppression et garde la réclamation par défaut", () => {
  const deletion = buildVerificationCodeEmail("123456", "Entreprise de démonstration", "deletion");
  assert.match(deletion.subject, /suppression/);
  assert.match(deletion.html, /demandé à supprimer la fiche/);
  assert.doesNotMatch(deletion.html, /réclamer la fiche/);
  const claim = buildVerificationCodeEmail("123456", "Entreprise de démonstration");
  assert.equal(claim.subject, "Votre code de vérification · Workwave");
  assert.match(claim.html, /demandé à réclamer la fiche/);
});

test("le nom de la fiche reste du texte dans l'email de vérification", () => {
  const message = buildVerificationCodeEmail("123456", '<img src="x"> A & B', "deletion");
  assert.doesNotMatch(message.html, /<img src="x">/);
  assert.match(message.html, /&lt;img src=&quot;x&quot;&gt; A &amp; B/);
});
