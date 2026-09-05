import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const CIBLES: [number,string][] = [[199,"ascensoriste"],[37,"vitrier"],[11,"serrurier"],[13,"climaticien"],[39,"videosurveillance-installateur"],[41,"cuisiniste"]];

async function main() {
  const { data: deps } = await sb.from("departments").select("id, code, name").eq("country","FR").order("code");
  const depList = deps as any[];
  const ids = depList.map(d=>d.id);
  const all: any[] = []; let offset = 0;
  while (true) { const { data } = await sb.from("cities").select("id, department_id").in("department_id", ids.slice(0,0)).limit(1); break; }
  // charger les villes dept par dept (in() plafonne, on pagine globalement sur country FR)
  const villes: any[] = []; offset = 0;
  while (true) {
    const { data, error } = await sb.from("cities").select("id, department_id").eq("country","FR").order("id").range(offset, offset+999);
    if (error) throw error;
    const rows = data || []; if (!rows.length) break; villes.push(...rows); offset += rows.length;
  }
  const par = new Map<number, number[]>();
  for (const c of villes) { if (c.department_id == null) continue; if (!par.has(c.department_id)) par.set(c.department_id, []); par.get(c.department_id)!.push(c.id); }
  console.log("depts FR :", depList.length, "| villes FR :", villes.length);

  for (const [catId, slug] of CIBLES) {
    const vides: string[] = []; let totalOuv = 0; let couverts = 0;
    for (const d of depList) {
      const list = (par.get(d.id) || []).sort((a,b)=>a-b);
      if (!list.length) { vides.push(d.code); continue; }
      const contig = (list[list.length-1]-list[0]+1) === list.length;
      const base = () => sb.from("pros").select("id",{count:"exact",head:true})
        .eq("category_id", catId).eq("is_active", true).is("deleted_at", null)
        .or("etat_admin.is.null,etat_admin.neq.F");
      let count = 0;
      const morceaux: (()=>any)[] = [];
      if (contig) morceaux.push(() => base().gte("city_id", list[0]).lte("city_id", list[list.length-1]));
      else for (let i=0;i<list.length;i+=100) { const bout = list.slice(i,i+100); morceaux.push(() => base().in("city_id", bout)); }
      for (const m of morceaux) {
        let r: any = null;
        for (let essai=0; essai<3; essai++) {
          r = await m();
          if (!r.error && r.count !== null) break;
          await new Promise(res => setTimeout(res, 1500));
        }
        if (r.error) throw new Error(`${slug}/${d.code} ${r.error.message || JSON.stringify(r.error)}`);
        if (r.count === null) throw new Error(`${slug}/${d.code} count NULL`);
        count += r.count;
      }
      totalOuv += count;
      if (count === 0) vides.push(d.code); else couverts++;
    }
    console.log(`${slug.padEnd(32)} ouverts=${String(totalOuv).padStart(6)}  depts couverts=${String(couverts).padStart(3)}/${depList.length}  pages dept VIDES=${String(vides.length).padStart(3)}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message||e);process.exit(1);});
