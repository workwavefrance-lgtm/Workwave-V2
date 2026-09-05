import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEPTS = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];

type Zone = { code: string; mode: "range" | "list"; min?: number; max?: number; ids?: number[] };

async function zones(): Promise<Zone[]> {
  const { data: deps } = await sb.from("departments").select("id, code").in("code", DEPTS);
  const ids = (deps as any[]).map(d => d.id);
  const byId = new Map((deps as any[]).map(d => [d.id, d.code]));
  const all: any[] = []; let offset = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id, department_id").in("department_id", ids).order("id").range(offset, offset + 999);
    const rows = data || []; if (rows.length === 0) break; all.push(...rows); offset += rows.length;
  }
  const par = new Map<number, number[]>();
  for (const c of all) { if (!par.has(c.department_id)) par.set(c.department_id, []); par.get(c.department_id)!.push(c.id); }
  const out: Zone[] = [];
  for (const [did, list] of par) {
    list.sort((a, b) => a - b);
    const code = byId.get(did)!;
    const contig = (list[list.length - 1] - list[0] + 1) === list.length;
    if (contig) out.push({ code, mode: "range", min: list[0], max: list[list.length - 1] });
    else out.push({ code, mode: "list", ids: list });
  }
  return out;
}

async function compte(catId: number, z: Zone): Promise<number> {
  let q = sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", catId).eq("is_active", true).is("deleted_at", null)
    .or("etat_admin.is.null,etat_admin.neq.F");
  if (z.mode === "range") q = q.gte("city_id", z.min!).lte("city_id", z.max!);
  else q = q.in("city_id", z.ids!);
  const { count, error } = await q;
  if (error) throw new Error(`cat=${catId} dept=${z.code} : ${error.message}`);
  if (count === null) throw new Error(`cat=${catId} dept=${z.code} : count NULL (delai depasse)`);
  return count;
}

async function main() {
  const { data: cats } = await sb.from("categories").select("id, slug, naf_codes").eq("vertical", "btp").order("id");
  const zs = await zones();
  console.log("categories BTP :", (cats as any[]).length, "| zones :", zs.length);
  const t0 = Date.now();
  const res: { slug: string; naf: string; total: number; parDept: Record<string, number> }[] = [];
  for (const c of cats as any[]) {
    let tot = 0; const parDept: Record<string, number> = {};
    for (const z of zs) { const n = await compte(c.id, z); parDept[z.code] = n; tot += n; }
    res.push({ slug: c.slug, naf: (c.naf_codes || []).join(","), total: tot, parDept });
    console.log(`${c.slug.padEnd(32)} ${(c.naf_codes||[]).join(",").padEnd(14)} ouvertes=${String(tot).padStart(7)}`);
  }
  console.log(`\nmesure en ${(Date.now()-t0)/1000}s`);
  console.log("\n--- TRI CROISSANT ---");
  for (const r of [...res].sort((a,b)=>a.total-b.total)) {
    const nz = Object.values(r.parDept).filter(v => v > 0).length;
    console.log(`${r.slug.padEnd(32)} ${r.naf.padEnd(14)} ${String(r.total).padStart(7)}  depts>0=${nz}/19`);
  }
  const fs = require("fs");
  fs.writeFileSync("/tmp/wf-comptes-btp.json", JSON.stringify(res, null, 2));
  console.log("\ndetail par dept ecrit dans /tmp/wf-comptes-btp.json");
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:", e.message);process.exit(1);});
