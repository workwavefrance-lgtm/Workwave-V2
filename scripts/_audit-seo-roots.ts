/**
 * Audit SEO FACTUEL des pages racine métier EN PROD (live HTML).
 * Extrait les vrais signaux : title, meta, canonical, H1/H2, JSON-LD, OG,
 * robots, word count, présence de la requête "autour de moi".
 * Usage : npx tsx scripts/_audit-seo-roots.ts
 */
const BASE = "https://workwave.fr";
const SLUGS = ["plombier", "chauffagiste", "serrurier", "menage", "garde-animaux", "coach-sportif"];

function m1(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}
function all(html: string, re: RegExp): string[] {
  return [...html.matchAll(re)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
}
function decode(s: string | null): string {
  if (!s) return "";
  return s
    .replace(/&amp;/g, "&").replace(/&#x2019;|&#39;/g, "'").replace(/&#x202F;|&#8239;/g, " ")
    .replace(/&#xE9;/gi, "é").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

async function auditUrl(slug: string) {
  const url = `${BASE}/${slug}`;
  const res = await fetch(url, { headers: { "User-Agent": "Googlebot/2.1" } });
  const html = await res.text();

  const title = decode(m1(html, /<title>([^<]+)<\/title>/));
  const metaDesc = decode(m1(html, /<meta name="description" content="([^"]*)"/));
  const canonical = m1(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = m1(html, /<meta name="robots" content="([^"]*)"/) || "(absent = index par défaut)";
  const h1s = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/g).map(decode);
  const h2s = all(html, /<h2[^>]*>([\s\S]*?)<\/h2>/g).map(decode);
  const ogTitle = decode(m1(html, /<meta property="og:title" content="([^"]*)"/));
  const jsonLdTypes = [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const uniqTypes = [...new Set(jsonLdTypes)];

  const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter((w) => w.length > 1).length;
  const adm = (decode(html.toLowerCase()).match(/autour de moi/g) || []).length;
  const adv = (decode(html.toLowerCase()).match(/autour de vous/g) || []).length;

  console.log(`\n════════ /${slug}  (HTTP ${res.status}) ════════`);
  console.log(`TITLE     (${title.length}c) : ${title}`);
  console.log(`META DESC (${metaDesc.length}c) : ${metaDesc}`);
  console.log(`CANONICAL : ${canonical}`);
  console.log(`ROBOTS    : ${robots}`);
  console.log(`H1 (${h1s.length}) : ${h1s.join(" | ")}`);
  console.log(`H2 (${h2s.length}) :`);
  h2s.forEach((h) => console.log(`   • ${h}`));
  console.log(`JSON-LD   : ${uniqTypes.join(", ")}`);
  console.log(`OG:title  : ${ogTitle}`);
  console.log(`WORDS     : ~${words}`);
  console.log(`"autour de moi" ×${adm} · "autour de vous" ×${adv}`);
}

async function checkSitemap() {
  const xml = await (await fetch(`${BASE}/sitemap/0.xml`, { headers: { "User-Agent": "Googlebot/2.1" } })).text();
  const present = SLUGS.filter((s) => xml.includes(`<loc>${BASE}/${s}</loc>`));
  console.log(`\n════════ SITEMAP /sitemap/0.xml ════════`);
  console.log(`Racines métier présentes (sur échantillon ${SLUGS.length}) : ${present.length}/${SLUGS.length} → ${present.join(", ")}`);
}

(async () => {
  for (const s of SLUGS) await auditUrl(s);
  await checkSitemap();
})();
