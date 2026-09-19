import { load } from 'cheerio';
const base = process.argv[2] || 'http://127.0.0.1:3002';
const paths = ['/', '/artisan/lf-concept-00021', '/artisan/homerenov91-00011', '/artisan/elagage-precis-00030', '/recherche', '/peintre', '/peintre/draveil', '/plombier/poitiers', '/cuisiniste/haute-garonne-31', '/departements', '/guide-des-prix', '/peintre/guide', '/peintre/prix', '/blog', '/pro', '/pro/retrouver-fiche', '/pro/creer-fiche', '/pro/connexion', '/deposer-projet'];
const results = [];
const discovered = new Set();
for (const path of paths) {
  try {
    const r = await fetch(base + path, { signal: AbortSignal.timeout(90000) });
    const html = await r.text(), $ = load(html);
    const row = { path, status: r.status, h1: $('h1').length, canonical: $('link[rel=canonical]').attr('href') || null, noindex: $('meta[name=robots]').toArray().some(el => $(el).attr('content')?.includes('noindex')), brokenPreview: $('a[href*=".html"]').length, error: html.includes('Application error:') };
    results.push(row);
    for (const el of $('a[href]').toArray()) { const href = $(el).attr('href'); if (/^\/(guide-des-prix|blog)\/[^/?#]+$/.test(href || '')) discovered.add(href); }
    console.log(JSON.stringify(row));
  } catch (e) { results.push({ path, error: e.message }); console.log(JSON.stringify(results.at(-1))); }
}
for (const family of ['/guide-des-prix/', '/blog/']) {
  const path = [...discovered].find(p => p.startsWith(family));
  if (!path) continue;
  try { const r = await fetch(base + path, { signal: AbortSignal.timeout(90000) }); const $=load(await r.text()); const row={path,status:r.status,h1:$('h1').length,canonical:$('link[rel=canonical]').attr('href')}; results.push(row);console.log(JSON.stringify(row)); } catch(e){results.push({path,error:e.message});}
}
const failed = results.filter(r=>r.status!==200 || r.h1!==1 || r.brokenPreview>0 || r.error);
console.log(JSON.stringify({ checked:results.length, failed:failed.length, failures:failed }));
process.exitCode = failed.length ? 1 : 0;
