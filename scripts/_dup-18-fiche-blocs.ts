/** MESURE 16 : budget de mots d'une fiche pro : combien de mots sont recopies
 *  a l'identique chez le voisin, combien lui sont propres. */
const BASE = "https://workwave.fr";
function segs(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g,"\n").replace(/&#x27;/g,"'").replace(/&[a-z]+;|&#\d+;/gi," ")
    .replace(/[  ]/g," ").split("\n").map(s=>s.trim()).filter(Boolean);
}
async function get(u: string) {
  const r = await fetch(`${BASE}${u}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" }, redirect: "manual" });
  if (r.status !== 200) { console.log(`${u} -> HTTP ${r.status}`); return null; }
  return segs(await r.text());
}
(async () => {
  const paires: [string, string, string][] = [
    ["deux electriciens de Bordeaux", "/artisan/via-carla-00037", ""],
  ];
  // on recupere un voisin via la page listing
  const r = await fetch(`${BASE}/electricien/bordeaux`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" } });
  const html = await r.text();
  const slugs = [...new Set((html.match(/href="\/artisan\/([a-z0-9-]+)"/g) || []).map(s => s.split('"')[1]))];
  console.log(`voisins trouves sur /electricien/bordeaux : ${slugs.length}`);
  if (slugs.length < 2) return;
  const A = await get(slugs[0]), B = await get(slugs[1]);
  if (!A || !B) return;
  const setB = new Set(B);
  const communs = A.filter(s => setB.has(s) && s.split(" ").length >= 5);
  const propres = A.filter(s => !setB.has(s) && s.split(" ").length >= 5);
  const mc = communs.reduce((s,x)=>s+x.split(" ").length,0);
  const mp = propres.reduce((s,x)=>s+x.split(" ").length,0);
  console.log(`\n${slugs[0]}  vs  ${slugs[1]}`);
  console.log(`segments >=5 mots : ${communs.length} identiques (${mc} mots) · ${propres.length} propres (${mp} mots)`);
  console.log(`part de mots recopiee tels quels : ${((mc/(mc+mp))*100).toFixed(1)} %\n`);
  console.log("les 10 plus longs passages RECOPIES :");
  communs.sort((x,y)=>y.length-x.length).slice(0,10).forEach(s=>console.log(`  [${String(s.split(" ").length).padStart(3)}] ${s.slice(0,150)}`));
  console.log("\nTOUS les passages PROPRES a la premiere fiche :");
  propres.sort((x,y)=>y.length-x.length).slice(0,12).forEach(s=>console.log(`  [${String(s.split(" ").length).padStart(3)}] ${s.slice(0,150)}`));
})();
