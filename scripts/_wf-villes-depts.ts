import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEPTS = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];

async function main() {
  const { data: deps, error } = await sb.from("departments").select("id, code, name, country").in("code", DEPTS);
  if (error) throw error;
  console.log("departements trouves :", (deps||[]).length);
  const byId = new Map((deps as any[]).map(d => [d.id, d]));

  // toutes les villes de ces depts, paginees
  const all: { id: number; department_id: number }[] = [];
  let offset = 0;
  const ids = (deps as any[]).map(d => d.id);
  while (true) {
    const { data, error: e2 } = await sb.from("cities").select("id, department_id").in("department_id", ids).order("id").range(offset, offset + 999);
    if (e2) throw e2;
    const rows = data || [];
    if (rows.length === 0) break;
    all.push(...(rows as any[]));
    offset += rows.length;
  }
  console.log("villes totales sur les 19 depts :", all.length);
  const par = new Map<number, number[]>();
  for (const c of all) { if (!par.has(c.department_id)) par.set(c.department_id, []); par.get(c.department_id)!.push(c.id); }
  let contigTotal = true;
  for (const [did, list] of par) {
    list.sort((a,b)=>a-b);
    const contig = (list[list.length-1] - list[0] + 1) === list.length;
    if (!contig) contigTotal = false;
    const d: any = byId.get(did);
    console.log(`${d.code} ${String(d.name).padEnd(22)} villes=${String(list.length).padStart(4)} min=${list[0]} max=${list[list.length-1]} contigu=${contig}`);
  }
  console.log("\ntous contigus :", contigTotal);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
