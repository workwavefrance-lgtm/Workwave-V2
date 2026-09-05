// Recouvrement en 6-grammes entre pages soeurs, avec temoin sans rapport.
const BASE = "https://workwave.fr";
async function texte(u: string): Promise<string> {
  const r = await fetch(BASE + u);
  if (r.status !== 200) return "";
  let h = await r.text();
  h = h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
  return h.replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").toLowerCase().trim();
}
function grams(t: string, n = 6): Set<string> {
  const m = t.split(" ").filter(Boolean); const s = new Set<string>();
  for (let i = 0; i + n <= m.length; i++) s.add(m.slice(i, i + n).join(" "));
  return s;
}
function rec(a: Set<string>, b: Set<string>) {
  let c = 0; for (const x of a) if (b.has(x)) c++;
  return (100 * c / Math.min(a.size, b.size));
}
async function main() {
  const paires: [string, string, string][] = [
    ["soeurs specialite (meme ville)", "/carreleur/salle-de-bain/paris", "/carreleur/cuisine/paris"],
    ["soeurs specialite (meme ville)", "/carreleur/terrasse/paris", "/carreleur/faience/paris"],
    ["meme specialite, 2 villes", "/carreleur/salle-de-bain/paris", "/carreleur/salle-de-bain/nantes"],
    ["specialite vs listing parent", "/carreleur/salle-de-bain/paris", "/carreleur/paris"],
    ["TEMOIN sans rapport", "/carreleur/salle-de-bain/paris", "/menage/versailles"],
    ["listings sans rapport (plancher)", "/carreleur/paris", "/menage/versailles"],
  ];
  for (const [lab, a, b] of paires) {
    const [ta, tb] = await Promise.all([texte(a), texte(b)]);
    if (!ta || !tb) { console.log(`${lab} | ${a} vs ${b} : page absente`); continue; }
    const ga = grams(ta), gb = grams(tb);
    console.log(`${rec(ga, gb).toFixed(1)}% | ${lab} | ${a} (${ga.size} 6-grammes) vs ${b} (${gb.size})`);
  }
}
main();
