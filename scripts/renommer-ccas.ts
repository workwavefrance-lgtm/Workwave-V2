/**
 * Donne un nom distinct a chaque centre communal d'action sociale.
 *
 * LE PROBLEME, MESURE LE 18/08/2026 : 802 fiches portent EXACTEMENT le nom
 * "CENTRE COMMUNAL D'ACTION SOCIALE", sans rien pour les distinguer. Google
 * voit 802 pages au titre identique, en garde une et ignore les autres. Les
 * suffixes "bbbb" dans les URL viennent de la : le generateur de slug n'avait
 * plus rien pour les differencier.
 *
 * LA CORRECTION : "CCAS de Poitiers" au lieu de "CENTRE COMMUNAL D'ACTION
 * SOCIALE". Chaque page devient distincte, et elle devient utile : un
 * particulier qui cherche une aide aux seniors dans sa commune a un interet
 * legitime a trouver son CCAS.
 *
 * CE QU'ON NE TOUCHE PAS
 *  - le slug, donc l'URL : la changer casserait les pages deja indexees et
 *    imposerait 25 000 redirections. Google lit le titre et le contenu, pas
 *    le slug.
 *  - les fiches deja reclamees par quelqu'un : leur nom lui appartient.
 *  - les fiches dont le nom contient DEJA la commune : elles sont deja
 *    distinctes, il n'y a rien a reparer.
 *  - les mairies, syndicats et communautes de communes : autre sujet,
 *    non valide.
 *
 * Usage :
 *   npx tsx scripts/renommer-ccas.ts              (simulation)
 *   npx tsx scripts/renommer-ccas.ts --appliquer
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const APPLIQUER = process.argv.includes("--appliquer");

/** Formes generiques d'un CCAS, sans nom de commune. */
const FORMES = [
  "%CENTRE COMMUNAL D'ACTION SOCIALE%",
  "%CENTRE COMMUNAL D ACTION SOCIALE%",
  "%CTRE COM ACTION SOCIALE%",
  "%CTRE COMMUNAL ACTION SOCIALE%",
  "%C.C.A.S%",
  "%CENTRE INTERCOMMUNAL D'ACTION SOCIALE%",
  "%CTRE INTERCOM ACTION SOCIALE%",
];

/** Enleve accents, ponctuation et espaces : sert a comparer nom et commune. */
const nu = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

(async () => {
  const ou = FORMES.map((m) => `name.ilike.${m}`).join(",");
  const PAGE = 1000;
  let dernier = 0;
  const aRenommer: { id: number; avant: string; apres: string }[] = [];
  let total = 0;
  let dejaDistincts = 0;
  let sansCommune = 0;
  let reclames = 0;

  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select("id, name, claimed_by_user_id, city:cities(name)")
      .or(ou)
      .eq("is_active", true)
      .is("deleted_at", null)
      .gt("id", dernier)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (error) {
      console.error("ERREUR de lecture:", error.message);
      process.exit(1);
    }
    const rows = data || [];
    if (rows.length === 0) break;

    for (const p of rows) {
      total++;
      const commune = (p as any).city?.name as string | undefined;
      if (p.claimed_by_user_id) { reclames++; continue; }
      if (!commune) { sansCommune++; continue; }
      // Le nom contient deja la commune : rien a reparer.
      if (nu(p.name).includes(nu(commune))) { dejaDistincts++; continue; }
      const inter = /INTERCOM/i.test(p.name);
      aRenommer.push({
        id: p.id,
        avant: p.name,
        apres: `${inter ? "CIAS" : "CCAS"} de ${commune}`,
      });
    }
    dernier = rows[rows.length - 1].id;
  }

  console.log(`centres d'action sociale trouves : ${total.toLocaleString("fr-FR")}`);
  console.log(`  deja distincts (commune dans le nom) : ${dejaDistincts.toLocaleString("fr-FR")}`);
  console.log(`  sans commune rattachee (intouchables): ${sansCommune.toLocaleString("fr-FR")}`);
  console.log(`  reclames par un utilisateur (exclus) : ${reclames.toLocaleString("fr-FR")}`);
  console.log(`  A RENOMMER                           : ${aRenommer.length.toLocaleString("fr-FR")}\n`);

  // Le nouveau nom est-il vraiment unique ? Deux CCAS dans la meme commune
  // resteraient jumeaux : on le signale au lieu de le decouvrir apres coup.
  const parNom = new Map<string, number>();
  for (const r of aRenommer) parNom.set(r.apres, (parNom.get(r.apres) || 0) + 1);
  const collisions = [...parNom.entries()].filter(([, n]) => n > 1);
  console.log(`noms encore en double apres renommage : ${collisions.length}`);
  for (const [n, v] of collisions.slice(0, 5)) console.log(`   ${n} x${v}`);

  console.log("\napercu :");
  for (const r of aRenommer.slice(0, 6)) console.log(`   ${r.avant.slice(0, 44).padEnd(44)} -> ${r.apres}`);

  if (!APPLIQUER) {
    console.log("\nSIMULATION. Relancer avec --appliquer.");
    return;
  }

  console.log("\necriture...");
  let n = 0;
  for (let i = 0; i < aRenommer.length; i += 100) {
    const lot = aRenommer.slice(i, i + 100);
    await Promise.all(
      lot.map((r) => sb.from("pros").update({ name: r.apres }).eq("id", r.id))
    );
    n += lot.length;
    if (i % 2000 === 0) console.log(`   ${n}/${aRenommer.length}`);
  }
  console.log(`\n${n} fiches renommees. Verifier en base avant de conclure.`);
})();
