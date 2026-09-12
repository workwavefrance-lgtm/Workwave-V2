import assert from "node:assert/strict";
import test from "node:test";

test("le détail pro borne la requête et ne sérialise jamais les secrets du projet", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lead-detail-test.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only";
  const originalFetch = globalThis.fetch;
  let unlocked = false;
  let deleted = false;
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    assert.equal(url.hostname, "lead-detail-test.invalid", "aucun accès réseau réel");
    if (url.pathname.endsWith("/project_leads")) {
      assert.equal(url.searchParams.get("id"), "eq.9");
      assert.equal(url.searchParams.get("pro_id"), "eq.42");
      assert.equal(url.searchParams.get("select")?.includes("*"), false);
      return Response.json({
        id: 9, status: "sent", sent_at: "2026-09-12", contacted_at: null,
        project: { id: 1, status: deleted ? "deleted" : "new", first_name: "Client", email: "client@example.com", phone: "0612345678",
          description: "Travaux. client@example.com", urgency: "this_month", budget: "unknown",
          deletion_token: "NE_JAMAIS_TRANSMETTRE", ai_qualification: null, category: { name: "Plombier" }, city: null },
      });
    }
    assert.ok(url.pathname.endsWith("/lead_unlocks"));
    assert.equal(url.searchParams.get("pro_id"), "eq.42");
    assert.equal(url.searchParams.get("project_id"), "eq.1");
    return Response.json(unlocked ? { id: 7 } : null);
  };
  try {
    const { getLeadForPro } = await import("../lib/queries/leads");
    for (const paid of [false, true]) {
      unlocked = paid;
      const result = await getLeadForPro(9, 42);
      assert.equal(result?.unlocked, paid);
      const serialized = JSON.stringify(result);
      assert.equal(serialized.includes("NE_JAMAIS_TRANSMETTRE"), false);
      assert.equal(serialized.includes("deletion_token"), false);
      assert.equal(result?.lead.project.email, paid ? "client@example.com" : "");
    }
    deleted = true;
    assert.equal(await getLeadForPro(9, 42), null);
  } finally { globalThis.fetch = originalFetch; }
});
