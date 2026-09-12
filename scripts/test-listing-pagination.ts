/** Regression pagination : vraies requêtes Supabase, réponses simulées, zéro réseau. */
import assert from "node:assert/strict";
import { getListingPros, parseListingPage } from "../lib/queries/listing-pros";
import { getCategoryBySlug } from "../lib/queries/categories";
import { getCityBySlug, getCityIdsByDepartment } from "../lib/queries/cities";
import { getDepartmentBySlug } from "../lib/queries/departments";
import { countProsByCategoryAndCityIds } from "../lib/queries/pros";

type Fixture = Record<string, unknown> & {
  id: number;
  category_id: number;
  city_id: number;
};
let fixtures: Fixture[] = [];
let failOn: "" | "top" | "remainder" | "categories" | "cities" | "departments" | "count" = "";
let estimatedCount: number | null = null;
let rangeErrors = false;
const calls: { table: string; limit: number; excluded: number[] }[] = [];

function fixture(id: number): Fixture {
  return {
    id, slug: `artisan-${id}`, name: `Artisan ${String(id % 7).padStart(2, "0")}`,
    category_id: 1, city_id: id % 2 + 1, is_active: true, deleted_at: null,
    etat_admin: "A", claimed_by_user_id: id % 9 === 0 ? `owner-${id % 3}` : null,
    profile_completion: (id * 17) % 100, founded_year: 2000 + id % 20,
    photos: [], certifications: [], description: "", rge_certified: false,
    has_decennale: false, has_rc_pro: false,
    google_rating: id % 5 === 0 ? 4.8 : null, google_reviews_count: id % 5 === 0 ? 12 : 0,
    workwave_reviews_avg: null, workwave_reviews_count: 0,
  };
}

function idsFromFilter(value: string | null): number[] {
  return value ? (value.match(/\(([^)]*)\)/)?.[1] ?? "").split(",").filter(Boolean).map(Number) : [];
}

