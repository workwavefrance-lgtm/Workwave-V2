/**
 * Controle d'apres-deploiement. A lancer juste apres avoir clique Redeploy
 * dans Coolify, quand le nouveau conteneur repond.
 *
 *   npx tsx scripts/verif-apres-deploiement.ts
 *
 * Ne mesure QUE des choses observables de l'exterieur, en HTTP : c'est ce que
 * Google voit. Aucune requete lourde en base, pour ne pas la charger juste
 * apres un redemarrage.
 *
 * Il verifie, dans cet ordre :
 *   1. que le nouveau code est bien servi (les 3 tranches metier x ville
 *      n'existaient pas avant, cf. /sitemap/300.xml en 404 le 05/09) ;
 *   2. que l'index du sitemap nomme TOUTES les tranches servies, et aucune
 *      qui repondrait 404 (un enfant en 404 fait passer tout le sitemap en
 *      erreur dans Search Console, lecon du 20/08) ;
 *   3. que la derniere tranche de fiches n'est pas pleine, sinon des fiches
 *      debordent et sont invisibles de Google. ⚠️ Ce controle n'a de sens que
 *      sur un conteneur FRAICHEMENT deployé : les sous-sitemaps sont caches
 *      24 h, donc avant le deploiement ils servent l'etat d'avant le scrape.
 *      Le 05/09 a 14 h, /sitemap/147.xml annonçait 0 adresse alors que 605 368
 *      fiches venaient d'etre ecrites ;
 *   4. que le nouveau titre et la nouvelle description des fiches ouvertes
 *      sont bien la, et que les fiches fermees n'ont pas bouge ;
 *   5. qu'aucune page temoin ne repond en erreur.
 */
const BASE = "https://workwave.fr";

async function get(chemin: string, timeoutMs = 120000) {
  const t = Date.now();
  try {
    const r = await fetch(`${BASE}${chemin}`, { signal: AbortSignal.timeout(timeoutMs) });
    const corps = await r.text();
    return { code: r.status, ms: Date.now() - t, corps };
  } catch {
    return { code: 0, ms: Date.now() - t, corps: "" };
  }
}

const nbUrls = (xml: string) => (xml.match(/<url>/g) || []).length;
const titre = (html: string) => (html.match(/<title>(.*?)<\/title>/) || [, ""])[1];
const meta = (html: string) =>
  (html.match(/<meta name="description" content="(.*?)"/) || [, ""])[1];

let echecs = 0;
const dire = (ok: boolean, texte: string) => {
  if (!ok) echecs++;
  console.log(`  ${ok ? "ok  " : "ECHEC"} ${texte}`);
};

(async () => {
  console.log("1. Le nouveau code est-il servi ?");
  const t300 = await get("/sitemap/300.xml");
  dire(t300.code === 200, `/sitemap/300.xml repond ${t300.code} (404 = ancien conteneur encore en place)`);
  if (t300.code === 200) console.log(`       ${nbUrls(t300.corps)} adresses metier x ville dans la 1re tranche`);

  console.log("\n2. L'index nomme-t-il exactement les tranches servies ?");
  const idx = await get("/sitemap-index.xml");
  const ids = [...idx.corps.matchAll(/\/sitemap\/(\d+)\.xml/g)].map((m) => Number(m[1]));
  dire(idx.code === 200 && ids.length > 0, `/sitemap-index.xml repond ${idx.code}, ${ids.length} tranches nommees`);
  const proMax = Math.max(...ids.filter((i) => i >= 100 && i < 200));
  const apres = await get(`/sitemap/${proMax + 1}.xml`);
  dire(apres.code === 404, `la tranche suivant la derniere nommee (${proMax + 1}) repond ${apres.code}, on attend 404`);
  // Un enfant nomme qui repond 404 casse tout le sitemap dans Search Console.
  const aTester = [ids[0], proMax, Math.max(...ids.filter((i) => i >= 200 && i < 300)), Math.max(...ids.filter((i) => i >= 300))];
  for (const id of aTester.filter((x) => Number.isFinite(x))) {
    const r = await get(`/sitemap/${id}.xml`);
    dire(r.code === 200, `/sitemap/${id}.xml nomme par l'index repond ${r.code} (${r.ms} ms, ${nbUrls(r.corps)} adresses)`);
  }

  console.log("\n3. Des fiches debordent-elles du sitemap ?");
  const derniere = await get(`/sitemap/${proMax}.xml`);
  const n = nbUrls(derniere.corps);
  dire(n < 45000, `la derniere tranche de fiches (${proMax}) contient ${n} adresses sur 45 000${n >= 45000 ? " : PLEINE, des fiches sont invisibles, relever NB_SITEMAPS_PROS" : ""}`);

  console.log("\n4. Le titre et la description des fiches");
  const ouverte = await get("/artisan/alternatif-ac-dc-continue-00011");
  dire(ouverte.code === 200 && /depuis \d{4}/.test(titre(ouverte.corps)),
    `fiche ouverte : « ${titre(ouverte.corps).slice(0, 70)} »`);
  dire(/Entreprise créée le/.test(meta(ouverte.corps)),
    `sa description : « ${meta(ouverte.corps).slice(0, 90)} »`);
  const fermee = await get("/artisan/garnier-renovation-00013");
  dire(fermee.code === 200 && /établissement fermé/.test(titre(fermee.corps)),
    `fiche fermee inchangee : « ${titre(fermee.corps).slice(0, 70)} »`);
  const propre = await get("/artisan/go-renov-00026");
  dire(propre.code === 200 && !/Entreprise créée le/.test(meta(propre.corps)),
    `fiche a description propre : la sienne est conservee`);

  console.log("\n5. Pages temoins");
  for (const c of ["/", "/plombier/montpellier", "/plombier/herault-34", "/deposer-projet", "/guide-des-prix", "/pro", "/robots.txt", "/llms.txt"]) {
    const r = await get(c);
    dire(r.code === 200, `${c} repond ${r.code} (${r.ms} ms)`);
  }

  console.log(`\n${echecs === 0 ? "TOUT EST VERT." : `${echecs} CONTROLE(S) EN ECHEC.`}`);
  console.log(
    "\nSi l'index du sitemap semble figé sur d'anciennes valeurs, il survit aux\n" +
    "redeploiements (cf. le commentaire en tete de app/sitemap-index.xml) :\n" +
    "  curl -X POST -H \"Authorization: Bearer $CRON_SECRET\" \\\n" +
    "    'https://workwave.fr/api/revalidate-sitemap'"
  );
  process.exit(echecs === 0 ? 0 : 1);
})();
