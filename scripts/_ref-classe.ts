import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";

(async () => {
  const sb = getServiceClient();
  const cats: any[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("categories").select("slug,vertical").range(off, off + 999);
    const rows = data || []; if (!rows.length) break; cats.push(...rows); off += rows.length;
  }
  const btp = new Set(cats.filter(c => c.vertical !== "tech").map(c => c.slug));
  console.log("categories non-tech:", btp.size, "/ total", cats.length);

  const all = JSON.parse(fs.readFileSync("/tmp/gsc-pages.json", "utf8"));
  let villes = 0, depts = 0, impVille = 0, clicVille = 0;
  const listing: any[] = [];
  for (const r of all) {
    const u = new URL(r.keys[0]);
    const seg = u.pathname.replace(/^\/|\/$/g, "").split("/");
    if (seg.length !== 2) continue;
    if (!btp.has(seg[0])) continue;
    const isDept = /-\d{2,3}$/.test(seg[1]);
    if (isDept) { depts++; continue; }
    villes++; impVille += r.impressions; clicVille += r.clicks;
    listing.push({ url: r.keys[0], imp: r.impressions, clics: r.clicks, pos: r.position });
  }
  console.log(`pages /[metier]/[ville] avec impressions : ${villes}  (impressions ${impVille}, clics ${clicVille})`);
  console.log(`pages /[metier]/[dept-NN] avec impressions : ${depts}`);
  // pool position 1-3
  const p13 = listing.filter(r => r.pos <= 3.5);
  console.log(`  dont position moyenne <= 3.5 : ${p13.length} pages, ${p13.reduce((s,r)=>s+r.imp,0)} impressions, ${p13.reduce((s,r)=>s+r.clics,0)} clics`);
  const p110 = listing.filter(r => r.pos <= 10.5);
  console.log(`  dont position moyenne <= 10.5 : ${p110.length} pages, ${p110.reduce((s,r)=>s+r.imp,0)} impressions, ${p110.reduce((s,r)=>s+r.clics,0)} clics`);
  fs.writeFileSync("/tmp/listing-villes.json", JSON.stringify(listing));
})();
