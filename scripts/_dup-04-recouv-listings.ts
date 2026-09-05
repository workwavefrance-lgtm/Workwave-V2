/** MESURE 3 : recouvrement de texte entre LISTINGS voisins.
 *  (a) meme metier, deux communes du meme departement
 *  (b) meme commune, deux metiers voisins
 *  (c) plancher : deux listings sans aucun rapport (autre metier, autre dept)
 *  Meme methode que scripts/mesurer-recouvrement-fiches.ts (6-grammes). */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const BASE = "https://workwave.fr";

function texteVisible(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function grammes(t: string, n = 6): Set<string> {
  const m = t.split(" ").filter(Boolean); const s = new Set<string>();
  for (let i = 0; i + n <= m.length; i++) s.add(m.slice(i, i + n).join(" ")); return s;
}
function recouvrement(a: string, b: string): number | null {
  const ga = grammes(a), gb = grammes(b); if (ga.size < 50 || gb.size < 50) return null;
  let c = 0; for (const g of ga) if (gb.has(g)) c++; return (c / Math.min(ga.size, gb.size)) * 100;
}
const cache = new Map<string, string | null>();
async function page(u: string): Promise<string | null> {
  if (cache.has(u)) return cache.get(u)!;
  try {
    const r = await fetch(`${BASE}${u}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" }, redirect: "manual" });
    const v = r.status === 200 ? texteVisible(await r.text()) : null;
    cache.set(u, v); if (!v) console.log(`    ${u} -> HTTP ${r.status}`);
    return v;
  } catch { cache.set(u, null); return null; }
}

(async () => {
  // Metiers BTP les plus courants + communes reelles de quelques departements.
  const { data: cats } = await sb.from("categories").select("id,slug,name")
    .in("vertical", ["btp", "domicile", "personne"]).order("id");
  const C = (cats || []) as any[];
  const bySlug = (s: string) => C.find((c) => c.slug === s);

  const paires: { label: string; a: string; b: string }[] = [];

  // (a) MEME METIER, communes voisines du meme departement.
  for (const [metier, dept] of [["plombier", "86"], ["electricien", "33"], ["macon", "13"], ["peintre", "59"], ["couvreur", "44"]] as const) {
    const cat = bySlug(metier); if (!cat) continue;
    const { data: d } = await sb.from("departments").select("id").eq("code", dept).limit(1);
    if (!d?.[0]) continue;
    const { data: villes } = await sb.from("cities").select("id,slug,name")
      .eq("department_id", d[0].id).not("population", "is", null).order("population", { ascending: false }).limit(6);
    const V = (villes || []) as any[];
    if (V.length >= 4) {
      paires.push({ label: `a) ${metier} : ${V[0].name} vs ${V[1].name} (${dept})`, a: `/${metier}/${V[0].slug}`, b: `/${metier}/${V[1].slug}` });
      paires.push({ label: `a) ${metier} : ${V[2].name} vs ${V[3].name} (${dept})`, a: `/${metier}/${V[2].slug}`, b: `/${metier}/${V[3].slug}` });
    }
  }

  // (b) MEME COMMUNE, metiers voisins.
  for (const [dept, m1, m2] of [["86", "plombier", "electricien"], ["33", "macon", "carreleur"], ["13", "peintre", "plaquiste"], ["59", "menuisier", "serrurier"]] as const) {
    const { data: d } = await sb.from("departments").select("id").eq("code", dept).limit(1);
    if (!d?.[0]) continue;
    const { data: villes } = await sb.from("cities").select("id,slug,name")
      .eq("department_id", d[0].id).not("population", "is", null).order("population", { ascending: false }).limit(1);
    const v = (villes || [])[0] as any; if (!v) continue;
    paires.push({ label: `b) ${v.name} : ${m1} vs ${m2}`, a: `/${m1}/${v.slug}`, b: `/${m2}/${v.slug}` });
  }

  // (c) PLANCHER : rien a voir (metier different ET departement different).
  const plancherPaires = [
    { label: "c) plancher : plombier/poitiers vs garde-animaux/lille", a: "/plombier/poitiers", b: "/garde-animaux/lille" },
    { label: "c) plancher : couvreur/nantes vs soutien-scolaire/marseille", a: "/couvreur/nantes", b: "/soutien-scolaire/marseille" },
    { label: "c) plancher : macon/bordeaux vs menage/strasbourg", a: "/macon/bordeaux", b: "/menage/strasbourg" },
  ];

  const voisins: number[] = [], planchers: number[] = [];
  for (const p of [...paires, ...plancherPaires]) {
    const [ta, tb] = [await page(p.a), await page(p.b)];
    if (!ta || !tb) { console.log(`  ${p.label} : page non servie, ignore`); continue; }
    const r = recouvrement(ta, tb);
    if (r === null) { console.log(`  ${p.label} : trop court`); continue; }
    (p.label.startsWith("c)") ? planchers : voisins).push(r);
    console.log(`  ${r.toFixed(1).padStart(5)} %  ${p.label}`);
  }
  const moy = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
  console.log(`\nlistings voisins  : ${voisins.length} paires, moyenne ${moy(voisins).toFixed(1)} %`);
  console.log(`plancher gabarit  : ${planchers.length} paires, moyenne ${moy(planchers).toFixed(1)} %`);
  console.log(`imputable au couple metier x ville : ${(moy(voisins) - moy(planchers)).toFixed(1)} points`);
})();
