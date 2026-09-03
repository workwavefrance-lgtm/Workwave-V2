/**
 * Comptes par metier x departement selon l'ETAT Sirene des fiches.
 *
 * POURQUOI (03/09/2026). Le classement par les fichiers Stock Sirene
 * (scripts/classer-etablissements.ts) a montre que 49,5 % des fiches actives
 * sont des etablissements FERMES. Les compteurs publics (home, metier-stats,
 * barometres) comptaient tout. Decision Willy : les compteurs comptent les
 * fiches OUVERTES (etat_admin IS NULL OR etat_admin <> 'F', cf. FILTRE_OUVERTS
 * dans lib/queries/pros.ts), et les barometres publient en plus la part
 * d'etablissements fermes et la part d'entreprises disparues.
 *
 * CE QUE RENVOIE chargerStatsEtats() : une ligne par (metier, departement)
 * avec cinq comptes. Deux chemins pour l'obtenir :
 *
 *   1. RPC `stats_etats_cat_dept_json` (migrations/2026-09-03_stats_ouverts_rpcs.sql)
 *      qui lit une vue materialisee : instantane. C'est le chemin normal.
 *      Mesure du 03/09 : la RPC `barometre_cat_dept` du 27/07 (meme agregat,
 *      calcule a la demande) depasse aujourd'hui les 120 s de delai, d'ou la
 *      vue materialisee, rafraichie par Willy dans l'editeur SQL.
 *
 *   2. EXTRACTION (tant que la migration n'est pas appliquee, ou --extraire) :
 *      lecture de toutes les fiches actives par curseur sur `id` (pages de
 *      1000, le plafond PostgREST ; 4 plages d'identifiants en parallele),
 *      agregation locale, cache 24 h dans scripts/.cache/. Mesure du 03/09 :
 *      300 a 700 ms par page, 2,44 M de fiches, environ 6 minutes.
 *
 * Les cinq comptes, par ligne :
 *   t  fiches actives (is_active, deleted_at null)
 *   o  OUVERTES : etat_admin null ou different de 'F'   <- ce que le site compte
 *   v  VERIFIEES dans les fichiers Stock Sirene (etat_verifie_at non null) ;
 *      c'est le denominateur des deux parts ci-dessous (les fiches belges et
 *      celles absentes du Stock n'ont pas d'etat connu)
 *   f  etablissements FERMES (etat_admin = 'F')
 *   x  entreprises DISPARUES (etat_admin = 'F' ET entreprise_etat = 'C')
 *
 * Reperes mesures par Willy le 03/09/2026 en SQL (toutes categories) :
 *   t = 2 439 976 · o = 1 233 038 · f = 1 206 938 · x = 785 154.
 * Les scripts qui consomment ces lignes affichent ces totaux pour controle.
 */
import fs from "fs";
import path from "path";
import { getServiceClient } from "../../lib/supabase/service-client";

export type LigneEtat = {
  c: string; // slug de la categorie
  vertical: string; // btp | domicile | personne | tech...
  d: string | null; // code du departement (null : fiche sans commune)
  k: string | null; // pays du departement : FR ou BE
  t: number;
  o: number;
  v: number;
  f: number;
  x: number;
};

export type StatsEtats = {
  lignes: LigneEtat[];
  source: "rpc" | "extraction";
  calculeLe: string; // date de l'agregat (AAAA-MM-JJ)
};

/** Date d'application des fichiers Stock Sirene sur la base (fin du classement). */
export const CLASSEMENT_SIRENE_DU = "2026-09-03";
/** Libelle de source a afficher avec les deux parts. */
export const ETATS_SOURCE = "fichiers Stock Sirene (INSEE), classement du 03/09/2026";
/** En dessous de ce nombre de fiches verifiees, aucun taux n'est publie. */
export const SEUIL_TAUX = 200;

/** Repères SQL du 03/09/2026, pour le controle de coherence des scripts. */
export const REPERES_SQL_0309 = { t: 2_439_976, o: 1_233_038, f: 1_206_938, x: 785_154 };

const CACHE = path.resolve(process.cwd(), "scripts/.cache/stats-etats-extraction.json");
const CACHE_MAX_AGE_MS = 24 * 3600 * 1000;
const PAGE = 1000; // plafond PostgREST : ne jamais mettre plus (lecons 30/04 et 09/05)
// UNE seule plage, lecture sequentielle (contrainte Willy du 03/09 : la base a
// 30 index et supporte mal les rafales ; 4 plages en parallele ont mis 272 s
// le 03/09 a 15 h, compter environ 15 a 20 min en sequentiel).
const PLAGES = 1;

