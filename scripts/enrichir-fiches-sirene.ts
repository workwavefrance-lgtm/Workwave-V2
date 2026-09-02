/**
 * Enrichit les fiches pros avec les donnees OFFICIELLES de l'annuaire des
 * entreprises (API publique recherche-entreprises.api.gouv.fr, gratuite).
 *
 * POURQUOI. Regle du 07/06/2026 : chaque fiche porte de la vraie donnee
 * officielle, jamais de donnee inventee. Mesure du 20/08 : la date de creation
 * complete est le fait gratuit qui distingue le mieux deux fiches voisines.
 * L'annuaire ajoute par etablissement des faits uniques (coordonnees exactes,
 * metier declare a la Chambre des metiers, enseignes, nom commercial) et par
 * entreprise (comptes deposes, categorie, labels officiels).
 *
 * CE QUI EST ECRIT (uniquement quand l'API renvoie une valeur valide) :
 *   colonnes existantes : founding_date, founded_year (seulement si vide),
 *     forme_juridique, effectif_range, etat_admin, naf_code
 *   colonnes de la migration 2026-09-02 : etab_latitude, etab_longitude,
 *     activite_registre_metier, liste_rge, enseignes, nom_commercial,
 *     date_debut_activite, caractere_employeur, liste_idcc,
 *     nombre_etablissements, categorie_entreprise, finances, labels_officiels
 *   toujours : sirene_enrichi_at = now()  (marqueur de reprise)
 *   si au moins une valeur a change : updated_at = now()  (le flux de
 *     fraicheur lib/queries/fraicheur.ts lit updated_at : voulu)
 *
 * SIRET introuvable : sirene_enrichi_at seul est pose (on ne le redemande
 * plus), aucun autre champ n'est touche. Erreur API : rien n'est ecrit, la
 * fiche sera reprise au prochain passage.
 *
 * CE QUI N'EST JAMAIS FAIT ICI : desactiver une fiche. Un etablissement ferme
 * (etat_admin = F) est seulement ENREGISTRE et compte. La decision de retirer
 * ces fiches appartient a Willy (lecon du 06/08 : jamais de repli destructif
 * dans un script).
 *
 * SELECTION (une seule option a la fois), toujours filtree sur
 *   is_active = true AND deleted_at IS NULL AND siret IS NOT NULL
 *   AND sirene_enrichi_at IS NULL   (reprise automatique)
 *   --ville <slug-ville> [--pays FR] [--ville-id N si le slug est ambigu]
 *   --liste chemin.txt   (un slug par ligne, lignes vides et # ignorees)
 *   --ids 1,2,3
 * OPTIONS
 *   --limit N    plafond de fiches (defaut 2000, la taille du pilote)
 *   --debit N    requetes par seconde (defaut 5, maximum 7 = limite de l'API)
 *   --detail N   nombre de fiches affichees en detail (defaut 25)
 *   --apply      ecrit en base. Sans lui : mode lecture, rien n'est ecrit.
 *
 * USAGE
 *   npx tsx scripts/enrichir-fiches-sirene.ts --ville poitiers --limit 20
 *   npx tsx scripts/enrichir-fiches-sirene.ts --ville poitiers --limit 2000 --apply
 *   npx tsx scripts/enrichir-fiches-sirene.ts --liste fiches.txt --apply
 *
 * REPRENABLE : chaque fiche est ecrite individuellement et marquee. Un arret
 * (Ctrl-C, coupure) se reprend en relancant la meme commande.
 *
 * PREUVE : en fin de passage, le script RECOMPTE en base les fiches marquees
 * sur le perimetre et compare a ce qu'il croit avoir ecrit (lecon du 08/06 :
 * ne jamais conclure sur le seul journal du script).
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import fs from "fs";
import { getServiceClient } from "../lib/supabase/service-client";
import {
  rechercherParSiret,
  type EtablissementSirene,
  type RechercheSiret,
  type UniteLegaleSirene,
} from "../lib/utils/recherche-entreprises";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function option(nom: string): string | null {
  const i = args.indexOf(nom);
  if (i < 0) return null;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : null;
}
const APPLY = args.includes("--apply");
const LISTE = option("--liste");
const VILLE = option("--ville");
const VILLE_ID = option("--ville-id");
const IDS = option("--ids");
const PAYS = (option("--pays") || "FR").toUpperCase();
const LIMITE = Number(option("--limit") || 2000);
const DEBIT = Math.min(Number(option("--debit") || 5), 7);
const DETAIL = Number(option("--detail") || 25);

const modes = [LISTE, VILLE || VILLE_ID, IDS].filter(Boolean).length;
if (modes !== 1 || !Number.isInteger(LIMITE) || LIMITE <= 0 || !(DEBIT > 0)) {
  console.error("Usage : --ville <slug> | --liste <fichier> | --ids 1,2,3   [--limit N] [--debit N] [--apply]");
  process.exit(1);
}

const MIGRATION = "migrations/2026-09-02_pros_enrichissement_sirene.sql";
const sb = getServiceClient();

// ---------------------------------------------------------------------------
// Colonnes
// ---------------------------------------------------------------------------
const COLONNES_EXISTANTES = [
  "id", "slug", "name", "siret",
  "founded_year", "founding_date", "forme_juridique", "effectif_range", "etat_admin", "naf_code",
];
const COLONNES_MIGRATION = [
  "sirene_enrichi_at",
  "etab_latitude", "etab_longitude", "activite_registre_metier", "liste_rge", "enseignes",
  "nom_commercial", "date_debut_activite", "caractere_employeur", "liste_idcc",
  "nombre_etablissements", "categorie_entreprise", "finances", "labels_officiels",
];

type Fiche = {
  id: number;
  slug: string;
  name: string;
  siret: string;
  [colonne: string]: unknown;
};

type Patch = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Cadenceur : espace les DEPARTS de requetes de 1000 / DEBIT ms, quel que soit
// le nombre d'ouvriers en parallele. Avec 5 ouvriers et 200 ms d'ecart, on ne
// depasse jamais 5 requetes par seconde.
// ---------------------------------------------------------------------------
class Cadenceur {
  private prochain = 0;
  constructor(private readonly intervalleMs: number) {}
  async attendre(): Promise<void> {
    const maintenant = Date.now();
    const creneau = Math.max(maintenant, this.prochain);
    this.prochain = creneau + this.intervalleMs;
    const delai = creneau - maintenant;
    if (delai > 0) await new Promise((r) => setTimeout(r, delai));
  }
}
const cadenceur = new Cadenceur(1000 / DEBIT);

async function appelerApi(siret: string): Promise<RechercheSiret> {
  let derniere: RechercheSiret = { statut: "erreur_api", http: null, detail: "aucun appel" };
  for (let essai = 1; essai <= 3; essai++) {
    await cadenceur.attendre();
    const r = await rechercherParSiret(siret, { signal: AbortSignal.timeout(15000) });
    if (r.statut !== "erreur_api") return r;
    derniere = r;
    // Reseau, 429 ou 5xx : on reessaie apres une pause. Un autre 4xx est definitif.
    const retentable = r.http === null || r.http === 429 || r.http >= 500;
    if (!retentable) return r;
    await new Promise((res) => setTimeout(res, 1000 * 2 ** essai));
  }
  return derniere;
}

// ---------------------------------------------------------------------------
// Derivation des valeurs a ecrire, avec validation de forme sur chaque champ.
// Un champ absent ou mal forme n'est simplement pas ecrit : on ne remplace
// jamais une valeur en base par du vide.
// ---------------------------------------------------------------------------
const dateValide = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
const chaine = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const tableau = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string") ? (v as string[]) : null;
const normaliserNaf = (v: unknown): string | null => {
  const c = chaine(v)?.replace(/\./g, "").toUpperCase() || null;
  return c && /^\d{4}[A-Z]$/.test(c) ? c : null;
};
const coordonnee = (v: unknown, max: number): number | null => {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) && Math.abs(n) <= max && n !== 0 ? n : null;
};

const CLES_LABELS = [
  "est_rge", "est_qualiopi", "est_organisme_formation", "est_ess", "est_patrimoine_vivant", "est_association",
];

type Derive = { patch: Patch; infos: Record<string, string> };

function deriver(f: Fiche, unite: UniteLegaleSirene, etab: EtablissementSirene): Derive {
  const patch: Patch = {};
  const infos: Record<string, string> = {};

  const dateCreation = dateValide(unite.date_creation) || dateValide(etab.date_creation);
  if (dateCreation) {
    patch.founding_date = dateCreation;
    if (f.founded_year == null) patch.founded_year = Number(dateCreation.slice(0, 4));
  }
  const forme = chaine(unite.nature_juridique);
  if (forme && /^\d{4}$/.test(forme)) patch.forme_juridique = forme;

  const effectif = chaine(etab.tranche_effectif_salarie) || chaine(unite.tranche_effectif_salarie);
  if (effectif && /^(NN|\d{2})$/.test(effectif)) patch.effectif_range = effectif;

  const etat = chaine(etab.etat_administratif);
  if (etat && /^[AF]$/.test(etat)) patch.etat_admin = etat;

  const naf = normaliserNaf(etab.activite_principale) || normaliserNaf(unite.activite_principale);
  if (naf) patch.naf_code = naf;

  const registre = chaine(etab.activite_principale_registre_metier);
  if (registre) patch.activite_registre_metier = registre;

  const lat = coordonnee(etab.latitude, 90);
  const lng = coordonnee(etab.longitude, 180);
  if (lat !== null && lng !== null) {
    patch.etab_latitude = lat;
    patch.etab_longitude = lng;
  }

  const rge = tableau(etab.liste_rge);
  if (rge) patch.liste_rge = rge;
  const enseignes = tableau(etab.liste_enseignes);
  if (enseignes) patch.enseignes = enseignes;
  const nomCommercial = chaine(etab.nom_commercial);
  if (nomCommercial) patch.nom_commercial = nomCommercial;
  const debut = dateValide(etab.date_debut_activite);
  if (debut) patch.date_debut_activite = debut;
  const employeur = chaine(etab.caractere_employeur);
  if (employeur && /^[ON]$/.test(employeur)) patch.caractere_employeur = employeur;

  const complements = (unite.complements || {}) as Record<string, unknown>;
  const idcc = tableau(etab.liste_idcc) || tableau(complements.liste_idcc);
  if (idcc) patch.liste_idcc = idcc;

  if (Number.isInteger(unite.nombre_etablissements) && (unite.nombre_etablissements as number) >= 0) {
    patch.nombre_etablissements = unite.nombre_etablissements;
  }
  const categorie = chaine(unite.categorie_entreprise);
  if (categorie && /^(PME|ETI|GE)$/.test(categorie)) patch.categorie_entreprise = categorie;

  if (unite.finances && typeof unite.finances === "object" && Object.keys(unite.finances).length > 0) {
    patch.finances = unite.finances;
  }

  // Seulement les drapeaux a true. {} si aucun : explicite, et un prochain
  // passage pourra retirer un label perdu.
  const labels: Record<string, true> = {};
  for (const k of CLES_LABELS) if (complements[k] === true) labels[k] = true;
  patch.labels_officiels = labels;

  // Informations de lecture (pas ecrites), pour juger la qualite des donnees.
  infos.date_creation_ul = unite.date_creation || "-";
  infos.date_creation_etab = etab.date_creation || "-";
  infos.tranche_ul = unite.tranche_effectif_salarie || "-";
  infos.etat_ul = unite.etat_administratif || "-";
  infos.date_fermeture = etab.date_fermeture || "-";
  infos.naf_ul = unite.activite_principale || "-";
  return { patch, infos };
}

/** Compare une valeur en base a la valeur derivee. Une colonne inconnue (migration absente) compte comme un changement. */
function identique(enBase: unknown, nouvelle: unknown): boolean {
  if (enBase === undefined) return false;
  if (typeof nouvelle === "number" && typeof enBase === "number") return Math.abs(nouvelle - enBase) < 1e-9;
  if (nouvelle !== null && typeof nouvelle === "object") return JSON.stringify(enBase) === JSON.stringify(nouvelle);
  return String(enBase ?? "") === String(nouvelle ?? "");
}

