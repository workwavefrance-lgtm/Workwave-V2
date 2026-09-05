/** MESURE 18 : a quoi ressemble un listing servi avec 1 seul pro ouvert,
 *  compare a un listing dense ? Et combien d'URL cat x ville le sitemap
 *  declare-t-il face aux 346 071 servies ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const BASE = "https://workwave.fr";
function texte(h:string){return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&[a-z]+;|&#\d+;/gi," ").replace(/[  ]/g," ").replace(/\s+/g," ").trim();}
function gram(t:string,n=6){const m=t.toLowerCase().split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);let c=0;for(const g of ga)if(gb.has(g))c++;return (c/Math.min(ga.size,gb.size))*100;}
(async () => {
  const acc: [string, number][] = JSON.parse(fs.readFileSync("/tmp/catville.json","utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const vs = new Map<number,string>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)vs.set(c.id,c.slug); off+=r.length;}
  const un: string[] = [], dense: string[] = [];
  for (const [k,n] of acc) {
    const [c,v]=k.split("|").map(Number); const a=cs.get(c), b=vs.get(v); if(!a||!b) continue;
    if (n===1 && un.length<4) un.push(`/${a}/${b}`);
    if (n>=15 && dense.length<2) dense.push(`/${a}/${b}`);
    if (un.length>=4 && dense.length>=2) break;
  }
  console.log("url                                              HTTP   mots  fiches listees");
  const textes: Record<string,string> = {};
  for (const u of [...un, ...dense]) {
    const r = await fetch(`${BASE}${u}`, { headers:{"user-agent":"Mozilla/5.0 (compatible; workwave-audit)"}, redirect:"manual" });
    if (r.status!==200){ console.log(`${u.padEnd(48)} ${r.status}`); continue; }
    const h = await r.text(); const t = texte(h); textes[u]=t;
    const f = new Set(h.match(/href="\/artisan\/[a-z0-9-]+"/g)||[]).size;
    console.log(`${u.padEnd(48)} ${r.status}  ${String(t.split(" ").length).padStart(5)} ${String(f).padStart(8)}`);
  }
  const cles = Object.keys(textes).filter(k=>un.includes(k));
  if (cles.length>=2) console.log(`\nrecouvrement entre deux listings a 1 seul pro : ${rec(textes[cles[0]],textes[cles[1]]).toFixed(1)} %  (${cles[0]} vs ${cles[1]})`);

  // Sitemap : combien d'URL cat x ville declarees ?
  const idx = await (await fetch(`${BASE}/sitemap-index.xml`)).text();
  const subs = (idx.match(/<loc>([^<]+)<\/loc>/g)||[]).map(s=>s.replace(/<\/?loc>/g,""));
  console.log(`\nsous-sitemaps declares : ${subs.length}`);
  for (const s of subs.filter(u=>/\/sitemap\/(2|3)\.xml/.test(u))) {
    const x = await (await fetch(s)).text();
    console.log(`  ${s} : ${(x.match(/<url>/g)||[]).length} URL`);
  }
})();
