/** MESURE 6 : QUELS blocs de texte sont recopies d'un listing a l'autre.
 *  On aligne les deux textes et on extrait les plus longs passages communs. */
const BASE = "https://workwave.fr";
function texte(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n").replace(/&nbsp;|&#160;/gi, " ").replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/[  ]/g, " ").split("\n").map(s => s.trim()).filter(Boolean);
}
async function blocs(u: string) {
  const r = await fetch(`${BASE}${u}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" }, redirect: "manual" });
  if (r.status !== 200) { console.log(`${u} -> HTTP ${r.status}`); return null; }
  return texte(await r.text());
}
(async () => {
  const paires: [string, string, string][] = [
    ["SANS contenu redactionnel", "/electricien/bordeaux", "/electricien/merignac"],
    ["AVEC contenu redactionnel (86)", "/plombier/poitiers", "/plombier/chatellerault"],
  ];
  for (const [label, ua, ub] of paires) {
    const A = await blocs(ua), B = await blocs(ub);
    if (!A || !B) continue;
    const setB = new Set(B);
    const communs = A.filter(s => setB.has(s) && s.split(" ").length >= 5);
    const propres = A.filter(s => !setB.has(s) && s.split(" ").length >= 5);
    const motsC = communs.reduce((s, x) => s + x.split(" ").length, 0);
    const motsP = propres.reduce((s, x) => s + x.split(" ").length, 0);
    console.log(`\n=== ${label} : ${ua} vs ${ub} ===`);
    console.log(`segments >=5 mots : ${communs.length} IDENTIQUES (${motsC} mots) · ${propres.length} propres (${motsP} mots)`);
    console.log(`part de mots recopiee tels quels : ${((motsC / (motsC + motsP)) * 100).toFixed(1)} %`);
    console.log(`\n  les 12 plus longs passages RECOPIES a l'identique :`);
    communs.sort((x, y) => y.length - x.length).slice(0, 12)
      .forEach(s => console.log(`   [${String(s.split(" ").length).padStart(3)} mots] ${s.slice(0, 155)}${s.length > 155 ? "..." : ""}`));
    console.log(`\n  les 8 plus longs passages PROPRES a ${ua} :`);
    propres.sort((x, y) => y.length - x.length).slice(0, 8)
      .forEach(s => console.log(`   [${String(s.split(" ").length).padStart(3)} mots] ${s.slice(0, 155)}${s.length > 155 ? "..." : ""}`));
  }
})();
