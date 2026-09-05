/* Génère un HTML autonome (aperçu interactif) du baromètre → ~/Desktop/barometre-apercu.html */
import fs from "fs";
import os from "os";
import path from "path";
import { BAROMETRE_ARTISANS as ROWS, BAROMETRE_META as META } from "../lib/data/barometre-artisans";
import { FRANCE_MAP_VIEWBOX as VB, FRANCE_DEPT_PATHS as PATHS } from "../lib/data/france-departements-paths";

const dec = (n: number) => String(n).replace(".", ",");
const grp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const RAMP = ["#FCE7DE", "#FBCDBE", "#FBA88C", "#FB7A50", "#EA580C", "#C2410C"];
const TH = [200, 300, 400, 500, 600];
const colorFor = (d: number) => { for (let i = 0; i < TH.length; i++) if (d < TH[i]) return RAMP[i]; return RAMP[5]; };

const top = ROWS[0], bottom = ROWS[ROWS.length - 1];
const ecart = (top.densite / bottom.densite).toFixed(1).replace(".", ",");
const top15 = ROWS.slice(0, 15), maxD = top.densite;
const bottom5 = ROWS.slice(-5).reverse();

const regMap = new Map<string, { region: string; pros: number; pop: number }>();
for (const r of ROWS) { const g = regMap.get(r.region) || { region: r.region, pros: 0, pop: 0 }; g.pros += r.pros; g.pop += r.population; regMap.set(r.region, g); }
const regions = [...regMap.values()].map((g) => ({ ...g, densite: +((g.pros / g.pop) * 10000).toFixed(1) })).sort((a, b) => b.densite - a.densite);
const regMax = regions[0].densite;

const ANALYSE = [
  ["Un secteur de proximité calqué sur la population", "L'artisanat est un secteur de proximité : l'ISM et Bpifrance Création décrivent un tissu « en correspondance quasi parfaite avec la répartition de la population », d'où une densité par habitant souvent plus forte dans les territoires peu denses que dans les métropoles."],
  ["Des entreprises plus petites, donc plus nombreuses par habitant", "En zone rurale, les entreprises individuelles dominent : les entreprises sans salarié représentent environ 64 % du tissu artisanal, contre 60 à 62 % dans les grandes agglomérations."],
  ["Une histoire économique et le tourisme", "Le phénomène est ancien : les anciennes « terres industrielles » sont moins pourvues en artisanat, tandis que l'économie touristique renforce la densité dans certains départements ruraux ou de montagne."],
];
const FAQ = [
  [`Quel département compte le plus d'artisans par habitant ?`, `${top.name} arrive en tête avec ${dec(top.densite)} entreprises pour 10 000 habitants, devant ${ROWS[1].name} et ${ROWS[2].name}. À l'opposé, ${bottom.name} ferme le classement (${dec(bottom.densite)}).`],
  [`Combien d'entreprises artisanales en France ?`, `${grp(META.totalPros)} entreprises actives (bâtiment, services à domicile, aide à la personne), d'après le répertoire SIRENE de l'INSEE.`],
  [`Pourquoi moins d'artisans par habitant dans les grandes villes ?`, `Les métropoles concentrent surtout de grandes entreprises et des salariés : la part d'indépendants y est plus faible. Les zones rurales comptent plus de petites entreprises artisanales par habitant.`],
];

const mapPaths = Object.keys(PATHS).map((code) => {
  const d = ROWS.find((r) => r.code === code);
  const fill = d ? colorFor(d.densite) : "#333";
  const t = d ? `${d.name} (#${d.rank}) · ${dec(d.densite)}/10k · ${grp(d.pros)} entreprises` : code;
  return `<path d="${PATHS[code]}" fill="${fill}" stroke="#fff" stroke-width="0.7" data-t="${t.replace(/"/g, "&quot;")}"/>`;
}).join("");

