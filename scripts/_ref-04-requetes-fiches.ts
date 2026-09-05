/** REFUTATION 4 : d'ou viennent les clics des fiches ? Requetes de marque
 *  (navigationnelles) ou requetes de service ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10);
  const debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: debut, endDate: fin, dimensions: ["query"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  const rows = data.rows || [];
  const clics = rows.reduce((s,r)=>s+(r.clicks||0),0), imps = rows.reduce((s,r)=>s+(r.impressions||0),0);
  console.log(`requetes distinctes menant a une fiche : ${rows.length} · ${imps} impressions · ${clics} clics`);
  // Requete "de service" = contient un mot metier generique.
  const METIERS = /plombier|electric|électric|macon|maçon|peintre|couvreur|menuisier|carreleur|plaquiste|charpent|serrurier|chauffagiste|climatis|terrass|paysagiste|elagu|élagu|architecte|menage|ménage|jardin|bricol|demenag|déménag|debarras|débarras|nettoyage|garde d|soutien scolaire|aide |cours particulier|animaux|vitrier|ramoneur|piscin|cuisinist|facadier|façadier|artisan|devis|travaux|renovation|rénovation|entreprise de/i;
  let cs=0, is=0;
  for (const r of rows) { if (METIERS.test(r.keys![0])) { cs+=r.clicks||0; is+=r.impressions||0; } }
  console.log(`\nrequetes contenant un mot de METIER ou d'intention (service) : ${is} impressions (${((is/imps)*100).toFixed(1)} %) · ${cs} clics (${((cs/clics)*100).toFixed(1)} %)`);
  console.log(`le reste = requetes de NOM D'ENTREPRISE (navigationnelles) : ${((100-is/imps*100)).toFixed(1)} % des impressions · ${((100-cs/clics*100)).toFixed(1)} % des clics`);
  console.log(`\n25 premieres requetes par clics :`);
  for (const r of [...rows].sort((a,b)=>(b.clicks||0)-(a.clicks||0)).slice(0,25))
    console.log(`  ${String(r.clicks).padStart(4)} clics ${String(r.impressions).padStart(5)} imp  pos ${(r.position||0).toFixed(1).padStart(5)}  ${r.keys![0]}`);
})();
