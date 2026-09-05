/** Que crawle reellement Googlebot parmi les listings metier x ville ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const acc: [string,number][] = JSON.parse(fs.readFileSync("/tmp/ref-catville.json","utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const vs = new Map<number,string>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)vs.set(c.id,c.slug); off+=r.length;}
  const nPros = new Map<string,number>();
  for (const [k,n] of acc) { const [a,b]=k.split("|").map(Number); const A=cs.get(a),B=vs.get(b);
    if(A&&B) nPros.set(`/${A}/${B}`, n); }
  const metiers = new Set([...cs.values()]);

  const lignes = fs.readFileSync("/tmp/gbot_seg2.txt","utf8").split("\n").filter(l=>l.includes("\t"));
  let artisan=0, listing=0, autre=0;
  const tr: Record<string,{pages:number;hits:number}> = {"1 pro":{pages:0,hits:0},"2 pros":{pages:0,hits:0},"3-9 pros":{pages:0,hits:0},"10+ pros":{pages:0,hits:0},"0 pro (redirige)":{pages:0,hits:0}};
  for (const l of lignes) {
    const [p,c] = l.split("\t"); const h = Number(c)||1;
    const seg = p.split("/").filter(Boolean);
    if (seg[0]==="artisan") { artisan+=h; continue; }
    if (!metiers.has(seg[0])) { autre+=h; continue; }
    listing+=h;
    const n = nPros.get(p);
    const k = n===undefined?"0 pro (redirige)":n===1?"1 pro":n===2?"2 pros":n<10?"3-9 pros":"10+ pros";
    tr[k].pages++; tr[k].hits+=h;
  }
  console.log(`Googlebot 04/09, chemins a 2 segments : /artisan/ = ${artisan} hits · listings metier x ville = ${listing} hits · autre = ${autre} hits`);
  console.log("\nrepartition des passages Googlebot sur les listings :");
  for (const [k,v] of Object.entries(tr)) console.log(`  ${k.padEnd(18)} ${String(v.pages).padStart(5)} pages distinctes · ${String(v.hits).padStart(5)} passages`);
  const cible = tr["1 pro"].pages + tr["2 pros"].pages;
  console.log(`\npages a 1-2 pros crawlees ce jour-la : ${cible} sur 262 620 servies (${((cible/262620)*100).toFixed(4)} %)`);
  console.log(`a ce rythme, un passage sur chacune : ${(262620/Math.max(cible,1)/365).toFixed(1)} ans`);
})();
