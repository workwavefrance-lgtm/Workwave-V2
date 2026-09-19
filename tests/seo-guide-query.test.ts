import assert from "node:assert/strict";
import test from "node:test";

test("un guide absent reste distinct d'une erreur de base", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://seo-guide-test.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-only";
  const originalFetch = globalThis.fetch;
  let response: "found" | "missing" | "failed" = "found";
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    assert.equal(url.hostname, "seo-guide-test.invalid");
    assert.ok(url.pathname.endsWith("/seo_guides"));
    assert.equal(url.searchParams.get("slug"), "eq.plombier");
    if (response === "failed") {
      return Response.json({ code: "57014", message: "statement timeout", details: null, hint: null }, { status: 400 });
    }
    return Response.json(response === "found" ? [{ id: 1, slug: "plombier", title: "Guide plomberie" }] : []);
  };
  try {
    const { getGuideBySlug } = await import("../lib/queries/seo-guides");
    assert.equal((await getGuideBySlug("plombier"))?.id, 1);
    response = "missing";
    assert.equal(await getGuideBySlug("plombier"), null);
    response = "failed";
    await assert.rejects(() => getGuideBySlug("plombier"), /Lecture du guide impossible/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
