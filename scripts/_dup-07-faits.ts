/** MESURE 5 : combien de FAITS PROPRES porte reellement une page rendue ?
 *  On compte, dans le HTML servi : mots visibles, fiches listees, nombres
 *  distincts (prix, dates, chiffres locaux), et la part du texte qui est
 *  du gabarit (presente aussi sur une page sans aucun rapport). */
const BASE = "https://workwave.fr";
function texte(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
}
async function get(u: string) {
  const r = await fetch(`${BASE}${u}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" }, redirect: "manual" });
  return { status: r.status, html: r.status === 200 ? await r.text() : "" };
}
function faits(html: string) {
  const t = texte(html);
  const mots = t.split(" ").filter(Boolean).length;
  // Cartes de pros listees : liens /artisan/ distincts
  const fiches = new Set((html.match(/href="\/artisan\/[a-z0-9-]+"/g) || [])).size;
  // Montants en euros
  const prix = new Set((t.match(/\d[\d ]*(?:,\d+)?\s?€/g) || []).map(s => s.replace(/\s/g, ""))).size;
  // Dates completes (12 mars 2009) et annees
  const dates = new Set(t.match(/\b\d{1,2}\s(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s\d{4}\b/gi) || []).size;
  const annees = new Set(t.match(/\b(?:19|20)\d{2}\b/g) || []).size;
  // Nombres >= 3 chiffres (population, densite, revenus, comptages)
  const gros = new Set(t.match(/\b\d{3,}\b/g) || []).size;
  return { mots, fiches, prix, dates, annees, gros };
}
(async () => {
  const urls = [
    ["listing 86 AVEC contenu redactionnel", "/plombier/poitiers"],
    ["listing 86 AVEC contenu redactionnel", "/plombier/chatellerault"],
    ["listing SANS contenu redactionnel", "/electricien/bordeaux"],
    ["listing SANS contenu redactionnel", "/electricien/merignac"],
    ["listing SANS contenu redactionnel", "/couvreur/nantes"],
    ["listing departement", "/plombier/vienne-86"],
    ["listing departement", "/electricien/gironde-33"],
    ["racine metier", "/plombier"],
    ["guide des prix", "/guide-des-prix/prix-plombier"],
  ];
  console.log("page                                              mots  fiches  prix  dates  annees  nb>=3ch");
  for (const [label, u] of urls) {
    const { status, html } = await get(u);
    if (status !== 200) { console.log(`${u.padEnd(46)} HTTP ${status}`); continue; }
    const f = faits(html);
    console.log(`${u.padEnd(46)} ${String(f.mots).padStart(5)} ${String(f.fiches).padStart(7)} ${String(f.prix).padStart(5)} ${String(f.dates).padStart(6)} ${String(f.annees).padStart(7)} ${String(f.gros).padStart(8)}   ${label}`);
  }
})();
