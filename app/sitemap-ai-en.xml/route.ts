import { INTL_SKILLS } from "@/lib/data/intl-skills";
import { INTL_CITIES } from "@/lib/data/intl-cities";
import { visaGuideSlugs } from "@/lib/data/freelance-visa";
import { US_STATES } from "@/lib/data/us-states";
import { usaGuideSlugs } from "@/lib/data/freelance-usa";

/**
 * Sitemap DÉDIÉ et STABLE du contenu EN international (Workwave AI), servi sur
 * le gTLD workwaveai.co (cf. next.config.ts + lib/i18n/alternates.ts).
 *
 * POURQUOI une route séparée plutôt qu'un sub-sitemap numéroté /sitemap/N.xml :
 *  1. L'index sitemap-index.xml (généré par app/sitemap.ts) liste des URLs en
 *     workwave.fr. Y inclure l'EN polluait la propriété GSC .fr avec des URLs
 *     .co (warning cross-domaine). L'EN est désormais HORS de cet index.
 *  2. URL STABLE à soumettre dans la GSC de workwaveai.co :
 *        https://www.workwaveai.co/sitemap-ai-en.xml
 *     (un sub-sitemap numéroté /sitemap/5.xml casse si on réordonne les ids).
 *
 * 100% DB-free (data files statiques) => génération en quelques ms, jamais de
 * timeout Googlebot. Cache 24h côté Vercel Edge.
 */

const AI_EN_BASE = "https://www.workwaveai.co";

export const revalidate = 86400; // cache 24h (cf. sitemap.ts)

type Entry = { loc: string; changefreq: string; priority: number };

function buildEntries(): Entry[] {
  const entries: Entry[] = [
    { loc: `${AI_EN_BASE}/en/ai`, changefreq: "daily", priority: 0.9 },
  ];
  // Hubs /en/ai/[skill] + pages programmatiques /en/ai/[skill]/[city].
  for (const skill of INTL_SKILLS) {
    entries.push({
      loc: `${AI_EN_BASE}/en/ai/${skill.slug}`,
      changefreq: "weekly",
      priority: 0.8,
    });
    for (const city of INTL_CITIES) {
      entries.push({
        loc: `${AI_EN_BASE}/en/ai/${skill.slug}/${city.slug}`,
        changefreq: "weekly",
        priority: 0.7,
      });
    }
    // Hubs d'état US : /en/ai/[skill]/state/[state]
    for (const st of US_STATES) {
      entries.push({
        loc: `${AI_EN_BASE}/en/ai/${skill.slug}/state/${st.slug}`,
        changefreq: "weekly",
        priority: 0.65,
      });
    }
  }
  // Guides visa/permis freelance (hub + par pays).
  entries.push({
    loc: `${AI_EN_BASE}/en/ai/freelance-visa`,
    changefreq: "monthly",
    priority: 0.7,
  });
  for (const slug of visaGuideSlugs()) {
    entries.push({
      loc: `${AI_EN_BASE}/en/ai/freelance-visa/${slug}`,
      changefreq: "monthly",
      priority: 0.65,
    });
  }
  // Guides freelance US (hub + par topic : LLC, taxes/1099, work authorization).
  entries.push({
    loc: `${AI_EN_BASE}/en/ai/freelance-usa`,
    changefreq: "monthly",
    priority: 0.7,
  });
  for (const slug of usaGuideSlugs()) {
    entries.push({
      loc: `${AI_EN_BASE}/en/ai/freelance-usa/${slug}`,
      changefreq: "monthly",
      priority: 0.65,
    });
  }
  return entries;
}

export async function GET() {
  const lastmod = new Date().toISOString();
  const entries = buildEntries();
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url><loc>${e.loc}</loc><lastmod>${lastmod}</lastmod>` +
          `<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
