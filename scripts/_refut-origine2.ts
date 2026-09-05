/** Classe CHAQUE segment recopie par le fichier source qui le produit. */
import { execSync } from "node:child_process";
const BASE = "https://workwave.fr";
function texte(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n").replace(/&nbsp;|&#160;/gi, " ").replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/[  ]/g, " ").split("\n").map(s => s.trim()).filter(Boolean);
}
async function blocs(u: string) {
  const r = await fetch(`${BASE}${u}`, { headers: { "user-agent": "wwaudit" }, redirect: "manual" });
  return r.status === 200 ? texte(await r.text()) : null;
}
function decode(s: string) { return s.replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&rsquo;|’/g, "’"); }
function origine(seg: string): string {
  const mots = decode(seg).split(" ");
  // on tente plusieurs fenetres de 6 mots
  for (let i = 0; i + 6 <= mots.length && i < 12; i++) {
    const needle = mots.slice(i, i + 6).join(" ");
    if (needle.length < 15) continue;
    try {
      const out = execSync(`grep -rlF ${JSON.stringify(needle)} app lib components 2>/dev/null | head -3`, { encoding: "utf8", cwd: "/Users/willygauvrit/Desktop/Workwave-V2" }).trim();
      if (out) return out.split("\n").join(" | ");
    } catch { /* grep exit 1 */ }
  }
  return "INTROUVABLE";
}
(async () => {
  const A = await blocs("/electricien/bordeaux"), B = await blocs("/electricien/merignac");
  if (!A || !B) return;
  const setB = new Set(B);
  const communs = A.filter(s => setB.has(s) && s.split(" ").length >= 5)
    .sort((x, y) => y.split(" ").length - x.split(" ").length);
  const parFichier: Record<string, { seg: number; mots: number }> = {};
  for (const s of communs) {
    const o = origine(s);
    const n = s.split(" ").length;
    parFichier[o] = parFichier[o] || { seg: 0, mots: 0 };
    parFichier[o].seg++; parFichier[o].mots += n;
    console.log(`[${String(n).padStart(3)} mots] ${o}  <<${decode(s).slice(0, 55)}>>`);
  }
  const total = communs.reduce((s, x) => s + x.split(" ").length, 0);
  console.log(`\n=== REPARTITION DES ${total} MOTS RECOPIES PAR FICHIER SOURCE ===`);
  Object.entries(parFichier).sort((a, b) => b[1].mots - a[1].mots)
    .forEach(([f, v]) => console.log(`${String(v.mots).padStart(4)} mots (${((v.mots / total) * 100).toFixed(1)} %) · ${v.seg} seg · ${f}`));
})();