const bar = (label: string, val: number, max: number, rank: number | string) =>
  `<li><span class="rk">${rank}</span><span class="nm">${label}</span><span class="track"><span class="fill" style="width:${(val / max) * 100}%"></span></span><span class="vl">${dec(val)}</span></li>`;

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Baromètre des artisans · aperçu</title>
<style>
:root{--bg:#0A0A0A;--bg2:#141414;--bd:#27272A;--tx:#FAFAFA;--tx2:#9CA3AF;--tx3:#6B7280;--ac:#FF5A36}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6}
.wrap{max-width:900px;margin:0 auto;padding:32px 20px 80px}
.eyebrow{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.18em;color:var(--ac);text-transform:uppercase;margin-bottom:12px}
h1{font-size:40px;font-weight:800;letter-spacing:-.02em;line-height:1.08;margin:0 0 18px}
h2{font-size:26px;font-weight:700;letter-spacing:-.01em;margin:0 0 8px}
h3{font-size:16px;font-weight:600;margin:0 0 6px}
p{color:var(--tx2);margin:0 0 14px}.lead{font-size:18px;max-width:640px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:28px 0}
.card{border:1px solid var(--bd);background:var(--bg2);border-radius:16px;padding:22px}
.card .v{font-size:34px;font-weight:800;color:var(--ac);letter-spacing:-.02em}.card .l{font-size:13px;color:var(--tx2);margin-top:4px}
.key{background:rgba(255,90,54,.08);border:1px solid rgba(255,90,54,.25);border-radius:16px;padding:24px;margin:32px 0}
.key .big{font-size:22px;font-weight:600;color:var(--tx);letter-spacing:-.01em}.key .big b{color:var(--ac)}
section{margin:44px 0}
.map{max-width:560px;margin:0 auto;position:relative}
.map svg path{cursor:pointer;transition:stroke-width .1s}.map svg path:hover{stroke-width:2.2}
#tip{position:fixed;pointer-events:none;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:8px 11px;font-size:13px;display:none;z-index:9;box-shadow:0 6px 20px rgba(0,0,0,.4)}
.legend{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:12px;color:var(--tx2);margin-top:14px;align-items:center}
.legend i{width:14px;height:14px;border-radius:4px;display:inline-block;vertical-align:-2px;margin-right:5px}
ul.bars{list-style:none;padding:0;margin:0}ul.bars li{display:flex;align-items:center;gap:12px;margin:9px 0}
.rk{width:24px;text-align:right;font-size:13px;font-weight:600;color:var(--tx3)}
.nm{width:200px;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.track{flex:1;height:24px;background:var(--bg2);border-radius:6px;overflow:hidden}.fill{display:block;height:100%;background:var(--ac);border-radius:6px}
.vl{width:52px;text-align:right;font-size:14px;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:12px}.chip{border:1px solid var(--bd);background:var(--bg2);border-radius:12px;padding:12px 16px}.chip b{display:block}.chip span{font-size:13px;color:var(--tx2)}
.faq .qa{border:1px solid var(--bd);border-radius:12px;padding:18px;margin-bottom:14px}
.src{font-size:12px;color:var(--tx3);margin-top:10px}
.meth{border:1px solid var(--bd);background:var(--bg2);border-radius:16px;padding:22px}.meth li{margin:8px 0;color:var(--tx2);font-size:14px}
.cta{border:1px solid var(--bd);border-radius:16px;padding:32px;text-align:center}.btn{display:inline-block;background:var(--ac);color:#fff;font-weight:600;padding:14px 30px;border-radius:999px;text-decoration:none;margin-top:8px}
b{color:var(--tx)}@media(max-width:640px){.stats{grid-template-columns:1fr}h1{font-size:30px}.nm{width:120px}}
</style></head><body><div class="wrap">
<div class="eyebrow">Observatoire Workwave</div>
<h1>Baromètre des artisans en France 2026</h1>
<p class="lead">Où trouve-t-on le plus d'artisans, et où en manque-t-il le plus ? Nous avons analysé <b>${grp(META.totalPros)} entreprises artisanales</b> (bâtiment, services à domicile, aide à la personne) dans les 100 départements français.</p>
<div class="stats">
<div class="card"><div class="v">${(META.totalPros / 1e6).toFixed(2).replace(".", ",")} M</div><div class="l">entreprises artisanales référencées</div></div>
<div class="card"><div class="v">100</div><div class="l">départements analysés</div></div>
<div class="card"><div class="v">${ecart}×</div><div class="l">plus d'artisans/hab. entre le 1ᵉʳ (${top.name}) et le dernier (${bottom.name})</div></div>
</div>
<div class="key"><div class="big">La France rurale compte jusqu'à <b>${ecart} fois plus</b> d'artisans par habitant que les grandes métropoles.</div><p style="margin:8px 0 0">En tête : ${top.name} (${dec(top.densite)} / 10 000 hab.). En bas : ${bottom.name} (${dec(bottom.densite)}).</p></div>

<section><h2>La carte de la densité artisanale</h2><p>Plus un département est foncé, plus il compte d'entreprises par habitant. Survolez pour le détail.</p>
<div class="map"><svg viewBox="${VB}" style="width:100%;height:auto">${mapPaths}</svg>
<div class="legend"><span style="color:var(--tx3)">Entreprises / 10 000 hab :</span>${["< 200", "200-300", "300-400", "400-500", "500-600", "600 +"].map((l, i) => `<span><i style="background:${RAMP[i]}"></i>${l}</span>`).join("")}</div></div></section>

<section><h2>Top 15 des départements les mieux dotés</h2><ul class="bars">${top15.map((r) => bar(r.name, r.densite, maxD, r.rank)).join("")}</ul></section>

<section><h2>Là où il manque le plus d'artisans</h2><div class="chips">${bottom5.map((r) => `<div class="chip"><b>${r.name}</b><span>${dec(r.densite)} / 10k · #${r.rank}</span></div>`).join("")}</div></section>

<section><h2>Pourquoi un tel écart entre villes et campagnes ?</h2>${ANALYSE.map(([t, x]) => `<h3>${t}</h3><p>${x}</p>`).join("")}<p class="src">Sources : fondation-entrepreneurs.mma, veille.artisanat.fr, batiactu.com</p></section>

<section><h2>Le classement par région</h2><ul class="bars">${regions.map((r, i) => bar(r.region, r.densite, regMax, i + 1)).join("")}</ul></section>

<section class="faq"><h2>Questions fréquentes</h2>${FAQ.map(([q, a]) => `<div class="qa"><h3>${q}</h3><p style="margin:0">${a}</p></div>`).join("")}</section>

<section><div class="meth"><h3>Méthodologie & sources</h3><ul><li><b>Entreprises</b> : établissements des métiers du bâtiment, services à domicile et aide à la personne, référencés depuis le répertoire <b>SIRENE (INSEE)</b>. Entreprises immatriculées, pas toutes à temps plein.</li><li><b>Population</b> : population municipale 2021, <b>INSEE</b> (data.gouv.fr).</li><li><b>Densité</b> = entreprises ÷ population × 10 000. Mayotte exclu (pop. non disponible). Relevé : ${META.generatedAt}.</li></ul></div></section>

<section class="cta"><h2>Besoin d'un artisan près de chez vous ?</h2><p>Décrivez votre projet en 2 minutes, recevez plusieurs devis gratuits.</p><a class="btn" href="#">Déposer mon projet, gratuit →</a></section>
</div>
<div id="tip"></div>
<script>
var tip=document.getElementById('tip');
document.querySelectorAll('.map path').forEach(function(p){
 p.addEventListener('mousemove',function(e){tip.textContent=p.getAttribute('data-t');tip.style.display='block';tip.style.left=(e.clientX+14)+'px';tip.style.top=(e.clientY-10)+'px';});
 p.addEventListener('mouseleave',function(){tip.style.display='none';});
});
</script></body></html>`;

const dest = path.join(os.homedir(), "Desktop", "barometre-apercu.html");
fs.writeFileSync(dest, html);
console.log("écrit", dest, Math.round(html.length / 1024) + " KB");
