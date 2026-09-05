import fs from "fs";
const out:any[] = JSON.parse(fs.readFileSync("/tmp/desc-out.json","utf8"));
const g = (f:(x:any)=>boolean, nom:string) => {
  const a = out.filter(x=>x.status===200).filter(f);
  const i = a.reduce((s,x)=>s+x.i,0), c = a.reduce((s,x)=>s+x.c,0);
  // position moyenne ponderee par impressions
  const pos = a.reduce((s,x)=>s+(x.pos||0)*x.i,0)/ (i||1);
  console.log(`${nom.padEnd(22)} ${String(a.length).padStart(3)} pages | ${String(i).padStart(5)} imp | ${String(c).padStart(4)} clics | CTR ${(100*c/(i||1)).toFixed(2).padStart(5)}% | pos moy ${pos.toFixed(1)}`);
};
console.log("=== CTR et position par nombre de pros annonce dans la meta (top 300 pages listing, 07/08-03/09) ===");
g(x=>x.n===1, "1 pro (meta CASSEE)");
g(x=>x.n===2, "2 pros");
g(x=>x.n!=null&&x.n>=3&&x.n<=9, "3 a 9 pros");
g(x=>x.n!=null&&x.n>=10, ">=10 pros");
console.log("\n=== meme chose en ne gardant que les pages en position <= 20 (ou le CTR a un sens) ===");
g(x=>x.n===1 && (x.pos||99)<=20, "1 pro (meta CASSEE)");
g(x=>x.n===2 && (x.pos||99)<=20, "2 pros");
g(x=>x.n!=null&&x.n>=3 && (x.pos||99)<=20, ">=3 pros");
