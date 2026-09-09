/**
 * Remplit les colonnes Search Console de la table stats_jour (une ligne par
 * jour) : clics_gsc, impressions_gsc, clics_fiche_gsc, clics_listing_gsc.
 *
 * USAGE (depuis le Mac uniquement : l'authentification Google est celle du
 * poste, via les identifiants par defaut de gcloud, jamais depuis le VPS)
 *   npx tsx scripts/stats-gsc-jour.ts               # les 16 derniers jours
 *   npx tsx scripts/stats-gsc-jour.ts --jours=30    # les 30 derniers jours
 *
 * L'intervalle se termine HIER (UTC). Google a environ 2 jours de retard :
 * les 2 ou 3 derniers jours reviennent partiels (dataState "all" les expose
 * quand meme) et leurs chiffres montent encore pendant 48 h. C'est voulu :
 * chaque passage REECRIT tous les jours de l'intervalle (upsert sur jour),
 * donc un jour partiel se corrige seul au passage suivant. Un jour sans
 * aucune donnee cote Google n'est PAS ecrit : NULL en base signifie « pas
 * encore mesure », jamais zero.
 *
 * Ce script n'ecrit QUE ses 4 colonnes + jour. Les autres colonnes de
 * stats_jour appartiennent a d'autres producteurs (Umami, journal Traefik) :
 * l'upsert est partiel, PostgREST ne met a jour que les colonnes envoyees.
 *
 * AUTH GOOGLE : identifiants par defaut de gcloud (ADC), exactement comme
 * scripts/_mes-conv-gsc.ts. Si l'API repond « insufficient authentication
 * scopes », le scope manque dans l'ADC lui-meme (celui passe a GoogleAuth ne
 * fait que selectionner le jeton, lecon du 29/04/2026). Relancer :
 *   gcloud auth application-default login \
 *     --scopes="https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform"
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google, type searchconsole_v1 } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";

const SITE = "https://workwave.fr/";
const JOURS_DEFAUT = 16;

// Plafond documente de l'API Search Analytics : 25 000 lignes par reponse.
// Contrairement a PostgREST (qui peut tronquer SOUS la limite demandee, d'ou
// la regle « arret sur 0 ligne » du depot), Google renvoie exactement rowLimit
// lignes tant qu'il en reste : une page plus courte signifie la fin.
const LIGNES_MAX = 25000;

// Premiers segments de chemin qui ne sont PAS un listing metier x lieu, meme
// avec 2 segments. Meme liste que le contrat de stats_jour (producteur Umami
// pour sessions_listing) : les deux colonnes doivent compter la meme chose.
const PREFIXES_HORS_LISTING = new Set([
  "artisan", "ai", "en", "blog", "guide-des-prix", "pro", "admin", "departements", "recherche",
]);

type Ligne = searchconsole_v1.Schema$ApiDataRow;
type ClientGsc = searchconsole_v1.Searchconsole;

/** Ce qui part en base pour un jour : uniquement les colonnes de ce producteur. */
interface StatsJourGsc {
  jour: string;
  clics_gsc: number;
  impressions_gsc: number;
  clics_fiche_gsc: number;
  clics_listing_gsc: number;
}

function lireNbJours(): number {
  const arg = process.argv.find((a) => a.startsWith("--jours="));
  if (!arg) return JOURS_DEFAUT;
  const n = Number(arg.slice("--jours=".length));
  // 480 jours = la profondeur maximale conservee par Search Console (16 mois).
  if (!Number.isInteger(n) || n < 1 || n > 480) {
    console.error(`--jours doit etre un entier entre 1 et 480 (recu : ${arg})`);
    process.exit(1);
  }
  return n;
}

/** Jour UTC au format AAAA-MM-JJ, `recul` jours avant aujourd'hui (1 = hier). */
function jourUtc(recul: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - recul);
  return d.toISOString().slice(0, 10);
}

/** Chemin seul : sans origine, sans query string, sans ancre (comme url_path cote Umami). */
function cheminDe(url: string): string {
  const sansOrigine = url.replace(/^https?:\/\/[^/]+/, "");
  return sansOrigine.split(/[?#]/)[0] || "/";
}

function estFiche(url: string): boolean {
  return url.includes("/artisan/");
}

/** /<metier>/<lieu> : exactement 2 segments, premier segment hors liste d'exclusion. */
function estListing(url: string): boolean {
  const segments = cheminDe(url).split("/").filter(Boolean);
  if (segments.length !== 2) return false;
  return !PREFIXES_HORS_LISTING.has(segments[0]);
}

/**
 * Totaux du site par jour, agregation « par propriete » : ce sont les chiffres
 * que montre l'interface Search Console. L'agregation par page (requete
 * suivante) compte une impression PAR PAGE affichee, donc surestime les
 * impressions du site quand deux pages Workwave.fr sortent sur la meme
 * requete. Les clics, eux, sont identiques dans les deux modes (un clic vise
 * une seule page). D'ou deux requetes : les totaux ici, la repartition
 * fiche / listing par la requete par page.
 */
async function totauxParJour(sc: ClientGsc, debut: string, fin: string, nbJours: number) {
  const r = await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: { startDate: debut, endDate: fin, dimensions: ["date"], rowLimit: nbJours, dataState: "all" },
  });
  const parJour = new Map<string, { clics: number; impressions: number }>();
  for (const row of r.data.rows || []) {
    const jour = row.keys?.[0];
    if (!jour) continue;
    parJour.set(jour, { clics: row.clicks || 0, impressions: row.impressions || 0 });
  }
  // Premier jour encore en cours de collecte chez Google (fuseau America/Los_Angeles).
  return { parJour, premierJourPartiel: r.data.metadata?.firstIncompleteDate || null };
}

