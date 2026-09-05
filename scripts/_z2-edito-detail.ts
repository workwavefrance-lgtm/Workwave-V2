import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PAGE = 1000;
async function all<T>(table: string, cols: string, f?: (q:any)=>any): Promise<T[]> {
  const out: T[] = []; let offset = 0;
  while (true) {
    let q: any = sb.from(table).select(cols).order("id").range(offset, offset+PAGE-1);
    if (f) q = f(q);
    const { data, error } = await q;
    if (error) { console.log("ERR", table, error.message.slice(0,90)); break; }
    const rows = (data||[]) as T[];
    if (rows.length === 0) break;
    out.push(...rows); offset += rows.length;
  }
  return out;
}
(async () => {
  // blog_queue statuts (paginé)
  const bq = await all<{status:string}>("blog_queue","id,status");
  const mq = new Map<string,number>(); for (const r of bq) mq.set(r.status,(mq.get(r.status)||0)+1);
  console.log("blog_queue total:", bq.length, "->", [...mq].map(([k,v])=>`${k}=${v}`).join(" "));

  // categories
  const cats = await all<{id:number;slug:string;vertical:string;name:string}>("categories","id,slug,vertical,name");
  const btp = cats.filter(c=>["btp","domicile","personne"].includes(c.vertical));
  console.log("categories BTP/domicile/personne:", btp.length, "| tech:", cats.length-btp.length);

  // seo_guides
  const guides = await all<{slug:string;category_id:number}>("seo_guides","id,slug,category_id");
  const gslugs = new Set(guides.map(g=>g.slug));
  const sansGuide = btp.filter(c=>!gslugs.has(c.slug));
  console.log("seo_guides:", guides.length, "| categories BTP sans guide:", sansGuide.length);
  console.log("  sans guide:", sansGuide.map(c=>c.slug).join(", "));
  const guidesOrphelins = guides.filter(g=>!btp.some(c=>c.slug===g.slug));
  console.log("  guides dont le slug ne correspond a aucune categorie BTP:", guidesOrphelins.map(g=>g.slug).join(", ") || "aucun");

  // price_guides scope metier
  const pgm = await all<{slug:string;metier_slug:string|null;scope:string;univers:string|null}>("price_guides","id,slug,metier_slug,scope,univers", q=>q.eq("status","published"));
  const metierScoped = pgm.filter(p=>p.scope==="metier");
  console.log("\nprice_guides scope=metier:", metierScoped.length, "| metier_slug null:", metierScoped.filter(p=>!p.metier_slug).length);
  const covered = new Set(metierScoped.map(p=>p.metier_slug));
  const btpSansPrix = btp.filter(c=>!covered.has(c.slug));
  console.log("categories BTP sans guide /prix:", btpSansPrix.length, "->", btpSansPrix.map(c=>c.slug).join(", "));
  // prestation par metier
  const prest = pgm.filter(p=>p.scope==="prestation");
  const parMetier = new Map<string,number>(); for (const p of prest) parMetier.set(p.metier_slug||"(null)",(parMetier.get(p.metier_slug||"(null)")||0)+1);
  console.log("prestations metier_slug null:", parMetier.get("(null)")||0);
  console.log("metiers couverts par >=1 prestation:", [...parMetier.keys()].filter(k=>k!=="(null)").length);
  // slugs dupliques -> URL identique
  const urls = pgm.map(p=> p.scope==="metier"&&p.metier_slug ? `/${p.metier_slug}/prix` : `/guide-des-prix/${p.slug}`);
  console.log("price_guides publies:", pgm.length, "| URLs distinctes:", new Set(urls).size);
  const dup = new Map<string,number>(); for (const u of urls) dup.set(u,(dup.get(u)||0)+1);
  console.log("URLs en doublon:", [...dup].filter(([,n])=>n>1).map(([u,n])=>`${u} x${n}`).join(" | ") || "aucune");
})();
