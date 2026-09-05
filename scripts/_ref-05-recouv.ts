/** Recouvrement entre listings : voisins (meme metier, communes a 1 pro)
 *  ET temoin sans rapport (metier different, commune eloignee) = plancher gabarit. */
function texte(h:string){return h.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&[a-z]+;|&#\d+;/gi," ").replace(/\s+/g," ").trim();}
function gram(t:string,n=6){const m=t.toLowerCase().split(" ").filter(Boolean);const s=new Set<string>();
  for(let i=0;i+n<=m.length;i++)s.add(m.slice(i,i+n).join(" "));return s;}
function rec(a:string,b:string){const ga=gram(a),gb=gram(b);let c=0;for(const g of ga)if(gb.has(g))c++;return (c/Math.min(ga.size,gb.size))*100;}
(async()=>{
  const urls=["/plombier/bonnes","/plombier/liglet","/plombier/poitiers",
              "/couvreur/bonnes","/paysagiste/liglet","/menage/bonnes"];
  const T:Record<string,string>={};
  for(const u of urls){
    const r=await fetch(`https://workwave.fr${u}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; audit)"}});
    const h=await r.text(); T[u]=texte(h);
    const facts=/Prix au m|revenu m|Revenu m|vacan|habitants\/km|densit/i.test(h);
    console.log(`${u.padEnd(24)} HTTP ${r.status} · ${T[u].split(" ").length} mots · bloc faits commune present : ${facts?"OUI":"non"}`);
  }
  console.log("\nrecouvrement en 6-grammes :");
  const paires:[string,string,string][]=[
    ["voisins meme metier, 2 communes a 1 pro","/plombier/bonnes","/plombier/liglet"],
    ["meme commune, 2 metiers differents","/plombier/bonnes","/couvreur/bonnes"],
    ["TEMOIN : metier ET commune differents","/plombier/bonnes","/paysagiste/liglet"],
    ["TEMOIN 2 : vertical different","/plombier/bonnes","/menage/bonnes"],
    ["1 pro vs 10 pros, meme metier","/plombier/bonnes","/plombier/poitiers"],
  ];
  for(const [lab,a,b] of paires) console.log(`  ${lab.padEnd(42)} ${rec(T[a],T[b]).toFixed(1)} %`);
})();