// ---------------------------------------------------------------------------
// Selection des fiches
// ---------------------------------------------------------------------------
function requeteBase(colonnes: string, migrationAppliquee: boolean) {
  let q = sb
    .from("pros")
    .select(colonnes)
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("siret", "is", null);
  if (migrationAppliquee) q = q.is("sirene_enrichi_at", null);
  return q;
}

async function resoudreVille(): Promise<{ id: number; name: string }> {
  if (VILLE_ID) {
    const { data, error } = await sb.from("cities").select("id, name").eq("id", Number(VILLE_ID)).maybeSingle();
    if (error || !data) {
      console.error(`Ville id=${VILLE_ID} introuvable${error ? " : " + error.message : ""}`);
      process.exit(1);
    }
    return data as { id: number; name: string };
  }
  const { data, error } = await sb
    .from("cities")
    .select("id, name, slug, department_id, country")
    .eq("slug", VILLE as string)
    .eq("country", PAYS);
  if (error) {
    console.error("Lecture cities :", error.message);
    process.exit(1);
  }
  const villes = (data || []) as { id: number; name: string; department_id: number }[];
  if (villes.length === 0) {
    console.error(`Aucune commune avec slug "${VILLE}" (pays ${PAYS}).`);
    process.exit(1);
  }
  if (villes.length > 1) {
    console.error(`Slug "${VILLE}" ambigu (${villes.length} communes). Relancer avec --ville-id :`);
    for (const v of villes) console.error(`   id=${v.id}  ${v.name}  department_id=${v.department_id}`);
    process.exit(1);
  }
  return villes[0];
}

