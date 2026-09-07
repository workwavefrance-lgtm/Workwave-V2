/**
 * Genere lib/data/home-links.ts : pour CHAQUE categorie, un departement qui a
 * REELLEMENT des professionnels ouverts.
 *
 * POURQUOI. La page d'accueil choisissait le departement par simple rotation,
 * sans verifier qu'il y avait quelqu'un dedans. Mesure du 06/09/2026 : elle
 * renvoyait vers /montage-meubles/calvados-14, /coach-sportif/bouches-du-rhone-13
 * et /cours-musique/cantal-15, TROIS PAGES VIDES, alors que 13 categories du
 * site n'ont aucun professionnel. Notre page la plus visitee par Google
 * l'envoyait dans des impasses, au moment ou il juge la qualite du site.
 *
 * Une categorie sans aucun professionnel n'a PAS de departement : la page
 * d'accueil pointe alors vers la page racine du metier, jamais vers un couple
 * metier x departement vide.
 *
 * A REGENERER apres tout scrape ou reclassement :
 *   npx tsx scripts/build-home-links.ts
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { generateDepartmentSlug } from "../lib/utils/slugs";
import fs from "fs";

const sb = getServiceClient();
const MINIMUM = 3; // en dessous, la page n'a rien a montrer

(async () => {
  const { data: cats, error: e1 } = await sb.from("categories")
    .select("id, slug, vertical").in("vertical", ["btp", "domicile", "personne"]).order("id");
  if (e1) throw new Error(`categories : ${e1.message}`);
  const { data: depts, error: e2 } = await sb.from("departments").select("id, code, name, country").order("code");
  if (e2) throw new Error(`departments : ${e2.message}`);

  // Un seul passage : pour chaque categorie, on prend les departements dans un
  // ordre stable et on garde le PREMIER qui depasse le minimum. On repartit en
  // decalant le point de depart d'une categorie a l'autre, pour ne pas envoyer
  // tout le maillage de la home vers le meme departement.
  const sortie: Record<string, string | null> = {};
  let depart = 0;
  for (const c of cats || []) {
    let choisi: string | null = null;
    for (let k = 0; k < (depts || []).length && !choisi; k++) {
      const d: any = (depts || [])[(depart + k) % (depts || []).length];
      const { count, error } = await sb.from("pros")
        .select("id, cities!inner(department_id)", { count: "exact", head: true })
        .eq("category_id", c.id).eq("cities.department_id", d.id)
        .eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A");
      // Un comptage nul est une ERREUR, pas un zero : on passe au suivant sans
      // conclure que le departement est vide.
      if (error || count === null) continue;
      if (count >= MINIMUM) choisi = generateDepartmentSlug(d);
    }
    sortie[c.slug] = choisi;
    depart = (depart + 7) % Math.max(1, (depts || []).length);
    console.log(`  ${c.slug.padEnd(30)} ${choisi ?? "AUCUN departement, lien vers la page racine"}`);
  }

  const vides = Object.entries(sortie).filter(([, v]) => v === null).map(([k]) => k);
  const contenu = `/**
 * Genere par scripts/build-home-links.ts. NE PAS editer a la main.
 *
 * Pour chaque categorie, un departement qui a au moins ${MINIMUM} professionnels
 * OUVERTS. \`null\` quand la categorie n'en a nulle part : la page d'accueil
 * pointe alors vers la page racine du metier, jamais vers une page vide.
 *
 * Pourquoi ce fichier existe : le 06/09/2026, l'accueil renvoyait vers
 * /montage-meubles/calvados-14, /coach-sportif/bouches-du-rhone-13 et
 * /cours-musique/cantal-15, trois pages vides, parce qu'il choisissait le
 * departement par simple rotation sans verifier qu'il y avait quelqu'un.
 *
 * ${vides.length} categorie(s) sans aucun departement fourni :
 * ${vides.join(", ") || "aucune"}
 */
export const DEPT_PAR_CATEGORIE: Record<string, string | null> = ${JSON.stringify(sortie, null, 2)};
`;
  fs.writeFileSync("lib/data/home-links.ts", contenu);
  console.log(`\n  ecrit lib/data/home-links.ts · ${Object.keys(sortie).length} categories · ${vides.length} sans departement`);
})();
