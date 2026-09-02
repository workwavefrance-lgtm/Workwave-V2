import { getFluxFraicheur } from "@/lib/queries/fraicheur";

/**
 * Sitemap « fraîcheur » : uniquement les pages qui ont réellement changé,
 * avec leur VRAIE date de modification. Complète l'index principal, il ne le
 * remplace pas. Déclaré dans app/sitemap-index.xml/route.ts.
 *
 * Toutes les autres routes sitemap du site annoncent lastmod = maintenant,
 * ce que Google ignore. Celle-ci est la seule dont les dates sont fiables :
 * c'est la file prioritaire qu'on lui tend (cf. lib/queries/fraicheur.ts).
 *
 * Six heures de cache : le flux vit au rythme des réclamations et des
 * enrichissements, pas à la seconde.
 */
export const revalidate = 21600;

function echapper(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const pages = await getFluxFraicheur();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) =>
      `  <url><loc>${echapper(p.url)}</loc><lastmod>${p.modifieLe}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=21600, s-maxage=21600",
    },
  });
}
