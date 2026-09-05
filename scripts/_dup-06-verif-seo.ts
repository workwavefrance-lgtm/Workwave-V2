import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  // (a) verifier que Poitiers a du contenu redactionnel et Bordeaux non
  for (const [m, v] of [["plombier","poitiers"],["plombier","chatellerault"],["electricien","bordeaux"],["couvreur","nantes"],["peintre","lille"]]) {
    const { data: c } = await sb.from("categories").select("id").eq("slug", m).limit(1);
    const { data: ci } = await sb.from("cities").select("id").eq("slug", v).limit(1);
    if (!c?.[0] || !ci?.[0]) { console.log(`${m}/${v} : introuvable`); continue; }
    const { data: sp } = await sb.from("seo_pages").select("id,content")
      .eq("category_id", c[0].id).eq("city_id", ci[0].id).limit(1);
    const n = sp?.[0]?.content ? String(sp[0].content).length : 0;
    console.log(`${m}/${v} : seo_pages.content = ${n ? n + " caracteres" : "AUCUN (sections programmatiques)"}`);
  }
  // (b) cat x departement : distribution du nombre de pros ouverts
  const acc: [string, number][] = JSON.parse(fs.readFileSync("/tmp/catville.json", "utf8"));
  const villeDept = new Map<number, number>();
  let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id,department_id").range(off, off + 999);
    const r = (data || []) as any[]; if (r.length === 0) break;
    for (const c of r) villeDept.set(c.id, c.department_id);
    off += r.length;
  }
  const catDept = new Map<string, number>();
  let sansVille = 0;
  for (const [k, n] of acc) {
    const [cat, ville] = k.split("|");
    const d = villeDept.get(Number(ville));
    if (d === undefined) { sansVille += n; continue; }
    const key = `${cat}|${d}`; catDept.set(key, (catDept.get(key) || 0) + n);
  }
  console.log(`\ncommunes chargees : ${villeDept.size} · pros sans commune connue : ${sansVille}`);
  console.log(`couples (metier, departement) avec >=1 pro ouvert : ${catDept.size}`);
  const seuils = [1,2,3,5,10,20];
  for (const s of seuils) {
    let n = 0; for (const v of catDept.values()) if (v <= s) n++;
    console.log(`  ${String(n).padStart(5)} couples metier x dept avec <= ${s} pro(s) ouvert(s)  (${((n/catDept.size)*100).toFixed(1)} %)`);
  }
})();
