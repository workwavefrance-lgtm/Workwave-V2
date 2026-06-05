/**
 * Compte les URLs reelles servies par chaque sub-sitemap de workwave.fr.
 */
async function count(url: string): Promise<number> {
  const r = await fetch(url);
  if (!r.ok) return -1;
  const text = await r.text();
  return (text.match(/<url>/g) || []).length;
}

async function main() {
  const indexUrl = "https://workwave.fr/sitemap-index.xml";
  const r = await fetch(indexUrl);
  const text = await r.text();
  const subs = Array.from(text.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  console.log(`${subs.length} sub-sitemaps :`);

  let totalUrls = 0;
  // Compter par categorie de sub-sitemap
  let aiPros = 0;
  let btpPros = 0;
  let other = 0;

  for (const url of subs) {
    const n = await count(url);
    totalUrls += n;
    const match = url.match(/sitemap\/(\d+)\.xml/);
    const id = match ? parseInt(match[1], 10) : null;
    let category = "other";
    if (id !== null) {
      if (id >= 200) category = "ai-pros";
      else if (id >= 100) category = "btp-pros";
    }
    console.log(`  ${url} -> ${n.toLocaleString()} URLs (${category})`);
    if (category === "ai-pros") aiPros += n;
    else if (category === "btp-pros") btpPros += n;
    else other += n;
  }

  console.log(`\nTotal URLs : ${totalUrls.toLocaleString()}`);
  console.log(`  - AI pros (sitemap 200+): ${aiPros.toLocaleString()}`);
  console.log(`  - BTP pros (sitemap 100+): ${btpPros.toLocaleString()}`);
  console.log(`  - Autres (statique, cat/dept/ville, etc.): ${other.toLocaleString()}`);
}
main();
