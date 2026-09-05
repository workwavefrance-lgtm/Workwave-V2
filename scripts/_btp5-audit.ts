/**
 * BTP-5 · Audit anti-doublon / cannibalisation des guides de prix.
 * Throwaway (préfixe _). Lecture seule.
 * Usage : npx tsx scripts/_btp5-audit.ts
 */
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type Guide = {
  slug: string; scope: string; metier_slug: string | null; univers: string | null;
  h1: string; title: string; volume_est: number | null; kd: number | null;
  intro_md: string | null; price_ranges: unknown; status: string;
};

async function loadAll<T>(table: string, cols: string, filter?: (q: any) => any): Promise<T[]> {
  const PAGE = 1000; let off = 0; const all: T[] = [];
  while (true) {
    let q: any = sb.from(table).select(cols).range(off, off + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data || []) as T[];
    if (rows.length === 0) break;
    all.push(...rows); off += rows.length;
  }
  return all;
}

const STOP = new Set([
  "prix", "tarif", "tarifs", "cout", "couts", "de", "d", "du", "des", "la", "le", "les",
  "un", "une", "au", "aux", "en", "par", "et", "pour", "m2", "2026", "2025", "2024", "l",
  "moyen", "moyenne", "combien", "coute", "ca", "votre", "son", "sa", "ses", "guide",
]);
const norm = (s: string): string =>
  s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // accents
    .replace(/m²/g, "m2").replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w))
    .sort().join(" ");

async function main() {
  const guides = await loadAll<Guide>(
    "price_guides",
    "slug, scope, metier_slug, univers, h1, title, volume_est, kd, intro_md, price_ranges, status",
    (q) => q.eq("status", "published")
  );
  console.log(`\n=== ${guides.length} guides PUBLISHED ===`);
  const byScope = new Map<string, number>();
  for (const g of guides) byScope.set(g.scope, (byScope.get(g.scope) || 0) + 1);
  for (const [s, n] of byScope) console.log(`  scope=${s}: ${n}`);

  // 1. Slugs dupliqués (exact)
  const slugSeen = new Map<string, number>();
  for (const g of guides) slugSeen.set(g.slug, (slugSeen.get(g.slug) || 0) + 1);
  const dupSlugs = [...slugSeen.entries()].filter(([, n]) => n > 1);
  console.log(`\n=== Slugs dupliqués (exact) : ${dupSlugs.length} ===`);
  dupSlugs.forEach(([s, n]) => console.log(`  ⚠️ ${s} ×${n}`));

  // 2. Cannibalisation : même "cœur" normalisé du H1 sur des slugs différents
  const byCore = new Map<string, Guide[]>();
  for (const g of guides) {
    const core = norm(g.h1 || g.title || g.slug);
    if (!core) continue;
    (byCore.get(core) || byCore.set(core, []).get(core)!).push(g);
  }
  const cannib = [...byCore.entries()].filter(([, gs]) => gs.length > 1);
  console.log(`\n=== Cannibalisation potentielle (même cœur H1, slugs ≠) : ${cannib.length} clusters ===`);
  cannib.slice(0, 40).forEach(([core, gs]) => {
    console.log(`  ⚠️ [${core}]`);
    gs.forEach((g) => console.log(`       ${g.scope.padEnd(10)} ${g.slug}  «${g.h1}»`));
  });
  if (cannib.length > 40) console.log(`  … +${cannib.length - 40} autres clusters`);

  // 3. Collision slug guide ↔ slug catégorie (risque routing /[metier])
  const cats = await loadAll<{ slug: string }>("categories", "slug");
  const catSlugs = new Set(cats.map((c) => c.slug));
  const collideCat = guides.filter((g) => g.scope === "prestation" && catSlugs.has(g.slug));
  console.log(`\n=== Collision slug guide-prestation ↔ catégorie (/[metier]) : ${collideCat.length} ===`);
  collideCat.forEach((g) => console.log(`  ⚠️ /guide-des-prix/${g.slug} entre en collision avec la catégorie /${g.slug}`));

  // 4. Thin content : intro vide OU price_ranges vide
  const thin = guides.filter((g) => {
    const introLen = (g.intro_md || "").trim().length;
    const pr = Array.isArray(g.price_ranges) ? g.price_ranges.length : 0;
    return introLen < 150 || pr === 0;
  });
  console.log(`\n=== Guides "thin" (intro <150 car. OU 0 fourchette de prix) : ${thin.length} ===`);
  thin.slice(0, 30).forEach((g) => {
    const introLen = (g.intro_md || "").trim().length;
    const pr = Array.isArray(g.price_ranges) ? g.price_ranges.length : 0;
    console.log(`  ⚠️ ${g.slug}  intro=${introLen}c · ${pr} prix`);
  });
  if (thin.length > 30) console.log(`  … +${thin.length - 30} autres`);

  console.log(`\n=== SYNTHÈSE ===`);
  console.log(`  guides published     : ${guides.length}`);
  console.log(`  slugs dupliqués      : ${dupSlugs.length}`);
  console.log(`  clusters cannib.     : ${cannib.length}`);
  console.log(`  collisions catégorie : ${collideCat.length}`);
  console.log(`  guides thin          : ${thin.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