type Sb = ReturnType<typeof getServiceClient>;

export async function chargerStatsEtats(opts: { forcerExtraction?: boolean } = {}): Promise<StatsEtats> {
  const sb = getServiceClient();
  if (!opts.forcerExtraction) {
    const viaRpc = await viaRpcOuNull(sb);
    if (viaRpc) return viaRpc;
  }
  return viaExtraction(sb, opts.forcerExtraction === true);
}

async function viaRpcOuNull(sb: Sb): Promise<StatsEtats | null> {
  const t = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb as any).rpc("stats_etats_cat_dept_json");
  if (error) {
    const absente = /could not find the function|does not exist|PGRST202/i.test(
      `${error.code} ${error.message}`
    );
    if (!absente) throw new Error(`RPC stats_etats_cat_dept_json : ${error.message}`);
    console.log(
      "RPC stats_etats_cat_dept_json absente (migration 2026-09-03_stats_ouverts_rpcs.sql non appliquee) : extraction directe."
    );
    return null;
  }
  const brut = (data || []) as (LigneEtat & { calcule_le?: string })[];
  if (brut.length === 0) throw new Error("RPC stats_etats_cat_dept_json : vue vide, la rafraichir (stats_etats_cat_dept_rafraichir)");
  const calculeLe = String(brut[0].calcule_le || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  const lignes = brut.map(({ c, vertical, d, k, t, o, v, f, x }) => ({ c, vertical, d, k, t, o, v, f, x }));
  console.log(`RPC stats_etats_cat_dept_json : ${lignes.length} lignes en ${Date.now() - t} ms (vue calculee le ${calculeLe})`);
  return { lignes, source: "rpc", calculeLe };
}

async function viaExtraction(sb: Sb, forcer: boolean): Promise<StatsEtats> {
  if (!forcer && fs.existsSync(CACHE)) {
    const age = Date.now() - fs.statSync(CACHE).mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      const cache = JSON.parse(fs.readFileSync(CACHE, "utf8")) as StatsEtats;
      console.log(`Extraction : cache ${path.relative(process.cwd(), CACHE)} (${Math.round(age / 60000)} min, ${cache.lignes.length} lignes)`);
      return cache;
    }
  }

  const debut = Date.now();
  // Referentiels (petites tables).
  const { data: cats, error: eCat } = await sb.from("categories").select("id,slug,vertical");
  if (eCat) throw eCat;
  const catById = new Map<number, { slug: string; vertical: string }>();
  for (const c of cats || []) catById.set(c.id, { slug: c.slug, vertical: c.vertical });

  const { data: depts, error: eDep } = await sb.from("departments").select("id,code,country");
  if (eDep) throw eDep;
  const deptById = new Map<number, { code: string; country: string }>();
  for (const d of depts || []) deptById.set(d.id, { code: d.code, country: d.country });

  const deptByCity = new Map<number, number>();
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("cities").select("id,department_id").range(offset, offset + PAGE - 1);
    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) break; // STOP quand vide, JAMAIS sur < PAGE
    for (const r of rows) deptByCity.set(r.id, r.department_id);
    offset += rows.length; // increment par le REEL recu
  }
  console.log(`Extraction : ${catById.size} categories · ${deptById.size} departements · ${deptByCity.size} communes`);

  // Bornes des plages d'identifiants.
  const { data: maxRow } = await sb.from("pros").select("id").order("id", { ascending: false }).limit(1);
  const idMax = Number(maxRow?.[0]?.id || 0);
  if (!idMax) throw new Error("Extraction : id max introuvable");
  const largeur = Math.ceil(idMax / PLAGES);

  const agg = new Map<string, LigneEtat>();
  const total = { t: 0, o: 0, v: 0, f: 0, x: 0 };
  let pages = 0;
  let lignesLues = 0;

  const lirePlage = async (bas: number, haut: number) => {
    let cursor = bas;
    while (true) {
      const { data, error } = await sb
        .from("pros")
        .select("id,category_id,city_id,etat_admin,entreprise_etat,etat_verifie_at")
        .eq("is_active", true)
        .is("deleted_at", null)
        .gt("id", cursor)
        .lte("id", haut)
        .order("id")
        .limit(PAGE);
      if (error) throw new Error(`Extraction pros (apres id ${cursor}) : ${error.message}`);
      const rows = data || [];
      if (rows.length === 0) break;
      for (const r of rows) {
        const cat = r.category_id ? catById.get(r.category_id) : undefined;
        if (!cat) continue;
        const deptId = r.city_id ? deptByCity.get(r.city_id) : undefined;
        const dept = deptId ? deptById.get(deptId) : undefined;
        const cle = `${cat.slug}|${dept?.code ?? ""}`;
        let l = agg.get(cle);
        if (!l) {
          l = { c: cat.slug, vertical: cat.vertical, d: dept?.code ?? null, k: dept?.country ?? null, t: 0, o: 0, v: 0, f: 0, x: 0 };
          agg.set(cle, l);
        }
        const ferme = r.etat_admin === "F";
        l.t += 1;
        total.t += 1;
        if (!ferme) { l.o += 1; total.o += 1; }
        if (r.etat_verifie_at) { l.v += 1; total.v += 1; }
        if (ferme) { l.f += 1; total.f += 1; }
        if (ferme && r.entreprise_etat === "C") { l.x += 1; total.x += 1; }
      }
      cursor = Number(rows[rows.length - 1].id);
      pages += 1;
      lignesLues += rows.length;
      if (pages % 200 === 0) {
        console.log(`  ${pages} pages · ${lignesLues.toLocaleString("fr-FR")} fiches · ${Math.round((Date.now() - debut) / 1000)} s`);
      }
    }
  };

  await Promise.all(
    Array.from({ length: PLAGES }, (_, i) => lirePlage(i * largeur, Math.min((i + 1) * largeur, idMax)))
  );

  const calculeLe = new Date().toISOString().slice(0, 10);
  const lignes = [...agg.values()].sort((a, b) => a.c.localeCompare(b.c) || String(a.d).localeCompare(String(b.d)));
  console.log(
    `Extraction terminee : ${lignesLues.toLocaleString("fr-FR")} fiches en ${Math.round((Date.now() - debut) / 1000)} s · ${lignes.length} lignes (metier x dept)\n` +
      `  actifs ${total.t.toLocaleString("fr-FR")} (SQL 03/09 : ${REPERES_SQL_0309.t.toLocaleString("fr-FR")}) · ` +
      `ouverts ${total.o.toLocaleString("fr-FR")} (${REPERES_SQL_0309.o.toLocaleString("fr-FR")}) · ` +
      `fermes ${total.f.toLocaleString("fr-FR")} (${REPERES_SQL_0309.f.toLocaleString("fr-FR")}) · ` +
      `disparues ${total.x.toLocaleString("fr-FR")} (${REPERES_SQL_0309.x.toLocaleString("fr-FR")}) · verifiees ${total.v.toLocaleString("fr-FR")}`
  );

  const resultat: StatsEtats = { lignes, source: "extraction", calculeLe };
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(resultat));
  console.log(`Cache ecrit : ${path.relative(process.cwd(), CACHE)}`);
  return resultat;
}

