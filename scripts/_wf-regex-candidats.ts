import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

// source (categorie absorbante) -> cible (categorie absorbee), motif sur le nom
const REGLES: { naf: string; src: [number,string]; cible: [number,string]; motifs: string[] }[] = [
  { naf:"4332B", src:[5,"menuisier"],    cible:[11,"serrurier"],  motifs:["serrur"] },
  { naf:"4332B", src:[5,"menuisier"],    cible:[37,"vitrier"],    motifs:["vitr","miroit"] },
  { naf:"4334Z", src:[4,"peintre"],      cible:[37,"vitrier"],    motifs:["vitr","miroit"] },
  { naf:"4322B", src:[12,"chauffagiste"],cible:[13,"climaticien"],motifs:["clim","froid"] },
  { naf:"4322B", src:[12,"chauffagiste"],cible:[38,"ramoneur"],   motifs:["ramon"] },
  { naf:"4329B", src:[36,"pisciniste"],  cible:[199,"ascensoriste"], motifs:["ascenseur","ascensor","monte-charge"] },
  { naf:"4332A", src:[5,"menuisier"],    cible:[41,"cuisiniste"], motifs:["cuisin"] },
  { naf:"4321A", src:[2,"electricien"],  cible:[39,"videosurveillance-installateur"], motifs:["videosurveillance","video surveillance","telesurveillance"] },
  { naf:"4399A", src:[10,"facadier"],    cible:[36,"pisciniste"], motifs:["piscin"] },
];

async function compte(catId: number, naf: string, motif?: string): Promise<number> {
  let q = sb.from("pros").select("id",{count:"exact",head:true})
    .eq("category_id", catId).eq("naf_code", naf)
    .eq("is_active", true).is("deleted_at", null)
    .or("etat_admin.is.null,etat_admin.neq.F");
  if (motif) q = q.ilike("name", `%${motif}%`);
  for (let essai=0; essai<4; essai++) {
    const { count, error } = await q;
    if (!error && count !== null) return count;
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error(`${catId}/${naf}/${motif ?? "-"} : comptage impossible`);
}

async function main() {
  console.log("France entiere, fiches OUVERTES portant le NAF partage, dans la categorie absorbante\n");
  for (const r of REGLES) {
    const socle = await compte(r.src[0], r.naf);
    let cand = 0;
    for (const m of r.motifs) cand += await compte(r.src[0], r.naf, m);
    console.log(`${r.naf}  ${r.src[1].padEnd(14)} -> ${r.cible[1].padEnd(30)} motif(${r.motifs.join("|")})  socle=${String(socle).padStart(7)}  candidats=${String(cand).padStart(6)}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message||e);process.exit(1);});