async function selectionner(colonnes: string, migrationAppliquee: boolean): Promise<{ fiches: Fiche[]; villeId: number | null }> {
  const fiches: Fiche[] = [];

  if (VILLE || VILLE_ID) {
    const ville = await resoudreVille();
    console.log(`Commune : ${ville.name} (id ${ville.id})`);
    // Pagination : squelette obligatoire de la lecon du 09/05 (cap PostgREST 1000).
    // ORDER BY category_id, id et non ORDER BY id seul : mesure du 02/09, la
    // premiere page passe de 5,7 s a 2,2 s sur Marseille et de 1,0 s a 0,14 s
    // sur Lyon (avec id seul, le planificateur parcourt l'index primaire de
    // 2,5 M de lignes au lieu de l'index partiel (city_id, category_id)).
    // L'ordre reste deterministe, donc la pagination reste stable.
    const PAGE = 1000;
    let offset = 0;
    while (fiches.length < LIMITE) {
      const { data, error } = await requeteBase(colonnes, migrationAppliquee)
        .eq("city_id", ville.id)
        .order("category_id", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (error) {
        console.error("Lecture pros :", error.message);
        process.exit(1);
      }
      const rows = (data || []) as unknown as Fiche[];
      if (rows.length === 0) break;
      fiches.push(...rows);
      offset += rows.length;
    }
    return { fiches: fiches.slice(0, LIMITE), villeId: ville.id };
  }

  // --liste ou --ids : on interroge par paquets de 200 (longueur d'URL).
  let cles: (string | number)[];
  let colonneCle: "slug" | "id";
  if (LISTE) {
    if (!fs.existsSync(LISTE)) {
      console.error(`Fichier introuvable : ${LISTE}`);
      process.exit(1);
    }
    cles = fs.readFileSync(LISTE, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    colonneCle = "slug";
  } else {
    cles = (IDS as string).split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0);
    colonneCle = "id";
  }
  cles = [...new Set(cles)];
  console.log(`${cles.length} ${colonneCle}(s) demande(s)`);
  const LOT = 200;
  for (let i = 0; i < cles.length; i += LOT) {
    const lot = cles.slice(i, i + LOT);
    const { data, error } = await requeteBase(colonnes, migrationAppliquee).in(colonneCle, lot).order("id", { ascending: true });
    if (error) {
      console.error("Lecture pros :", error.message);
      process.exit(1);
    }
    fiches.push(...((data || []) as unknown as Fiche[]));
  }
  const trouvees = new Set(fiches.map((f) => (colonneCle === "slug" ? f.slug : f.id)));
  const manquantes = cles.filter((c) => !trouvees.has(c));
  if (manquantes.length > 0) {
    console.log(`${manquantes.length} ${colonneCle}(s) ignore(s) : inexistant, inactif, sans SIRET ou deja enrichi.`);
    for (const m of manquantes.slice(0, 20)) console.log(`   ${m}`);
    if (manquantes.length > 20) console.log("   ...");
  }
  return { fiches: fiches.slice(0, LIMITE), villeId: null };
}

/** Compte en base les fiches marquees sur le perimetre (preuve de fin). */
async function compterMarquees(villeId: number | null, ids: number[]): Promise<number | null> {
  const base = () =>
    sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).not("siret", "is", null)
      .not("sirene_enrichi_at", "is", null);
  if (villeId !== null) {
    const { count, error } = await base().eq("city_id", villeId);
    if (error) {
      console.error("   comptage impossible :", error.message);
      return null;
    }
    return count ?? 0;
  }
  let total = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const { count, error } = await base().in("id", ids.slice(i, i + 200));
    if (error) {
      console.error("   comptage impossible :", error.message);
      return null;
    }
    total += count ?? 0;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Programme
// ---------------------------------------------------------------------------
(async () => {
  console.log(`=== Enrichissement annuaire des entreprises : ${APPLY ? "ECRITURE (--apply)" : "LECTURE (rien n'est ecrit)"} ===\n`);

  // Pre-vol : la migration est-elle appliquee ?
  const { error: eMig } = await sb.from("pros").select(COLONNES_MIGRATION.join(",")).limit(1);
  const migrationAppliquee = !eMig;
  if (!migrationAppliquee) {
    if (APPLY) {
      console.error(`REFUSE : colonnes manquantes en base (${eMig?.message}).`);
      console.error(`Appliquer d'abord ${MIGRATION} dans l'editeur SQL Supabase.`);
      process.exit(1);
    }
    console.log(`AVERTISSEMENT : migration non appliquee (${eMig?.message}).`);
    console.log("   -> pas de reprise automatique (sirene_enrichi_at absent), pas de comparaison avec l'existant");
    console.log(`   -> --apply sera refuse tant que ${MIGRATION} n'est pas passee.\n`);
  }
  const colonnes = (migrationAppliquee ? [...COLONNES_EXISTANTES, ...COLONNES_MIGRATION] : COLONNES_EXISTANTES).join(", ");

  const { fiches, villeId } = await selectionner(colonnes, migrationAppliquee);
  const ids = fiches.map((f) => f.id);
  console.log(`${fiches.length} fiche(s) a traiter, debit ${DEBIT} req/s, duree estimee ${Math.ceil(fiches.length / DEBIT)} s\n`);
  if (fiches.length === 0) return;

  const marqueesAvant = migrationAppliquee ? await compterMarquees(villeId, ids) : null;

  const compteurs = {
    traitees: 0, enrichies: 0, sans_changement: 0, non_trouvees: 0, erreurs_api: 0, erreurs_base: 0, deja_prises: 0,
    fermes: 0, naf_different: 0, annee_differente: 0, effectif_nn: 0,
    avec_coordonnees: 0, avec_registre_metier: 0, avec_rge_annuaire: 0, avec_enseigne_ou_nom: 0, avec_finances: 0, avec_labels: 0,
  };
  const debut = Date.now();
  let indice = 0;
  let detailsAffiches = 0;

  const journal = () => {
    const s = (Date.now() - debut) / 1000;
    console.log(
      `[${compteurs.traitees}/${fiches.length}] enrichies ${compteurs.enrichies} (dont sans changement ${compteurs.sans_changement}) | non trouvees ${compteurs.non_trouvees} | err API ${compteurs.erreurs_api} | err base ${compteurs.erreurs_base} | ${s.toFixed(0)} s | ${(compteurs.traitees / s).toFixed(2)} fiches/s`
    );
  };

  const traiter = async (f: Fiche) => {
    const r = await appelerApi(f.siret);
    const now = new Date().toISOString();

    if (r.statut === "erreur_api") {
      compteurs.erreurs_api++;
      if (compteurs.erreurs_api <= 10) console.log(`   erreur API : ${f.slug} (${f.siret}) ${r.http ?? "reseau"} ${r.detail}`);
      return;
    }

    if (r.statut === "non_trouve") {
      compteurs.non_trouvees++;
      console.log(`   non trouve (${r.raison}) : ${f.slug} (${f.siret})`);
      if (APPLY) {
        const { error, count } = await sb.from("pros").update({ sirene_enrichi_at: now }, { count: "exact" }).eq("id", f.id).is("sirene_enrichi_at", null);
        if (error) {
          compteurs.erreurs_base++;
          console.log(`   ERREUR base : ${f.slug} : ${error.message}`);
        } else if (!count) compteurs.deja_prises++;
      }
      return;
    }

    const { patch, infos } = deriver(f, r.unite, r.etablissement);
    const changements = Object.keys(patch).filter((k) => !identique(f[k], patch[k]));

    if (patch.etat_admin === "F") compteurs.fermes++;
    if (f.naf_code && patch.naf_code && f.naf_code !== patch.naf_code) compteurs.naf_different++;
    if (f.founded_year != null && patch.founding_date && Number(String(patch.founding_date).slice(0, 4)) !== f.founded_year) compteurs.annee_differente++;
    if (patch.effectif_range === "NN") compteurs.effectif_nn++;
    if (patch.etab_latitude !== undefined) compteurs.avec_coordonnees++;
    if (patch.activite_registre_metier) compteurs.avec_registre_metier++;
    if (patch.liste_rge) compteurs.avec_rge_annuaire++;
    if (patch.enseignes || patch.nom_commercial) compteurs.avec_enseigne_ou_nom++;
    if (patch.finances) compteurs.avec_finances++;
    if (Object.keys(patch.labels_officiels as object).length > 0) compteurs.avec_labels++;

    if (detailsAffiches < DETAIL) {
      detailsAffiches++;
      const p = patch;
      const geo = p.etab_latitude !== undefined ? `${p.etab_latitude}, ${p.etab_longitude}` : "-";
      console.log(`\n#${f.id} ${f.slug} (${f.siret}) ${f.name}`);
      console.log(`   date_creation ${p.founding_date ?? "-"} (UL ${infos.date_creation_ul}, etab ${infos.date_creation_etab}) | founded_year en base ${f.founded_year ?? "-"}`);
      console.log(`   nature_juridique ${p.forme_juridique ?? "-"} (en base ${f.forme_juridique ?? "-"}) | tranche_effectif ${p.effectif_range ?? "-"} (etab) / ${infos.tranche_ul} (UL) | etat etab ${p.etat_admin ?? "-"} / UL ${infos.etat_ul}${infos.date_fermeture !== "-" ? " ferme le " + infos.date_fermeture : ""}`);
      console.log(`   NAF etab ${p.naf_code ?? "-"} (en base ${f.naf_code ?? "-"}, UL ${infos.naf_ul}) | registre_metier ${p.activite_registre_metier ?? "-"} | employeur ${p.caractere_employeur ?? "-"} | debut_activite ${p.date_debut_activite ?? "-"}`);
      console.log(`   lat/lng ${geo} | liste_rge ${JSON.stringify(p.liste_rge ?? null)} | enseignes ${JSON.stringify(p.enseignes ?? null)} | nom_commercial ${p.nom_commercial ?? "-"}`);
      console.log(`   finances ${JSON.stringify(p.finances ?? null)} | idcc ${JSON.stringify(p.liste_idcc ?? null)} | labels ${JSON.stringify(p.labels_officiels)} | nb_etab ${p.nombre_etablissements ?? "-"} | categorie ${p.categorie_entreprise ?? "-"}`);
      console.log(`   -> ${APPLY ? "ecrit" : "ecrirait"} : ${changements.length ? changements.join(", ") + (APPLY ? "" : "") + " + updated_at" : "aucun changement (sirene_enrichi_at seul)"}`);
    }

    if (changements.length === 0) compteurs.sans_changement++;
    compteurs.enrichies++;

    if (APPLY) {
      const donnees: Patch = changements.length > 0 ? { ...patch, updated_at: now } : {};
      const { error, count } = await sb
        .from("pros")
        .update({ ...donnees, sirene_enrichi_at: now }, { count: "exact" })
        .eq("id", f.id)
        .is("sirene_enrichi_at", null);
      if (error) {
        compteurs.enrichies--;
        compteurs.erreurs_base++;
        console.log(`   ERREUR base : ${f.slug} : ${error.message}`);
      } else if (!count) {
        compteurs.enrichies--;
        compteurs.deja_prises++;
      }
    }
  };

  const ouvrier = async () => {
    while (indice < fiches.length) {
      const f = fiches[indice++];
      try {
        await traiter(f);
      } catch (e) {
        compteurs.erreurs_api++;
        console.log(`   exception : ${f.slug} : ${e instanceof Error ? e.message : String(e)}`);
      }
      compteurs.traitees++;
      if (compteurs.traitees % 100 === 0) journal();
    }
  };
  await Promise.all(Array.from({ length: DEBIT }, ouvrier));

  const secondes = (Date.now() - debut) / 1000;
  console.log("\n=== Bilan ===");
  console.log(`   traitees            ${compteurs.traitees}`);
  console.log(`   enrichies           ${compteurs.enrichies}  (dont sans aucun changement : ${compteurs.sans_changement})`);
  console.log(`   non trouvees        ${compteurs.non_trouvees}`);
  console.log(`   erreurs API         ${compteurs.erreurs_api}  (rien d'ecrit, reprises au prochain passage)`);
  console.log(`   erreurs base        ${compteurs.erreurs_base}`);
  if (compteurs.deja_prises) console.log(`   deja marquees par un autre passage : ${compteurs.deja_prises}`);
  console.log(`   duree ${secondes.toFixed(1)} s, debit ${(compteurs.traitees / secondes).toFixed(2)} fiches/s`);
  console.log("\n=== Qualite des donnees (sur les fiches trouvees) ===");
  console.log(`   etablissements FERMES (etat F)        ${compteurs.fermes}   <- seulement enregistres, jamais desactives ici`);
  console.log(`   NAF different de la base              ${compteurs.naf_different}`);
  console.log(`   annee de creation != founded_year     ${compteurs.annee_differente}`);
  console.log(`   effectif NN (non employeur)           ${compteurs.effectif_nn}`);
  console.log(`   avec coordonnees exactes              ${compteurs.avec_coordonnees}`);
  console.log(`   avec metier registre des metiers      ${compteurs.avec_registre_metier}`);
  console.log(`   avec liste_rge (annuaire)             ${compteurs.avec_rge_annuaire}`);
  console.log(`   avec enseigne ou nom commercial       ${compteurs.avec_enseigne_ou_nom}`);
  console.log(`   avec comptes deposes (finances)       ${compteurs.avec_finances}`);
  console.log(`   avec au moins un label officiel       ${compteurs.avec_labels}`);

  if (!migrationAppliquee) {
    console.log("\nPas de preuve en base possible : migration non appliquee.");
    return;
  }
  console.log("\n=== Preuve en base (recomptage sirene_enrichi_at IS NOT NULL sur le perimetre) ===");
  const marqueesApres = await compterMarquees(villeId, ids);
  if (!APPLY) {
    console.log(`   mode lecture : ${marqueesApres} fiche(s) deja marquee(s) sur le perimetre, inchange (avant ${marqueesAvant})`);
    return;
  }
  const attendu = (marqueesAvant ?? 0) + compteurs.enrichies + compteurs.non_trouvees;
  console.log(`   avant ${marqueesAvant} | ecrites par ce passage ${compteurs.enrichies + compteurs.non_trouvees} | attendu ${attendu} | mesure ${marqueesApres}`);
  if (marqueesApres === null) console.log("   VERIFICATION IMPOSSIBLE : recompter a la main.");
  else if (marqueesApres === attendu) console.log("   OK : le compte en base correspond.");
  else console.log(`   ECART de ${marqueesApres - attendu} : ne pas conclure, verifier en base.`);
})().catch((e) => {
  console.error("Erreur fatale :", e instanceof Error ? e.message : e);
  process.exit(1);
});
