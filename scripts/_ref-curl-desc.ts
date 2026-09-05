import fs from "fs";
const pages: {p:string;i:number;c:number}[] = JSON.parse(fs.readFileSync("/tmp/listing-pages.json","utf8"));
const TOP = 300;
const sel = pages.slice(0, TOP);
async function one(x:any) {
  try {
    const r = await fetch("https://workwave.fr"+x.p, { headers: { "user-agent": "Mozilla/5.0 (audit interne workwave)" } });
    const html = await r.text();
    const m = html.match(/<meta name="description" content="([^"]*)"/);
    const desc = m ? m[1] : "";
    const n = desc.match(/Comparez les (\d+) /);
    return { ...x, status: r.status, n: n ? parseInt(n[1]) : null, vide: /^Trouvez /.test(desc), desc };
  } catch (e:any) { return { ...x, status: 0, n: null, err: e.message }; }
}
async function main() {
  const out:any[] = [];
  const CONC = 12;
  for (let i=0;i<sel.length;i+=CONC) {
    out.push(...await Promise.all(sel.slice(i,i+CONC).map(one)));
    process.stderr.write(".");
  }
  process.stderr.write("\n");
  const tot = (a:any[],k:string)=>a.reduce((s,x)=>s+(x[k]||0),0);
  const impTop = tot(out,"i"), cliTop = tot(out,"c");
  const impAll = tot(pages,"i"), cliAll = tot(pages,"c");
  console.log(`Top ${TOP} pages listing : ${impTop} imp (${(100*impTop/impAll).toFixed(1)}% des ${impAll} imp listing), ${cliTop} clics (${(100*cliTop/cliAll).toFixed(1)}% des ${cliAll})`);
  const un = out.filter(x=>x.n===1);
  const deux = out.filter(x=>x.n===2);
  const trois = out.filter(x=>x.n!=null && x.n>=3);
  const vide = out.filter(x=>x.vide);
  const autre = out.filter(x=>x.n==null && !x.vide);
  const l=(nom:string,a:any[])=>console.log(`${nom.padEnd(28)} ${String(a.length).padStart(4)} pages | ${String(tot(a,"i")).padStart(5)} imp (${(100*tot(a,"i")/impTop).toFixed(1)}%) | ${String(tot(a,"c")).padStart(4)} clics (${(100*tot(a,"c")/cliTop).toFixed(1)}%)`);
  l("desc 'les 1' (CASSE)", un);
  l("desc 'les 2'", deux);
  l("desc 'les >=3'", trois);
  l("desc 'Trouvez' (0 pro)", vide);
  l("autre (redirect/404/...)", autre);
  console.log("\nStatuts :", JSON.stringify(out.reduce((a:any,x)=>{a[x.status]=(a[x.status]||0)+1;return a;},{})));
  console.log("\n--- pages a 1 pro les plus vues ---");
  un.sort((a,b)=>b.i-a.i);
  for (const x of un.slice(0,12)) console.log(`imp ${String(x.i).padStart(4)} clics ${String(x.c).padStart(3)} ${x.p}`);
  fs.writeFileSync("/tmp/desc-out.json", JSON.stringify(out));
}
main();
