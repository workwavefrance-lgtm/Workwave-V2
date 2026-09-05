import * as dotenv from "dotenv"; import path from "path"; import zlib from "zlib"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
process.env.NEXT_PHASE = "phase-production-build";
function echapper(s: string){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
(async () => {
  const { getFluxFraicheur } = await import("../lib/queries/fraicheur");
  const pages = await getFluxFraicheur();
  const BASE="https://workwave.fr";
  const maj = pages[0]?.modifieLe ?? new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Workwave.fr : pages mises à jour</title>
  <link href="${BASE}/flux-mises-a-jour.xml" rel="self"/>
  <link href="${BASE}/"/>
  <id>${BASE}/flux-mises-a-jour.xml</id>
  <updated>${maj}</updated>
${pages.map(p=>`  <entry>
    <title>${echapper(p.titre)}</title>
    <link href="${echapper(p.url)}"/>
    <id>${echapper(p.url)}</id>
    <updated>${p.modifieLe}</updated>
  </entry>`).join("\n")}
</feed>`;
  const buf = Buffer.from(xml);
  console.log("FLUX A L ETAT DE BUILD  :", pages.length, "entrees,", buf.length, "octets bruts");
  for (const lvl of [1,4,5,6,9]) console.log(`   gzip niveau ${lvl} : ${zlib.gzipSync(buf,{level:lvl}).length} octets`);
  console.log("\n   >>> Google a recu 709 octets (compresse) le 04/09 a 10:01:47");
  // reference : ratio mesure sur le flux chaud
  const chaud = fs.readFileSync("/tmp/a.xml");
  console.log(`\n   controle ratio : flux chaud ${chaud.length} brut -> gzip6 ${zlib.gzipSync(chaud,{level:6}).length} (journal : 34567)`);
})();
