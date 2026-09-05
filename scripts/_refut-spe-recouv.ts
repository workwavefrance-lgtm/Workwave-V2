/** Recouvrement de texte : page specialite vs son listing parent, et vs une specialite soeur. */
const BASE = "https://workwave.fr";
function texteVisible(h: string) { return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&[a-z]+;|&#\d+;/gi," ").replace(/\s+/g," ").trim().toLowerCase(); }
function gram(t: string, n=6) { const m=t.split(" ").filter(Boolean); const s=new Set<string>(); for(let i=0;i+n<=m.length;i++) s.add(m.slice(i,i+n).join(" ")); return s; }
function rec(a: string, b: string) { const ga=gram(a), gb=gram(b); if(ga.size<50||gb.size<50) return null; let c=0; for(const g of ga) if(gb.has(g)) c++; return (c/Math.min(ga.size,gb.size))*100; }
const cache = new Map<string,string|null>();
async function page(u: string) { if(cache.has(u)) return cache.get(u)!; const r=await fetch(BASE+u,{headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"},redirect:"manual"}); const v=r.status===200?texteVisible(await r.text()):null; if(!v) console.log(`  ${u} -> HTTP ${r.status}`); cache.set(u,v); return v; }
(async () => {
  const paires: [string,string,string][] = [
    ["specialite vs listing parent", "/plombier/debouchage/poitiers", "/plombier/poitiers"],
    ["specialite vs listing parent", "/carreleur/faience/dijon", "/carreleur/dijon"],
    ["specialite vs listing parent", "/menuisier/fenetre/paris", "/menuisier/paris"],
    ["specialite vs specialite soeur (meme ville)", "/plombier/debouchage/poitiers", "/plombier/fuite/poitiers"],
    ["specialite vs specialite soeur (meme ville)", "/carreleur/faience/dijon", "/carreleur/terrasse/dijon"],
    ["meme specialite, 2 villes", "/plombier/debouchage/poitiers", "/plombier/debouchage/dijon"],
    ["temoin sans rapport", "/plombier/debouchage/poitiers", "/carreleur/terrasse/dijon"],
  ];
  for (const [lib,a,b] of paires) {
    const [ta,tb] = [await page(a), await page(b)];
    if(!ta||!tb) { console.log(`${lib} : indisponible`); continue; }
    console.log(`${String(rec(ta,tb)!.toFixed(1)).padStart(5)} % | ${lib}\n        ${a}  vs  ${b}`);
  }
})();
