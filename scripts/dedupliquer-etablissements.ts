/**
 * Une seule fiche par entreprise et par commune.
 *
 * LE PROBLEME, MESURE LE 18/08/2026. L'INSEE recense un etablissement par
 * service : le centre d'action sociale de Chatellerault en comptait 13, dont
 * 5 a la meme adresse. On publiait une page par etablissement, soit
 * 122 447 pages qui decrivent la MEME entreprise dans la MEME commune.
 * Google y voit du contenu duplique et refuse d'indexer (218 870 pages en
 * "exploree, actuellement non indexee" au 14/08).
 *
 * CE QUI EST GARDE, dans cet ordre :
 *   1. toute fiche RECLAMEE par un professionnel : jamais supprimee, quoi
 *      qu'il arrive. Si plusieurs sont reclamees, toutes sont gardees.
 *   2. a defaut, la fiche la plus RICHE (description, coordonnees, photos,
 *      RGE, note Google, anciennete).
 *   3. a egalite, le plus petit numero d'etablissement, qui correspond en
 *      general au siege.
 *
 * CE QUI ARRIVE AUX AUTRES : is_active = false et deleted_at horodate. Les
 * donnees restent en base (ce n'est PAS une suppression RGPD, on ne touche
 * ni aux coordonnees ni a do_not_contact). La page renvoie une redirection
 * permanente vers la fiche conservee, via getFicheRemplacante.
 *
 * DEUX ETABLISSEMENTS DANS DEUX COMMUNES DIFFERENTES restent deux pages :
 * ce sont deux zones d'intervention, la distinction est legitime.
 *
 * Usage :
 *   npx tsx scripts/dedupliquer-etablissements.ts              (simulation)
 *   npx tsx scripts/dedupliquer-etablissements.ts --appliquer
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const APPLIQUER = process.argv.includes("--appliquer");

type Fiche = {
  id: number;
  slug: string;
  siret: string;
  city_id: number | null;
  claimed_by_user_id: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  photos: unknown;
  rge_certified: boolean | null;
  google_rating: number | null;
  founded_year: number | null;
};

/** Plus la note est haute, plus la fiche apporte au visiteur. */
function richesse(f: Fiche): number {
  let n = 0;
  if (f.description && f.description.trim().length > 20) n += 5;
  if (f.phone) n += 3;
  if (f.email) n += 3;
  if (f.website) n += 2;
  if (Array.isArray(f.photos) && f.photos.length > 0) n += 2;
  if (f.logo_url) n += 1;
  if (f.rge_certified) n += 2;
  if (f.google_rating != null) n += 2;
  if (f.founded_year) n += 1;
  return n;
}

const nic = (f: Fiche) => parseInt(String(f.siret || "").slice(9), 10) || 99999;

(async () => {
  console.log("1. Lecture des fiches actives...");
  const PAGE = 1000;
  let dernier = 0;
  const groupes = new Map<string, Fiche[]>();
  let total = 0;

  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select(
        "id, slug, siret, city_id, claimed_by_user_id, description, phone, email, website, logo_url, photos, rge_certified, google_rating, founded_year"
      )
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("siret", "is", null)
      .not("city_id", "is", null)
      .gt("id", dernier)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (error) {
      console.error("ERREUR de lecture:", error.message);
      process.exit(1);
    }
    const rows = (data || []) as Fiche[];
    if (rows.length === 0) break;
    for (const f of rows) {
      total++;
      const cle = `${String(f.siret).slice(0, 9)}|${f.city_id}`;
      const l = groupes.get(cle);
      if (l) l.push(f);
      else groupes.set(cle, [f]);
    }
    dernier = rows[rows.length - 1].id;
    if (total % 500000 < PAGE) console.log(`   ${total.toLocaleString("fr-FR")} lues...`);
  }
  console.log(`   ${total.toLocaleString("fr-FR")} fiches, ${groupes.size.toLocaleString("fr-FR")} couples entreprise/commune\n`);

  console.log("2. Choix de la fiche conservee dans chaque groupe...");
  const aRetirer: { id: number; slug: string; versSlug: string }[] = [];
  let groupesTraites = 0;
  let gardesCarReclamees = 0;

  for (const [, l] of groupes) {
    if (l.length < 2) continue;
    groupesTraites++;
    const reclamees = l.filter((f) => f.claimed_by_user_id);
    let gardees: Fiche[];
    if (reclamees.length > 0) {
      gardees = reclamees; // aucune fiche reclamee n'est jamais retiree
      gardesCarReclamees += reclamees.length;
    } else {
      const trie = [...l].sort((a, b) => richesse(b) - richesse(a) || nic(a) - nic(b));
      gardees = [trie[0]];
    }
    const gardeeSlug = gardees[0].slug;
    const idsGardes = new Set(gardees.map((f) => f.id));
    for (const f of l) {
      if (!idsGardes.has(f.id)) aRetirer.push({ id: f.id, slug: f.slug, versSlug: gardeeSlug });
    }
  }

  console.log(`   groupes en doublon        : ${groupesTraites.toLocaleString("fr-FR")}`);
  console.log(`   fiches gardees car reclamees : ${gardesCarReclamees.toLocaleString("fr-FR")}`);
  console.log(`   FICHES A RETIRER          : ${aRetirer.length.toLocaleString("fr-FR")}\n`);

  fs.writeFileSync("/tmp/dedup-a-retirer.json", JSON.stringify(aRetirer));
  console.log("   liste ecrite dans /tmp/dedup-a-retirer.json (pour verification et retour arriere)");

  console.log("\n   apercu :");
  for (const r of aRetirer.slice(0, 5)) console.log(`      ${r.slug.slice(0, 46).padEnd(46)} -> ${r.versSlug}`);

  if (!APPLIQUER) {
    console.log("\nSIMULATION. Relancer avec --appliquer.");
    return;
  }

  console.log("\n3. Retrait...");
  const maintenant = new Date().toISOString();
  let n = 0;
  for (let i = 0; i < aRetirer.length; i += 200) {
    const lot = aRetirer.slice(i, i + 200).map((r) => r.id);
    const { error, count } = await sb
      .from("pros")
      .update({ is_active: false, deleted_at: maintenant }, { count: "exact" })
      .in("id", lot);
    if (error) {
      console.error("   ERREUR d'ecriture:", error.message);
      process.exit(1);
    }
    n += count || 0;
    if (i % 10000 === 0) console.log(`   ${n.toLocaleString("fr-FR")}/${aRetirer.length.toLocaleString("fr-FR")}`);
  }
  console.log(`\n${n.toLocaleString("fr-FR")} fiches retirees. Verifier en base avant de conclure.`);
})();
