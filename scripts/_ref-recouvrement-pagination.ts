// Recouvrement de texte visible entre une page 1 de listing et sa page 2,
// en 6-grammes (meme methode que scripts/mesurer-recouvrement-fiches.ts).
function texte(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase().trim();
}
function grams(t: string, n = 6) {
  const m = t.split(" ").filter(Boolean);
  const s = new Set<string>();
  for (let i = 0; i + n <= m.length; i++) s.add(m.slice(i, i + n).join(" "));
  return s;
}
async function get(u: string) { const r = await fetch(u); return texte(await r.text()); }
(async () => {
  const paires: [string, string, string][] = [
    ["plombier Paris", "https://workwave.fr/plombier/paris", "https://workwave.fr/plombier/paris/page/2"],
    ["debarras Manche", "https://workwave.fr/debarras/manche-50", "https://workwave.fr/debarras/manche-50/page/2"],
    ["architecte Doubs", "https://workwave.fr/architecte/doubs-25", "https://workwave.fr/architecte/doubs-25/page/2"],
  ];
  for (const [lab, a, b] of paires) {
    const [ta, tb] = [await get(a), await get(b)];
    const ga = grams(ta), gb = grams(tb);
    let inter = 0; gb.forEach((g) => { if (ga.has(g)) inter++; });
    console.log(`${lab.padEnd(18)} | mots p1=${ta.split(" ").length} p2=${tb.split(" ").length} | 6-grammes de la page 2 deja presents en page 1 : ${(100 * inter / gb.size).toFixed(1)} %`);
  }
  // temoin : deux listings sans rapport (plancher du gabarit)
  const [t1, t2] = [await get("https://workwave.fr/plombier/paris"), await get("https://workwave.fr/debarras/manche-50")];
  const g1 = grams(t1), g2 = grams(t2); let i2 = 0; g2.forEach((g) => { if (g1.has(g)) i2++; });
  console.log(`TEMOIN (2 listings sans rapport) : ${(100 * i2 / g2.size).toFixed(1)} % (plancher du gabarit)`);
})();