/** Toutes les lignes (date, page) d'un jour, en paginant avec startRow. */
async function lignesPagesDuJour(sc: ClientGsc, jour: string): Promise<Ligne[]> {
  const toutes: Ligne[] = [];
  let startRow = 0;
  while (true) {
    const r = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: {
        startDate: jour,
        endDate: jour,
        dimensions: ["date", "page"],
        rowLimit: LIGNES_MAX,
        startRow,
        dataState: "all",
      },
    });
    const rows = r.data.rows || [];
    toutes.push(...rows);
    if (rows.length < LIGNES_MAX) break;
    startRow += rows.length;
  }
  return toutes;
}

function agregerPages(jour: string, lignes: Ligne[]) {
  let clics = 0, fiche = 0, listing = 0, pages = 0;
  for (const row of lignes) {
    // keys[0] = date, keys[1] = page (ordre des dimensions demandees).
    if (row.keys?.[0] !== jour) continue;
    const page = row.keys?.[1];
    if (!page) continue;
    const c = row.clicks || 0;
    pages++;
    clics += c;
    if (estFiche(page)) fiche += c;
    else if (estListing(page)) listing += c;
  }
  return { clics, fiche, listing, pages };
}

(async () => {
  const nbJours = lireNbJours();
  const fin = jourUtc(1);
  const debut = jourUtc(nbJours);
  console.log(`Search Console ${SITE} : du ${debut} au ${fin} (${nbJours} jours, fin = hier UTC)`);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  const { parJour, premierJourPartiel } = await totauxParJour(sc, debut, fin, nbJours);
  if (premierJourPartiel) console.log(`Google collecte encore a partir du ${premierJourPartiel} : ces jours changeront au prochain passage.`);

  const aEcrire: StatsJourGsc[] = [];
  const sansDonnee: string[] = [];
  const notes = new Map<string, string>();

  for (let recul = nbJours; recul >= 1; recul--) {
    const jour = jourUtc(recul);
    const totaux = parJour.get(jour);
    if (!totaux) {
      // Rien cote Google pour ce jour : on n'ecrit pas, NULL veut dire « pas mesure ».
      sansDonnee.push(jour);
      continue;
    }
    const pages = agregerPages(jour, await lignesPagesDuJour(sc, jour));
    const note: string[] = [];
    if (premierJourPartiel && jour >= premierJourPartiel) note.push("partiel");
    // Les clics par page doivent retomber sur le total du site. Un ecart
    // signale un probleme d'agregation, on le montre sans le masquer.
    if (pages.clics !== totaux.clics) note.push(`ecart pages ${pages.clics} vs site ${totaux.clics}`);
    note.push(`${pages.pages} pages`);
    notes.set(jour, note.join(", "));
    aEcrire.push({
      jour,
      clics_gsc: totaux.clics,
      impressions_gsc: totaux.impressions,
      clics_fiche_gsc: pages.fiche,
      clics_listing_gsc: pages.listing,
    });
  }

  if (aEcrire.length === 0) {
    console.log("Aucun jour avec des donnees Search Console dans l'intervalle : rien ecrit.");
    if (sansDonnee.length) console.log(`Jours sans donnee : ${sansDonnee.join(", ")}`);
    return;
  }

  // Upsert partiel : seules les colonnes presentes dans les objets sont
  // ecrites, celles des autres producteurs restent intactes.
  const sb = getServiceClient();
  const { data, error } = await sb.from("stats_jour").upsert(aEcrire, { onConflict: "jour" }).select("jour");
  if (error) {
    console.error(`ECHEC upsert stats_jour : ${error.message}`);
    process.exit(1);
  }
  const confirmes = new Set((data || []).map((r: { jour: string }) => r.jour));
  const manquants = aEcrire.filter((l) => !confirmes.has(l.jour)).map((l) => l.jour);
  if (manquants.length) {
    console.error(`Upsert incomplet : ${confirmes.size} lignes confirmees sur ${aEcrire.length}, manquent ${manquants.join(", ")}`);
    process.exit(1);
  }

  console.log(`\nEcrit en base (${aEcrire.length} jours) :`);
  console.log("jour         clics   impressions   fiches   listings   part listing   note");
  for (const l of aEcrire) {
    const part = (100 * l.clics_listing_gsc / Math.max(1, l.clics_gsc)).toFixed(1);
    console.log(
      `${l.jour}  ${String(l.clics_gsc).padStart(6)}  ${String(l.impressions_gsc).padStart(12)}  ${String(l.clics_fiche_gsc).padStart(7)}  ${String(l.clics_listing_gsc).padStart(9)}  ${(part + " %").padStart(12)}   ${notes.get(l.jour) || ""}`
    );
  }
  if (sansDonnee.length) console.log(`\nNon ecrits (aucune donnee Google) : ${sansDonnee.join(", ")}`);
})().catch((e: unknown) => {
  console.error("FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
