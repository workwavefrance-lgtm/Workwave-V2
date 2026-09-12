import test from "node:test";
import assert from "node:assert/strict";
import { inlineScriptString } from "../lib/auth/safe-redirect";

test("le littéral inline préserve le texte sans pouvoir fermer une balise script", () => {
  const value = '</script><script>alert("test")</script>&\u2028\u2029';
  const literal = inlineScriptString(value);
  assert.doesNotMatch(literal, /[<>&\u2028\u2029]/);
  assert.equal(JSON.parse(literal), value);
  const html = `<script>window.location.href=${literal};</script>`;
  assert.equal(html.match(/<script>/g)?.length, 1);
  assert.equal(html.match(/<\/script>/g)?.length, 1);
});
