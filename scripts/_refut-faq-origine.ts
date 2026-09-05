/** REFUTATION : d'ou viennent VRAIMENT les 773 mots recopies entre 2 listings voisins ?
 *  On rejoue _dup-08-blocs.ts puis on classe CHAQUE segment commun par son origine
 *  dans le code (FAQ listing-faq.ts vs seo-sections.ts vs gabarit/formulaire). */
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
  const A = await blocs("/electricien/bordeaux"), B = await blocs("/electricien/merignac");
  if (!A || !B) return;
  const setB = new Set(B);
  const communs = A.filter(s => setB.has(s) && s.split(" ").length >= 5);
  const motsC = communs.reduce((s, x) => s + x.split(" ").length, 0);
  console.log(`TOTAL communs : ${communs.length} segments, ${motsC} mots\n`);
  communs.sort((x, y) => y.split(" ").length - x.split(" ").length)
    .forEach((s, i) => console.log(`${String(i + 1).padStart(2)}. [${String(s.split(" ").length).padStart(3)} mots] ${s.slice(0, 120)}`));
})();
