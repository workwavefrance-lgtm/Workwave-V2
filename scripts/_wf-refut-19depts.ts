import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const DEPTS = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];
const CATS: [number, string][] = [[37,"vitrier"],[13,"climaticien"],[11,"serrurier"],[199,"ascensoriste"],[12,"chauffagiste"],[3,"macon"]];

async function villes(code: string) {
  const { data: d, error } = await sb.from("departments").select("id").eq("code", code);
  if (error || !d?.length) { console.log(`dept ${code} introuvable`); return []; }
  const out: number[] = [];
  let offset = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id").eq("department_id", d[0].id).range(offset, offset + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    out.push(...rows.map((r: any) => r.id));
    offset += rows.length;
  }
  return out;
}

async function compte(cat: number, ids: number[], ouvertsSeulement: boolean) {
  let total = 0;
  for (let i = 0; i < ids.length; i += 800) {
    const bout = ids.slice(i, i + 800);
    let q: any = sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", cat).in("city_id", bout);
    if (ouvertsSeulement) q = q.or("etat_admin.is.null,etat_admin.neq.F");
    const { count, error } = await q;
    if (error || count === null) return null; // un null est une ERREUR, jamais un zero
    total += count;
  }
  return total;
}

async function main() {
  const parCat = new Map<string, { tous: number; ouverts: number; erreur: boolean }>();
  for (const [, nom] of CATS) parCat.set(nom, { tous: 0, ouverts: 0, erreur: false });
  let communes = 0;
  for (const dept of DEPTS) {
    const ids = await villes(dept);
    communes += ids.length;
    for (const [cat, nom] of CATS) {
      const t = await compte(cat, ids, false);
      const o = await compte(cat, ids, true);
      const e = parCat.get(nom)!;
      if (t === null || o === null) e.erreur = true;
      else { e.tous += t; e.ouverts += o; }
    }
  }
  console.log(`19 departements, ${communes} communes\n`);
  console.log("categorie      | fiches (tout etat) | fiches ouvertes");
  console.log("---------------+--------------------+----------------");
  for (const [, nom] of CATS) {
    const e = parCat.get(nom)!;
    if (e.erreur) console.log(`${nom.padEnd(14)} | ERREUR de comptage sur au moins un lot`);
    else console.log(`${nom.padEnd(14)} | ${String(e.tous).padStart(18)} | ${String(e.ouverts).padStart(15)}`);
  }
}
main();
