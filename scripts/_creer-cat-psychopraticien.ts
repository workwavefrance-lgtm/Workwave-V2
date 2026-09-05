/**
 * Cree la categorie "Psychopraticien" (vertical personne) et y range les
 * fiches manifestement mal classees en "Garde animaux".
 *
 * POURQUOI : le code d'activite 9609Z ("autres services personnels") est un
 * fourre-tout. 88 013 fiches sont rangees en "Garde animaux" a cause de lui,
 * dont des therapeutes. Cecile Fonlupt s'en est plainte le 17/08.
 *
 * PRUDENCE : on ne deplace QUE les fiches dont le nom dit explicitement
 * psychopraticien / psychotherapeute / psychanalyste. Un hypnotherapeute ou
 * un art-therapeute n'est PAS un psychopraticien : les deplacer serait
 * refaire l'erreur qu'on repare. Lancer avec --appliquer pour ecrire.
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const APPLIQUER = process.argv.includes("--appliquer");
const GARDE_ANIMAUX = 35;
const CECILE = { id: 3753532, slug: "cecile-fonlupt-00010" };
// Uniquement le metier exact. Volontairement etroit.
const MOTIFS = ["psychopraticien", "psychopraticienne", "psychotherap", "psycho-therap", "psychanalys"];

(async () => {
  // 1. La categorie existe-t-elle deja ?
  let { data: cat } = await sb.from("categories").select("id, slug, name").eq("slug", "psychopraticien").maybeSingle();
  if (cat) console.log("categorie deja presente :", cat.id);
  else if (!APPLIQUER) console.log("categorie a creer : psychopraticien / Psychopraticien / personne");
  else {
    const { data, error } = await sb.from("categories").insert({
      slug: "psychopraticien",
      name: "Psychopraticien",
      vertical: "personne",
      naf_codes: [],
      popularity: 50,
    }).select("id, slug, name").single();
    if (error) { console.error("ECHEC creation :", error.message); process.exit(1); }
    cat = data; console.log("categorie creee : id", cat.id);
  }

  // 2. Les fiches a deplacer
  const PAGE = 1000; let off = 0; const cibles: any[] = [];
  while (true) {
    const { data } = await sb.from("pros").select("id, name, slug, claimed_by_user_id")
      .eq("category_id", GARDE_ANIMAUX).eq("is_active", true).is("deleted_at", null)
      .range(off, off + PAGE - 1);
    const r = data || []; if (!r.length) break;
    for (const p of r) {
      const n = (p.name || "").toLowerCase();
      if (MOTIFS.some((m) => n.includes(m))) cibles.push(p);
    }
    off += r.length;
  }
  // Cecile ne se detecte pas par son nom : on l'ajoute nommement, avec garde.
  const { data: c } = await sb.from("pros").select("id, slug, name, category_id").eq("id", CECILE.id).single();
  if (!c || c.slug !== CECILE.slug) { console.error("GARDE : la fiche de Cecile ne concorde pas. Rien n'est ecrit."); process.exit(1); }
  if (c.category_id === GARDE_ANIMAUX && !cibles.some((x) => x.id === c.id)) cibles.push(c);

  console.log("\nfiches a deplacer :", cibles.length);
  for (const p of cibles.slice(0, 25)) console.log(`   ${p.claimed_by_user_id ? "[RECLAMEE] " : ""}${p.name}`);
  if (cibles.length > 25) console.log(`   ... et ${cibles.length - 25} autres`);

  const reclamees = cibles.filter((p) => p.claimed_by_user_id);
  if (reclamees.length) {
    console.log("\nATTENTION :", reclamees.length, "fiche(s) RECLAMEE(S) dans le lot.");
    console.log("Changer la categorie d'un pro abonne modifie sa visibilite. Elles sont EXCLUES.");
  }
  const aBouger = cibles.filter((p) => !p.claimed_by_user_id);

  if (!APPLIQUER) { console.log("\nSIMULATION. Relancer avec --appliquer."); return; }

  let n = 0;
  for (let i = 0; i < aBouger.length; i += 200) {
    const lot = aBouger.slice(i, i + 200).map((p) => p.id);
    const { error, count } = await sb.from("pros").update({ category_id: cat!.id }, { count: "exact" }).in("id", lot);
    if (error) { console.error("ECHEC deplacement :", error.message); process.exit(1); }
    n += count || 0;
  }
  console.log("\ndeplacees :", n);

  // 3. CONTROLE FINAL en base (Regle 4)
  const { count: apres } = await sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", cat!.id);
  const { data: v } = await sb.from("pros").select("slug, category:categories(name,slug)").eq("id", CECILE.id).single();
  console.log("fiches dans la nouvelle categorie :", apres);
  console.log("fiche de Cecile verifiee :", (v as any)?.category?.name, `(${(v as any)?.category?.slug})`);
})();
