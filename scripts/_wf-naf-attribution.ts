import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEPTS = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];

type Zone = { code: string; mode: "range" | "list"; min?: number; max?: number; ids?: number[] };
async function zones(): Promise<Zone[]> {
  const { data: deps } = await sb.from("departments").select("id, code").in("code", DEPTS);
  const ids = (deps as any[]).map(d => d.id); const byId = new Map((deps as any[]).map(d => [d.id, d.code]));
  const all: any[] = []; let offset = 0;
  while (true) { const { data } = await sb.from("cities").select("id, department_id").in("department_id", ids).order("id").range(offset, offset + 999);
    const rows = data || []; if (!rows.length) break; all.push(...rows); offset += rows.length; }
  const par = new Map<number, number[]>();
  for (const c of all) { if (!par.has(c.department_id)) par.set(c.department_id, []); par.get(c.department_id)!.push(c.id); }
  const out: Zone[] = [];
  for (const [did, list] of par) { list.sort((a,b)=>a-b); const code = byId.get(did)!;
    const contig = (list[list.length-1]-list[0]+1) === list.length;
    out.push(contig ? { code, mode:"range", min:list[0], max:list[list.length-1] } : { code, mode:"list", ids:list }); }
  return out;
}
async function compte(catId: number, naf: string, z: Zone): Promise<number> {
  let q = sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", catId).eq("naf_code", naf)
    .eq("is_active", true).is("deleted_at", null);
  if (z.mode === "range") q = q.gte("city_id", z.min!).lte("city_id", z.max!); else q = q.in("city_id", z.ids!);
  const { count, error } = await q;
  if (error) throw new Error(`${catId}/${naf}/${z.code} : ${error.message}`);
  if (count === null) throw new Error(`${catId}/${naf}/${z.code} : count NULL`);
  return count;
}

// NAF partages BTP -> categories concurrentes (id, slug), dans l'ordre d'id (= ordre du scraper)
const PARTAGES: { naf: string; cats: [number, string][] }[] = [
  { naf: "4321A", cats: [[2,"electricien"],[39,"videosurveillance-installateur"]] },
  { naf: "4322B", cats: [[12,"chauffagiste"],[13,"climaticien"],[38,"ramoneur"]] },
  { naf: "4329B", cats: [[36,"pisciniste"],[199,"ascensoriste"]] },
  { naf: "4332A", cats: [[5,"menuisier"],[41,"cuisiniste"]] },
  { naf: "4332B", cats: [[5,"menuisier"],[11,"serrurier"],[37,"vitrier"]] },
  { naf: "4334Z", cats: [[4,"peintre"],[37,"vitrier"]] },
  { naf: "4399A", cats: [[10,"facadier"],[36,"pisciniste"]] },
];

async function main() {
  const zs = await zones();
  console.log("Fiches ACTIVES portant un NAF partage, par categorie, sur les 19 depts denses\n");
  for (const p of PARTAGES) {
    const ligne: string[] = [];
    for (const [id, slug] of p.cats) {
      let t = 0; for (const z of zs) t += await compte(id, p.naf, z);
      ligne.push(`${slug}=${t}`);
    }
    console.log(`NAF ${p.naf} : ${ligne.join("  |  ")}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:", e.message);process.exit(1);});
