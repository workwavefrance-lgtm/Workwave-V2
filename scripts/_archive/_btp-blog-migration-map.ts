// Phase 4 — propose le mapping article blog "prix" (localisé Vienne) -> guide
// des prix NATIONAL équivalent, pour 301 uniquement les vrais doublons.
// Read-only (analyse).
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PRICE_RX = /prix|tarif|co[uû]t|combien|€|au m2|au m²/i;
// tokens prestation forts (le sujet réel de l'article)
const TOPIC_TOKENS = [
  "carrelage", "peinture", "terrasse-bois", "terrasse", "cuisine", "ramonage", "vitrier",
  "debouchage", "canalisation", "placoplatre", "placo", "piscine", "electricien", "porte",
  "alarme", "videosurveillance", "isolation", "combles", "ite", "pompe-a-chaleur", "granules",
  "poele", "chaudiere", "renovation-energetique", "dpe", "fenetre", "fosse", "elagueur", "elagage",
  "nettoyage", "bureaux",
];

function tokensOf(slug: string): string[] {
  const s = slug.toLowerCase();
  return TOPIC_TOKENS.filter((t) => s.includes(t));
}

async function main() {
  // 24 articles blog "prix"
  const all: { slug: string; title: string; status: string }[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("blog_posts").select("slug, title, status").order("slug").range(off, off + 999);
    const rows = data || []; if (!rows.length) break;
    all.push(...(rows as typeof all)); off += rows.length; if (rows.length < 1000) break;
  }
  const priceBlogs = all.filter((b) => PRICE_RX.test(b.title) || PRICE_RX.test(b.slug));

  // guides publiés
  const guides: { slug: string; h1: string; scope: string; metier_slug: string }[] = [];
  off = 0;
  while (true) {
    const { data } = await sb.from("price_guides").select("slug, h1, scope, metier_slug").eq("status", "published").order("id").range(off, off + 999);
    const rows = data || []; if (!rows.length) break;
    guides.push(...(rows as typeof guides)); off += rows.length;
  }

  console.log(`${priceBlogs.length} articles blog "prix" · ${guides.length} guides publiés\n`);
  console.log("MAPPING PROPOSÉ (blog -> guide) :\n");
  const redirects: { from: string; to: string }[] = [];
  for (const b of priceBlogs) {
    const bt = tokensOf(b.slug);
    if (bt.length === 0) { console.log(`  ⊘ GARDER  /blog/${b.slug}\n      (pas de token prestation → how-to ou trop large)`); continue; }
    // chercher le guide qui partage le + de tokens spécifiques
    let best: { slug: string; scope: string; score: number } | null = null;
    for (const g of guides) {
      const score = bt.filter((t) => g.slug.toLowerCase().includes(t) || (g.metier_slug || "").includes(t)).length;
      if (score > 0 && (!best || score > best.score)) best = { slug: g.slug, scope: g.scope, score };
    }
    if (best && best.score >= 1) {
      const to = best.scope === "metier" ? `/${best.slug}/prix` : `/guide-des-prix/${best.slug}`;
      redirects.push({ from: `/blog/${b.slug}`, to });
      console.log(`  ➜ 301    /blog/${b.slug}\n      -> ${to}  (tokens: ${bt.join(",")})`);
    } else {
      console.log(`  ⊘ GARDER /blog/${b.slug}\n      (aucun guide équivalent : ${bt.join(",")})`);
    }
  }
  console.log(`\n${redirects.length} redirections 301 proposées, ${priceBlogs.length - redirects.length} articles gardés.`);
  console.log("\n--- next.config redirects (à copier) ---");
  console.log(JSON.stringify(redirects.map((r) => ({ source: r.from, destination: r.to, permanent: true })), null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
