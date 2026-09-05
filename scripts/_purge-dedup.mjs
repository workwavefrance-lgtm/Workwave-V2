import fs from "fs";
const S = (fs.readFileSync(".env.local","utf8").match(/^CRON_SECRET=(.+)$/m)||[])[1]
  ?.trim().replace(/^["']|["']$/g,"");
if (!S) { console.error("CRON_SECRET introuvable"); process.exit(1); }
const liste = JSON.parse(fs.readFileSync("/tmp/dedup-a-retirer.json","utf8"));
const PAR = 40;
let ok = 0, ko = 0;
for (let i = 0; i < liste.length; i += PAR) {
  const lot = liste.slice(i, i + PAR);
  const qs = lot.map(r => `path=${encodeURIComponent("/artisan/"+r.slug)}`).join("&");
  try {
    const r = await fetch(`https://workwave.fr/api/revalidate-sitemap?${qs}`,
      { method: "POST", headers: { Authorization: `Bearer ${S}` } });
    if (r.ok) ok += lot.length; else ko += lot.length;
  } catch { ko += lot.length; }
  if (i % 8000 === 0) console.log(`   ${ok.toLocaleString("fr-FR")} purgees, ${ko} echecs`);
}
console.log(`\ntermine : ${ok.toLocaleString("fr-FR")} purgees, ${ko} echecs`);
