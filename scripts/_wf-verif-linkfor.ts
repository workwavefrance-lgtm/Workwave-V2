import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { generateDepartmentSlug } from "../lib/utils/slugs";
const sb = getServiceClient();

async function main() {
  // 1. Categories, meme tri que le site (.order("name"))
  const { data: cats, error: ec } = await sb
    .from("categories").select("id, slug, name, vertical").order("name");
  if (ec) throw new Error("categories: " + ec.message);
  const parVertical = (v: string) => (cats as any[]).filter((c) => c.vertical === v);

  // 2. Departements, meme tri que le site (.order("code"))
  const { data: deps, error: ed } = await sb
    .from("departments").select("id, code, name, country").order("code");
  if (ed) throw new Error("departments: " + ed.message);
  const departments = deps as any[];
  const deptSlugs = departments.map((d) => generateDepartmentSlug(d as any));
  console.log("categories btp/domicile/personne :",
    parVertical("btp").length, parVertical("domicile").length, parVertical("personne").length);
  console.log("departements dans la liste :", departments.length,
    " dont FR :", departments.filter(d => d.country === "FR" || !d.country).length);
  console.log("5 premiers slugs de dept :", deptSlugs.slice(0, 5).join(", "));

  // 3. Reproduction EXACTE de linkFor
  const linkFor = (catSlug: string, idx: number, offset: number) =>
    deptSlugs.length === 0 ? `/${catSlug}` : `/${catSlug}/${deptSlugs[(idx + offset) % deptSlugs.length]}`;

  const slugToDept = new Map(deptSlugs.map((s, i) => [s, departments[i]]));

  type Lien = { url: string; cat: any; deptSlug: string; source: string };
  const liens: Lien[] = [];
  // HOME : toutes les categories de chaque vertical, offsets 0/4/8
  for (const [v, off] of [["btp", 0], ["domicile", 4], ["personne", 8]] as [string, number][])
    parVertical(v).forEach((c, i) =>
      liens.push({ url: linkFor(c.slug, i, off), cat: c, deptSlug: deptSlugs[(i + off) % deptSlugs.length], source: "home" }));
  // FOOTER : slice(0,9) / slice(0,9) / slice(0,8), offsets 0/4/8
  const footer: [string, number, number][] = [["btp", 0, 9], ["domicile", 4, 9], ["personne", 8, 8]];
  for (const [v, off, n] of footer)
    parVertical(v).slice(0, n).forEach((c, i) =>
      liens.push({ url: linkFor(c.slug, i, off), cat: c, deptSlug: deptSlugs[(i + off) % deptSlugs.length], source: "footer" }));

  console.log("\nliens generes : home", liens.filter(l => l.source === "home").length,
    "| footer", liens.filter(l => l.source === "footer").length,
    "| URL distinctes", new Set(liens.map(l => l.url)).size);

  // 4. Couples (cat, dept) ayant au moins 1 pro OUVERT
  const t0 = Date.now();
  const { data: rpc, error: er } = await sb.rpc("sitemap_dept_cat_counts" as any, { p_min: 1 });
  if (er) throw new Error("rpc: " + er.message);
  const rows = (rpc || []) as { c: number; d: number; n: number }[];
  console.log(`RPC sitemap_dept_cat_counts(1) : ${rows.length} couples, en ${(Date.now() - t0) / 1000}s`);
  const compte = new Map(rows.map((r) => [`${r.c}:${r.d}`, r.n]));

  // 5. Verdict lien par lien
  const vides: Lien[] = [], faibles: { l: Lien; n: number }[] = [];
  for (const l of liens) {
    const d = slugToDept.get(l.deptSlug);
    const n = d ? (compte.get(`${l.cat.id}:${d.id}`) ?? 0) : -1;
    if (n <= 0) vides.push(l); else if (n < 3) faibles.push({ l, n });
  }
  console.log("\n--- LIENS VIDES (0 pro ouvert) ---");
  for (const l of [...new Set(vides.map(v => `${v.url}  [${v.source}]`))].sort()) console.log(l);
  console.log("vides :", vides.length, "sur", liens.length, "liens generes ;",
    new Set(vides.map(v => v.url)).size, "URL distinctes");
  console.log("\n--- LIENS FAIBLES (1 ou 2 pros) ---");
  for (const f of faibles) console.log(`${f.l.url}  ${f.n} pro(s)  [${f.l.source}]`);
}
main().then(() => process.exit(0)).catch((e) => { console.error("ERREUR:", e.message || e); process.exit(1); });
