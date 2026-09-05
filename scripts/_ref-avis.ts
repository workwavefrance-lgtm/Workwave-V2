import fs from "fs";
const out:any[] = JSON.parse(fs.readFileSync("/tmp/desc-out.json","utf8"));
const sel = out.filter(x=>x.n!=null).slice(0,140);
async function one(x:any) {
  try {
    const r = await fetch("https://workwave.fr"+x.p,{headers:{"user-agent":"Mozilla/5.0 (audit interne workwave)"}});
    const h = await r.text();
    const avis = (h.match(/avis Google/g)||[]).length;
    return { ...x, avis };
  } catch { return { ...x, avis: -1 }; }
}
async function main(){
  const res:any[]=[];
  for(let i=0;i<sel.length;i+=8){ res.push(...await Promise.all(sel.slice(i,i+8).map(one))); process.stderr.write("."); }
  process.stderr.write("\n");
  const ok = res.filter(x=>x.avis>=0);
  const imp=(a:any[])=>a.reduce((s,x)=>s+x.i,0);
  const avecAvis = ok.filter(x=>x.avis>0);
  console.log(`Echantillon ${ok.length} pages listing (les plus vues), ${imp(ok)} impressions sur 28 j`);
  console.log(`Pages affichant AU MOINS un avis Google : ${avecAvis.length}/${ok.length} = ${(100*avecAvis.length/ok.length).toFixed(1)}% des pages`);
  console.log(`  -> pondere par les impressions : ${imp(avecAvis)}/${imp(ok)} = ${(100*imp(avecAvis)/imp(ok)).toFixed(1)}% des impressions`);
  const un = ok.filter(x=>x.n===1), multi = ok.filter(x=>x.n>=2);
  const p=(a:any[])=>a.length? `${a.filter(x=>x.avis>0).length}/${a.length} pages (${(100*imp(a.filter(x=>x.avis>0))/(imp(a)||1)).toFixed(1)}% des imp du groupe)`:"-";
  console.log(`  dont pages a 1 pro   : ${p(un)}`);
  console.log(`  dont pages >=2 pros  : ${p(multi)}`);
}
main();