const mockFetch: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  assert.equal(url.hostname, "pagination-test.invalid", "Toute tentative réseau réelle doit échouer");
  const table = url.pathname.split("/").at(-1)!;
  const excluded = idsFromFilter(url.searchParams.get("id"));
  const limit = Number(url.searchParams.get("limit") ?? "1000");
  const isHead = init?.method === "HEAD";
  calls.push({ table, limit, excluded });
  if (failOn === table || (failOn === "top" && limit === 100) ||
      (failOn === "remainder" && excluded.length > 0) || (failOn === "count" && isHead)) {
    return new Response(JSON.stringify({ code: "57014", message: "simulated database timeout" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  if (table !== "pros") return Response.json([]);

  const cityIds = idsFromFilter(url.searchParams.get("city_id"));
  const categoryId = Number(url.searchParams.get("category_id")?.replace("eq.", ""));
  let rows = fixtures.filter((p) => p.category_id === categoryId && cityIds.includes(p.city_id) && !excluded.includes(p.id));
  const order = (url.searchParams.get("order") ?? "").split(",").filter(Boolean);
  rows = rows.sort((a, b) => {
    for (const instruction of order) {
      const [key, direction, nulls] = instruction.split(".");
      const left = a[key];
      const right = b[key];
      if (left === right) continue;
      if (left == null || right == null) return left == null ? (nulls === "nullslast" ? 1 : -1) : (nulls === "nullslast" ? -1 : 1);
      const compared = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
      if (compared) return direction === "desc" ? -compared : compared;
    }
    return 0;
  });
  const prefersEstimate = new Headers(init?.headers).get("prefer")?.includes("count=estimated");
  const count = prefersEstimate && estimatedCount !== null ? estimatedCount : rows.length;
  const offset = Number(url.searchParams.get("offset") ?? "0");
  if (rangeErrors && offset >= rows.length && offset > 0) {
    return new Response(JSON.stringify({ code: "PGRST103", message: "Requested range not satisfiable" }), {
      status: 416, headers: { "Content-Type": "application/json", "Content-Range": `*/${rows.length}` },
    });
  }
  const data = rows.slice(offset, offset + limit);
  return new Response(isHead ? null : JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Content-Range": `${offset}-${offset + data.length - 1}/${count}` },
  });
};

async function main() {
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://pagination-test.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-only-anon-key";
  globalThis.fetch = mockFetch;
  try {
    for (const size of [0, 10, 11, 20, 21, 30, 31, 100, 135]) {
      fixtures = Array.from({ length: size }, (_, i) => fixture(size - i));
      calls.length = 0;
      const first = await getListingPros(1, [2, 1], 1);
      assert.equal(first.pagination, null);
      assert.equal(first.tops.length, Math.min(10, size));
      assert.equal(first.total, size);
      const seen = first.tops.map((p) => p.id);
      const pages = 1 + Math.ceil(Math.max(0, size - 10) / 20);
      for (let page = 2; page <= pages; page++) {
        const result = await getListingPros(1, [1, 2], page);
        assert.deepEqual(result.tops.map((p) => p.id), first.tops.map((p) => p.id), "Sélection stable malgré deux tableaux de communes distincts");
        assert.equal(result.total, size);
        assert.equal(result.pagination?.page, page);
        assert.equal(result.pagination?.totalPages, pages);
        assert.equal(result.pagination?.data.length, Math.min(20, size - 10 - (page - 2) * 20));
        seen.push(...result.pagination!.data.map((p) => p.id));
      }
      assert.equal(new Set(seen).size, size, "Chaque professionnel doit apparaître une seule fois");
      assert.deepEqual([...seen].sort((a, b) => a - b), fixtures.map((p) => p.id).sort((a, b) => a - b), "Aucun professionnel sauté");
      const beyond = await getListingPros(1, [1, 2], pages + 1);
      assert.deepEqual(beyond.pagination?.data, [], "Dépassement de dernière page réellement vide");
      assert(calls.every((c) => c.limit <= 100), "Aucune lecture de masse");
      assert(calls.filter((c) => c.limit === 20).every((c) => c.excluded.length === Math.min(size, 10)), "Le filtre d'exclusion doit être envoyé à Supabase");
    }

    // Tous les critères sont égaux : seul l'id peut garantir la stabilité
    // de la sélection des cent candidats et des frontières de pagination.
    fixtures = Array.from({ length: 135 }, (_, i) => ({ ...fixture(1), id: 135 - i, name: "Même nom", city_id: 1 }));
    const tiedFirst = await getListingPros(1, [1], 1);
    assert.deepEqual(tiedFirst.tops.map((p) => p.id), Array.from({ length: 10 }, (_, i) => i + 1));
    fixtures.reverse();
    const tiedSecond = await getListingPros(1, [1], 2);
    assert.deepEqual(tiedSecond.pagination?.data.map((p) => p.id), Array.from({ length: 20 }, (_, i) => i + 11));
    rangeErrors = true;
    assert.deepEqual((await getListingPros(1, [1], 20)).pagination?.data, [], "416 PostgREST doit rester une page hors borne, pas une panne");
    rangeErrors = false;

    fixtures = Array.from({ length: 11 }, (_, i) => fixture(i + 1));
    estimatedCount = 999;
    assert.equal((await getListingPros(1, [1, 2], 1)).total, 11, "Petite liste comptée réellement, malgré une estimation excessive");
    estimatedCount = null;
    for (const [failure, read] of [
      ["top", () => getListingPros(1, [1, 2], 1)],
      ["remainder", () => getListingPros(1, [1, 2], 2)],
      ["categories", () => getCategoryBySlug("plombier")],
      ["cities", () => getCityBySlug("poitiers")],
      ["cities", () => getCityIdsByDepartment(86)],
      ["departments", () => getDepartmentBySlug("vienne-86")],
      ["count", () => countProsByCategoryAndCityIds(1, [1, 2])],
    ] as const) {
      failOn = failure;
      await assert.rejects(read, /simulated database timeout/, "Une panne ne doit pas devenir une liste vide/absence");
    }
    failOn = "";
    assert.equal(await getCategoryBySlug("inconnue"), null);
    assert.equal(await getCityBySlug("inconnue"), null);
    assert.equal(await getDepartmentBySlug("vienne-86"), null);
    for (const invalid of ["", "1", "0", "-2", "02", "2abc", "2.5", "501", "99999999999999999999"]) assert.equal(parseListingPage(invalid), null);
    for (const valid of ["2", "3", "500"]) assert.equal(parseListingPage(valid), Number(valid));
    console.log("Pagination OK : 9 tailles, parcours exhaustif sans doublons, ordre stable, erreurs de lecture et numéros invalides. Aucun réseau.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
