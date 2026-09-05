/** MESURE 7 : le texte "propre" a chaque listing l'est-il vraiment, ou est-ce
 *  le MEME gabarit avec le nom de la commune substitue ?
 *  On remesure le recouvrement apres avoir remplace le nom de la commune,
 *  celui du departement et les nombres par des jetons neutres. */
const BASE = "https://workwave.fr";
function texte(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/[  ]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function normalise(t: string, mots: string[]) {
  let s = t;
  for (const m of mots) s = s.split(m.toLowerCase()).join(" xville ");
  return s.replace(/\b\d[\d ]*\b/g, " xnum ").replace(/\s+/g, " ");
}
function gram(t: string, n = 6) {
  const m = t.split(" ").filter(Boolean); const s = new Set<string>();
  for (let i = 0; i + n <= m.length; i++) s.add(m.slice(i, i + n).join(" ")); return s;
}
function rec(a: string, b: string) {
  const ga = gram(a), gb = gram(b); let c = 0;
  for (const g of ga) if (gb.has(g)) c++; return (c / Math.min(ga.size, gb.size)) * 100;
}
async function get(u: string) {
  const r = await fetch(`${BASE}${u}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" }, redirect: "manual" });
  return r.status === 200 ? texte(await r.text()) : null;
}
(async () => {
  const cas: [string, string, string[], string, string[]][] = [
    ["SANS contenu (Gironde)", "/electricien/bordeaux", ["bordeaux","gironde"], "/electricien/merignac", ["merignac","mérignac","gironde"]],
    ["SANS contenu (Loire-Atl.)", "/couvreur/nantes", ["nantes","loire-atlantique"], "/couvreur/saint-nazaire", ["saint-nazaire","loire-atlantique"]],
    ["SANS contenu (Nord)", "/peintre/lille", ["lille","nord"], "/peintre/tourcoing", ["tourcoing","nord"]],
    ["AVEC contenu (Vienne 86)", "/plombier/poitiers", ["poitiers","vienne"], "/plombier/chatellerault", ["chatellerault","châtellerault","vienne"]],
  ];
  console.log("paire                                brut    normalise (nom de commune et nombres neutralises)");
  for (const [label, ua, ma, ub, mb] of cas) {
    const A = await get(ua), B = await get(ub);
    if (!A || !B) { console.log(`${label} : page non servie`); continue; }
    const brut = rec(A, B);
    const norm = rec(normalise(A, ma), normalise(B, mb));
    console.log(`${label.padEnd(28)} ${brut.toFixed(1).padStart(6)} % ${norm.toFixed(1).padStart(10)} %`);
  }
})();
