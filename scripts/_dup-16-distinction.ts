/** MESURE 14 : POUVOIR DE DISTINCTION des donnees disponibles.
 *  Sur des groupes reels de voisins (meme metier, meme commune), combien de
 *  valeurs DISTINCTES chaque colonne produit-elle ? Une colonne qui donne la
 *  meme valeur a tout le monde ajoute du texte commun, donc du doublon. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  // 1) distribution globale de effectif_range sur les fiches ouvertes
  const MAXID = 4_600_000, T = 40;
  const dist = new Map<string, number>(); let n = 0;
  const groupes = new Map<string, any[]>();
  for (let t = 0; t < T; t++) {
    const { data } = await sb.from("pros").select("id,city_id,category_id,effectif_range,address,founding_date,naf_code,forme_juridique,siret")
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F")
      .gt("id", Math.floor((MAXID / T) * t)).order("id").limit(250);
    for (const r of (data || []) as any[]) {
      n++; const k = r.effectif_range ?? "(vide)"; dist.set(k, (dist.get(k) || 0) + 1);
      const g = `${r.city_id}|${r.category_id}`; if (!groupes.has(g)) groupes.set(g, []); groupes.get(g)!.push(r);
    }
  }
  console.log(`fiches ouvertes echantillonnees : ${n}\n`);
  console.log("distribution de effectif_range :");
  [...dist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10)
    .forEach(([k,v]) => console.log(`   ${((v/n)*100).toFixed(1).padStart(5)} %  ${k}`));

  // 2) pouvoir de distinction dans un vrai groupe de voisins
  const gros = [...groupes.entries()].filter(([,a]) => a.length >= 8).sort((a,b)=>b[1].length-a[1].length).slice(0, 6);
  console.log(`\npouvoir de distinction dans un groupe de voisins (meme metier, meme commune) :`);
  console.log("groupe        n   effectif  adresse  date_creation  naf  forme  siret");
  const cols = ["effectif_range","address","founding_date","naf_code","forme_juridique","siret"];
  const somme: Record<string, number> = {}; cols.forEach(c => somme[c] = 0); let gn = 0, tot = 0;
  for (const [k, arr] of gros) {
    const d = cols.map(c => new Set(arr.map((r:any) => r[c] ?? "(vide)")).size);
    cols.forEach((c,i) => somme[c] += d[i]); gn++; tot += arr.length;
    console.log(`${k.padEnd(13)} ${String(arr.length).padStart(2)}   ${d.map(x=>String(x).padStart(6)).join("  ")}`);
  }
  console.log(`\nmoyenne de valeurs distinctes par groupe de ${(tot/gn).toFixed(1)} voisins :`);
  cols.forEach(c => console.log(`   ${(somme[c]/gn).toFixed(1).padStart(5)}  ${c}`));
})();
