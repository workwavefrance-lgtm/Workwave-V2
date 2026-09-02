import { getFluxFraicheur } from "@/lib/queries/fraicheur";

/**
 * Flux Atom des pages mises à jour. Même source que /sitemap-fraicheur.xml.
 *
 * Pourquoi un flux en plus d'un sitemap : Google accepte les flux Atom comme
 * sitemaps et les relit bien plus souvent qu'un sitemap classique, parce
 * qu'ils sont conçus pour signaler du neuf. À soumettre dans Search Console
 * en plus de l'index (c'est la seule exception à la règle « uniquement
 * l'index » du 29/04 : un flux est un format distinct, pas un sous-sitemap).
 * Déclaré aussi dans robots.txt.
 */
export const revalidate = 21600;

const BASE = "https://workwave.fr";

function echapper(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const pages = await getFluxFraicheur();
  const majFlux = pages[0]?.modifieLe ?? new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Workwave.fr : pages mises à jour</title>
  <link href="${BASE}/flux-mises-a-jour.xml" rel="self"/>
  <link href="${BASE}/"/>
  <id>${BASE}/flux-mises-a-jour.xml</id>
  <updated>${majFlux}</updated>
${pages
  .map(
    (p) => `  <entry>
    <title>${echapper(p.titre)}</title>
    <link href="${echapper(p.url)}"/>
    <id>${echapper(p.url)}</id>
    <updated>${p.modifieLe}</updated>
  </entry>`,
  )
  .join("\n")}
</feed>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=21600, s-maxage=21600",
    },
  });
}
