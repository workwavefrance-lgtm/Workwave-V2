import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function pairs(deptCode: string, catIds: number[], ordered: boolean) {
  const { data: dep } = await sb.from("departments").select("id,name").eq("code", deptCode).single();
  const cities: any[] = []; let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id,slug").eq("department_id",(dep as any).id).order("id").range(off, off+999);
    const r = data||[]; if(!r.length) break; cities.push(...r); off += r.length;
  }
  const cityIds = cities.map(c=>c.id);
  const open = new Map<string,number>(), closed = new Map<string,number>();
  let o = 0, rowsSeen = 0; const seenIds = new Set<number>();
  while (true) {
    let q = sb.from("pros").select("id,city_id,category_id,etat_admin")
      .eq("is_active",true).is("deleted_at",null).in("city_id",cityIds).in("category_id",catIds);
    if (ordered) q = q.order("id");
    const { data, error } = await q.range(o, o+999);
    if (error) { console.log("ERR", error.message.slice(0,70)); break; }
    const rows = (data||[]) as any[]; if (!rows.length) break;
    for (const r of rows) {
      rowsSeen++; seenIds.add(r.id);
      const k = `${r.category_id}-${r.city_id}`;
      if (r.etat_admin === "F") closed.set(k,(closed.get(k)||0)+1); else open.set(k,(open.get(k)||0)+1);
    }
    o += rows.length;
  }
  const all = new Set([...open.keys(), ...closed.keys()]);
  let zero = 0, totO = 0, totC = 0;
  for (const k of all) { const a=open.get(k)||0,b=closed.get(k)||0; totO+=a; totC+=b; if(a===0&&b>0) zero++; }
  return { name:(dep as any).name, communes:cities.length, totO, totC, pairsN:all.size, zero,
           pct:100*zero/Math.max(all.size,1), rowsSeen, distinct:seenIds.size };
}

(async () => {
  const { data: cats } = await sb.from("categories").select("id").in("vertical",["btp","domicile","personne"]);
  const catIds = (cats||[]).map((c:any)=>c.id);
  console.log("categories BTP/domicile/personne :", catIds.length, "\n");
  for (const code of ["86","13","48"]) {
    const ord = await pairs(code, catIds, true);
    const uno = await pairs(code, catIds, false);
    console.log(`dept ${code} (${ord.name}) ${ord.communes} communes`);
    console.log(`  AVEC order(id) : ${ord.totO} ouverts / ${ord.totC} fermes | couples ${ord.pairsN} | 0-ouvert+ferme ${ord.zero} (${ord.pct.toFixed(1)}%) | lignes lues ${ord.rowsSeen} distinctes ${ord.distinct}`);
    console.log(`  SANS order     : ${uno.totO} ouverts / ${uno.totC} fermes | couples ${uno.pairsN} | 0-ouvert+ferme ${uno.zero} (${uno.pct.toFixed(1)}%) | lignes lues ${uno.rowsSeen} distinctes ${uno.distinct}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
