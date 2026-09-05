import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
process.env.NEXT_PHASE = "phase-production-build";
(async () => {
  const { getFluxFraicheur } = await import("../lib/queries/fraicheur");
  const pages = await getFluxFraicheur();
  console.log("ETAT DE BUILD (NEXT_PHASE=phase-production-build)");
  console.log("  entrees produites :", pages.length);
  console.log("  dont chantiers    :", pages.filter(p=>p.url.includes("/trouver-des-chantiers/")).length);
  console.log("  dont fiches       :", pages.filter(p=>p.url.includes("/artisan/")).length);
  const maj = pages[0]?.modifieLe ?? new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>Workwave.fr : pages mises a jour</title>\n  <link href="https://workwave.fr/flux-mises-a-jour.xml" rel="self"/>\n  <link href="https://workwave.fr/"/>\n  <id>https://workwave.fr/flux-mises-a-jour.xml</id>\n  <updated>${maj}</updated>\n` +
    pages.map(p=>`  <entry>\n    <title>${p.titre}</title>\n    <link href="${p.url}"/>\n    <id>${p.url}</id>\n    <updated>${p.modifieLe}</updated>\n  </entry>`).join("\n") + `\n</feed>`;
  console.log("  taille du flux    :", Buffer.byteLength(xml), "octets");
  console.log("  (Google a recu 709 octets le 04/09 a 10:01:47)");
})();