/** Part en %, a une decimale, ou null sous le seuil de fiches verifiees. */
export function part(numerateur: number, verifiees: number): number | null {
  if (verifiees < SEUIL_TAUX) return null;
  return Math.round((numerateur / verifiees) * 1000) / 10;
}

export type PopulationDept = { pop: number; superf: number };

/**
 * Population municipale INSEE 2021 par departement, pour les densites.
 * Source d'origine : /tmp/pop.csv (data.gouv, dataset 65b1a75892f5a30b16f72943,
 * colonnes dep / p21_pop / superf). Ce fichier temporaire disparait avec /tmp :
 * a defaut, on reprend les valeurs deja publiees dans
 * lib/data/barometre-artisans.ts (memes chiffres INSEE 2021, importes le 27/07).
 */
export async function chargerPopulationDepts(): Promise<{ parDept: Record<string, PopulationDept>; source: string }> {
  const csv = "/tmp/pop.csv";
  if (fs.existsSync(csv)) {
    const raw = fs.readFileSync(csv, "utf8").trim().split("\n");
    const header = raw[0].split(",");
    const iDep = header.indexOf("dep"), iPop = header.indexOf("p21_pop"), iSup = header.indexOf("superf");
    const parDept: Record<string, PopulationDept> = {};
    for (let i = 1; i < raw.length; i++) {
      const c = raw[i].split(",");
      parDept[c[iDep]] = { pop: Number(c[iPop]) || 0, superf: Number(c[iSup]) || 0 };
    }
    return { parDept, source: "/tmp/pop.csv (INSEE 2021, data.gouv)" };
  }
  const { BAROMETRE_ARTISANS } = await import("../../lib/data/barometre-artisans");
  const parDept: Record<string, PopulationDept> = {};
  for (const r of BAROMETRE_ARTISANS) parDept[r.code] = { pop: r.population, superf: r.superficie };
  return { parDept, source: "lib/data/barometre-artisans.ts (INSEE 2021, repris du releve precedent)" };
}
