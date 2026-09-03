/**
 * Classe chaque fiche selon l'etat REEL de son etablissement et de son
 * entreprise, a partir des fichiers Stock du repertoire Sirene (INSEE).
 *
 * POURQUOI (mesure du 02/09/2026 sur 200 fiches actives tirees au hasard) :
 * 45 % des fiches actives sont des etablissements FERMES dans Sirene
 * (34 % d'entreprises cessees, 11 % d'entreprises encore actives ailleurs).
 * Le scraper (scraping/sirene_par_departement.py) filtrait
 * periode(etatAdministratifEtablissement:A), qui matche n'importe quelle
 * periode HISTORIQUE. La colonne etat_admin vaut "A" partout par defaut :
 * elle n'a jamais ete ecrite, elle n'est pas fiable.
 *
 * SOURCES (open data, sans appel API, un telechargement par mois) :
 *   StockEtablissement  colonne etatAdministratifEtablissement (A ou F),
 *                       rattachement par SIRET. dateDebut = debut de la
 *                       periode courante, donc la date de fermeture quand F.
 *                       (Nuance : si une autre variable historisee, enseigne
 *                       ou activite, a change APRES la fermeture, dateDebut
 *                       est posterieure a la fermeture. Cas rare.)
 *   StockUniteLegale    colonne etatAdministratifUniteLegale (A ou C),
 *                       rattachement par SIREN (9 premiers chiffres du SIRET).
 *                       dateDebut = date de cessation quand C.
 *   Noms de colonnes verifies sur les dessins de fichier INSEE (version 311)
 *   ET relus dans l'en-tete de chaque CSV au lancement.
 *
 * CE QUI EST ECRIT (migration 2026-09-02_pros_etat_etablissements.sql) :
 *   etat_admin, date_fermeture, entreprise_etat, entreprise_date_fermeture,
 *   etat_verifie_at = maintenant.
 *   JAMAIS updated_at : le flux de fraicheur (lib/queries/fraicheur.ts) le
 *   lit, 1,1 M de fiches fermees ne doivent pas y entrer. Le script le
 *   verifie sur la premiere fiche ecrite et s'arrete si un trigger l'a touche.
 *   JAMAIS is_active ni deleted_at : decision Willy (02/09), une fiche fermee
 *   reste en ligne et dit la verite.
 *
 * PERIMETRE : is_active = true AND deleted_at IS NULL AND siret IS NOT NULL.
 * Les fiches absentes du Stock ne sont pas touchees (etat_verifie_at reste
 * null = jamais verifie).
 *
 * ECRITURE : pas d'upsert (slug NOT NULL ferait echouer l'INSERT, bug du
 * 12/06). UPDATE ... WHERE siret IN (...) par lots de 300 SIRET, regroupes
 * par valeurs identiques. L'erreur de CHAQUE lot est verifiee (lecon du
 * 08/06), les lots en erreur sont rejoues une fois, et on recompte en base a
 * la fin : "OK" seulement si le recompte concorde avec ce qui a ete ecrit.
 *
 * LECTURE DES ARCHIVES : le `unzip` de macOS renvoie un flux VIDE sur ces
 * zip64 (bug du 12/06). Lecture native Node : on saute l'en-tete local et on
 * passe le reste a inflateRaw, qui s'arrete seul a la fin du flux. Rien n'est
 * ecrit sur disque, aucun fichier n'est charge entier.
 *
 * MEMOIRE (Mac 8 Go) : en memoire seulement nos SIRET, nos SIREN et un
 * resultat compact par fiche, soit environ 1 Go pour 2,5 millions de fiches.
 *   NODE_OPTIONS="--max-old-space-size=6144"
 *
 * USAGE
 *   npx tsx scripts/classer-etablissements.ts                        simulation
 *   npx tsx scripts/classer-etablissements.ts --max-lignes 3000000   test rapide
 *   npx tsx scripts/classer-etablissements.ts --appliquer            ecriture
 *   npx tsx scripts/classer-etablissements.ts --appliquer --reprendre
 *       (apres une interruption : saute les fiches deja verifiees)
 *
 * Passage complet, detache (survit a la fermeture de la session, lecon 31/05) :
 *   NODE_OPTIONS="--max-old-space-size=6144" nohup caffeinate -i \
 *     npx tsx scripts/classer-etablissements.ts --appliquer \
 *     > scripts/classer.log 2>&1 &
 *
 * FICHIERS ATTENDUS dans /tmp/sirene (ou $SIRENE_DIR), dataset data.gouv.fr
 * "base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret" :
 *   etab.zip   = stock-stocketablissement-csv.zip  (~2,7 Go)
 *   unite.zip  = stock-stockunitelegale-csv.zip    (~0,9 Go)
 * Verifier le mois du stock (date du fichier) avant de lancer un passage.
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import fs from "fs";
import zlib from "zlib";
import { StringDecoder } from "string_decoder";
import { getServiceClient } from "../lib/supabase/service-client";

const sb = getServiceClient();

const APPLIQUER = process.argv.includes("--appliquer");
const REPRENDRE = process.argv.includes("--reprendre");
const MAX_LIGNES = lireEntier("--max-lignes");
const DOSSIER = process.env.SIRENE_DIR || "/tmp/sirene";
const ZIP_ETAB = path.join(DOSSIER, "etab.zip");
const ZIP_UNITE = path.join(DOSSIER, "unite.zip");
const LOT_ECRITURE = 300; // taille du filtre `in`, au-dela l'URL devient trop longue
const JOURNAL_TOUTES_LES = 2_000_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLONNES_CIBLES = "siret, etat_admin, date_fermeture, entreprise_etat, entreprise_date_fermeture, etat_verifie_at";

const fmt = (n: number) => n.toLocaleString("fr-FR");
const pct = (n: number, total: number) => (total ? ((100 * n) / total).toFixed(1) + " %" : "n/a");
const rssMo = () => Math.round(process.memoryUsage().rss / 1e6);
const secondes = (t0: number) => Math.round((Date.now() - t0) / 1000);

function lireEntier(option: string): number | null {
  const i = process.argv.indexOf(option);
  if (i < 0) return null;
  const v = Number(process.argv[i + 1]);
  if (!Number.isInteger(v) || v <= 0) {
    console.error(`${option} attend un entier positif`);
    process.exit(1);
  }
  return v;
}

/** Nom du premier fichier contenu dans l'archive (en-tete local zip). */
function nomDansLeZip(zip: string): string {
  const fd = fs.openSync(zip, "r");
  const entete = Buffer.alloc(30);
  fs.readSync(fd, entete, 0, 30, 0);
  const n = entete.readUInt16LE(26);
  const nom = Buffer.alloc(n);
  fs.readSync(fd, nom, 0, n, 30);
  fs.closeSync(fd);
  return nom.toString("utf8");
}

/**
 * Lit le premier fichier d'une archive zip, ligne par ligne, sans rien
 * ecrire sur disque. En-tete local : signature (4), version (2), drapeaux (2),
 * methode (2), heure/date (4), crc (4), tailles (8), longueur du nom (2),
 * longueur de l'extra (2), puis le nom, l'extra, et les donnees compressees.
 * Les tailles zip64 (0xFFFFFFFF) n'ont pas besoin d'etre lues : inflateRaw
 * detecte la fin du flux deflate et ignore ce qui suit (descripteur de
 * donnees, repertoire central). Verifie sur un zip64 avec descripteur.
 */
async function* lignesDuZip(zip: string): AsyncGenerator<string> {
  const fd = fs.openSync(zip, "r");
  const entete = Buffer.alloc(30);
  fs.readSync(fd, entete, 0, 30, 0);
  fs.closeSync(fd);
  if (entete.readUInt32LE(0) !== 0x04034b50) throw new Error(`${zip} : ce n'est pas une archive zip`);
  const methode = entete.readUInt16LE(8);
  if (methode !== 8) throw new Error(`${zip} : methode de compression ${methode} non geree (attendu 8 = deflate)`);
  const debut = 30 + entete.readUInt16LE(26) + entete.readUInt16LE(28);

  const source = fs.createReadStream(zip, { start: debut, highWaterMark: 1 << 20 });
  const inflate = zlib.createInflateRaw();
  let erreur: Error | null = null;
  const surErreur = (e: Error) => {
    erreur = e;
    inflate.destroy(e); // termine l'iteration au lieu de la laisser pendre
  };
  source.on("error", surErreur);
  inflate.on("end", () => source.destroy()); // fin du flux deflate : le reste de l'archive ne nous concerne pas
  source.pipe(inflate);
  // 🔴 PAS de readline ici. Son iterateur asynchrone met les lignes en file
  // SANS contre-pression : la decompression native va plus vite que le
  // decoupage JS, la file grossit sans limite, et le passage complet du 02/09
  // est mort a 18 M de lignes (tas a 5,8 Go, "heap out of memory"), alors que
  // la simulation sur 3 M passait. Iterer directement sur le flux inflate
  // (for await sur un Readable) ne demande le morceau suivant qu'une fois le
  // precedent consomme : memoire plate quelle que soit la taille du fichier.
  const decodeur = new StringDecoder("utf8"); // un caractere accentue peut etre coupe entre deux morceaux
  let reste = "";
  try {
    for await (const morceau of inflate as AsyncIterable<Buffer>) {
      const texte = reste + decodeur.write(morceau);
      let debutLigne = 0;
      let fin: number;
      while ((fin = texte.indexOf("\n", debutLigne)) !== -1) {
        const l = texte.charCodeAt(fin - 1) === 13 ? texte.slice(debutLigne, fin - 1) : texte.slice(debutLigne, fin);
        debutLigne = fin + 1;
        yield l;
      }
      reste = texte.slice(debutLigne);
    }
    reste += decodeur.end();
    if (reste.length > 0) yield reste.endsWith("\r") ? reste.slice(0, -1) : reste;
  } finally {
    inflate.destroy();
    source.destroy();
  }
  if (erreur) throw erreur;
}

/** Decoupe une ligne CSV en respectant les guillemets (les libelles en contiennent). */
function champs(ligne: string): string[] {
  const out: string[] = [];
  let cur = "";
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (dansGuillemets && ligne[i + 1] === '"') {
        cur += '"';
        i++;
      } else dansGuillemets = !dansGuillemets;
    } else if (c === "," && !dansGuillemets) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Positions des colonnes attendues dans l'en-tete, ou arret si l'une manque. */
function indices(entete: string[], noms: string[], fichier: string): number[] {
  const pos = noms.map((n) => entete.indexOf(n));
  const manquantes = noms.filter((_, i) => pos[i] < 0);
  if (manquantes.length) {
    console.error(`   ${fichier} : colonnes introuvables : ${manquantes.join(", ")}`);
    console.error(`   en-tete lu (${entete.length} colonnes) : ${entete.slice(0, 12).join(", ")}...`);
    process.exit(1);
  }
  // La decoupe rapide (split sur la virgule) n'est sure que si aucune colonne
  // de texte libre ne precede la cle. siren, nic et siret sont les trois
  // premieres colonnes, uniquement numeriques.
  if (pos[0] > 2) {
    console.error(`   ${fichier} : la colonne cle ${noms[0]} est en position ${pos[0]}, la decoupe rapide n'est plus sure`);
    process.exit(1);
  }
  return pos;
}

/** Nos fiches du perimetre, indexees par SIRET. Environ 250 Mo pour 2,5 millions. */
async function nosSirets(): Promise<Set<string>> {
  const set = new Set<string>();
  let dernierId = 0;
  let lues = 0;
  let invalides = 0;
  let dejaVerifies = 0;
  const PAGE = 1000; // plafond PostgREST, ne jamais mettre plus (lecon du 09/05)
  while (true) {
    // Curseur sur id (lecon du 26/05) : OFFSET profond sur 2,5 M de lignes
    // filtrees depasse le delai de la base ; id > dernier reste constant.
    // Type `string` (pas un litteral) : le parseur de types de supabase-js
    // ne sait pas lire une union de deux listes de colonnes.
    const colonnes: string = REPRENDRE ? "id, siret, etat_verifie_at" : "id, siret";
    const { data, error } = await sb
      .from("pros")
      .select(colonnes)
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("siret", "is", null)
      .gt("id", dernierId)
      .order("id")
      .limit(PAGE);
    if (error) {
      console.error("ERREUR de lecture des fiches :", error.message);
      process.exit(1);
    }
    const rows = (data || []) as unknown as { id: number; siret: string; etat_verifie_at?: string | null }[];
    if (rows.length === 0) break; // STOP quand vide, jamais sur < PAGE
    for (const r of rows) {
      const s = String(r.siret).trim();
      if (!/^\d{14}$/.test(s)) {
        invalides++;
        continue;
      }
      if (REPRENDRE && r.etat_verifie_at) {
        dejaVerifies++;
        continue;
      }
      set.add(s);
    }
    dernierId = rows[rows.length - 1].id;
    lues += rows.length;
    if (lues % 200_000 === 0) console.log(`   ${fmt(lues)} fiches lues...`);
  }
  console.log(`   ${fmt(lues)} fiches dans le perimetre, ${fmt(set.size)} SIRET retenus`);
  // Mesure du 02/09 : 120 743 fiches, toutes des numeros BCE belges a 10
  // chiffres (source "bce"). Hors Sirene par nature, jamais verifiables ici.
  if (invalides) console.log(`   ${fmt(invalides)} identifiants hors format Sirene (pas 14 chiffres : numeros BCE belges), hors perimetre`);
  if (REPRENDRE) console.log(`   ${fmt(dejaVerifies)} fiches deja verifiees, sautees (--reprendre)`);
  return set;
}

type Compteurs = { lues: number; matchs: number; ouverts: number; fermes: number; autres: number; sansDate: number };

/**
 * Parcourt un fichier Stock et retient, pour chacune de nos cles, l'etat et
 * la date de debut de periode, sous forme compacte : "A" (ouvert) ou
 * "F2019-03-01" (ferme depuis cette date), "F" si la date manque.
 * `codeOuvert` / `codeFerme` : A/F pour un etablissement, A/C pour une entreprise.
 */
async function lireEtats(
  zip: string,
  fichier: string,
  colonnes: [cle: string, etat: string, date: string],
  cles: Set<string>,
  codeOuvert: string,
  codeFerme: string
): Promise<{ etats: Map<string, string>; c: Compteurs }> {
  const etats = new Map<string, string>();
  const c: Compteurs = { lues: 0, matchs: 0, ouverts: 0, fermes: 0, autres: 0, sansDate: 0 };
  let iCle = -1;
  let iEtat = -1;
  let iDate = -1;
  let entete: string[] | null = null;
  const t0 = Date.now();

  for await (const ligne of lignesDuZip(zip)) {
    if (!entete) {
      entete = champs(ligne.replace(/^\uFEFF/, "")).map((s) => s.trim());
      [iCle, iEtat, iDate] = indices(entete, colonnes, fichier);
      console.log(`   colonnes trouvees : ${colonnes[0]} (${iCle}), ${colonnes[1]} (${iEtat}), ${colonnes[2]} (${iDate}) sur ${entete.length}`);
      continue;
    }
    if (MAX_LIGNES && c.lues >= MAX_LIGNES) {
      console.log(`   arret a ${fmt(c.lues)} lignes (--max-lignes)`);
      break;
    }
    c.lues++;
    if (c.lues % JOURNAL_TOUTES_LES === 0) {
      console.log(
        `   ${fmt(c.lues)} lignes lues, ${fmt(c.matchs)} matchs (${codeOuvert} ${fmt(c.ouverts)} / ${codeFerme} ${fmt(c.fermes)}), ${secondes(t0)} s, rss ${rssMo()} Mo`
      );
    }
    // Decoupe rapide : le parseur complet ne sert que pour nos lignes.
    const cleTranche = ligne.split(",", iCle + 1)[iCle];
    if (!cleTranche || !cles.has(cleTranche)) continue;
    // 🔴 COPIER ce qu'on garde. En V8, une sous-chaine (split, slice) n'est
    // qu'un POINTEUR vers la chaine d'origine : ici le morceau de fichier
    // d'environ 1 Mo dont la ligne est issue. Garder 2,2 millions de cles
    // tranchees revenait a garder en vie chaque morceau du fichier de 10 Go.
    // C'est ce qui a tue les deux premiers passages du 02/09 (tas a 5,8 Go
    // vers 20 M de lignes, memoire pourtant plate avant). Buffer.from copie
    // les octets : la cle ne retient plus rien d'autre qu'elle-meme.
    const cle = Buffer.from(cleTranche, "utf8").toString();
    c.matchs++;
    const ch = champs(ligne);
    const etat = (ch[iEtat] || "").trim();
    const date = Buffer.from((ch[iDate] || "").trim(), "utf8").toString();
    if (etat === codeOuvert) {
      c.ouverts++;
      etats.set(cle, codeOuvert);
    } else if (etat === codeFerme) {
      c.fermes++;
      if (DATE_RE.test(date)) etats.set(cle, codeFerme + date);
      else {
        c.sansDate++;
        etats.set(cle, codeFerme);
      }
    } else c.autres++;
  }
  console.log(
    `   termine : ${fmt(c.lues)} lignes lues, ${fmt(c.matchs)} matchs, ${codeOuvert} ${fmt(c.ouverts)} / ${codeFerme} ${fmt(c.fermes)}` +
      (c.autres ? `, ${fmt(c.autres)} etat inconnu` : "") +
      (c.sansDate ? `, ${fmt(c.sansDate)} ${codeFerme} sans date` : "") +
      `, ${secondes(t0)} s, rss ${rssMo()} Mo`
  );
  return { etats, c };
}

type Patch = {
  etat_admin: "A" | "F";
  date_fermeture: string | null;
  entreprise_etat: "A" | "C" | null;
  entreprise_date_fermeture: string | null;
  etat_verifie_at: string;
};

/** Une fiche et ses valeurs, pour l'ecriture par tableau JSON (RPC). */
type Enreg = {
  siret: string;
  etat_admin: "A" | "F";
  date_fermeture: string | null;
  entreprise_etat: "A" | "C" | null;
  entreprise_date_fermeture: string | null;
};

/**
 * Un lot d'ecriture. Deux formes :
 *   - `records` present : lot MIXTE de LOT_RPC fiches aux valeurs quelconques,
 *     ecrit en UNE requete par la fonction SQL classer_etats_lot (migration
 *     2026-09-02_classer_etats_lot.sql). C'est la forme normale depuis le 02/09
 *     22 h : le regroupement par valeurs identiques faisait ~176 000 requetes
 *     de 5 fiches pour les fermees (une date de fermeture distincte = un
 *     groupe), a 3 ou 4 requetes par seconde. Ici ~1 100 requetes.
 *   - sans `records` : UPDATE ... WHERE siret IN (...) avec les memes valeurs
 *     pour tout le lot. Reste utilise pour le garde-fou updated_at (une fiche).
 */
type Lot = { patch: Patch; sirets: string[]; records?: Enreg[] };
// 200, pas 1 000 : a 1 000 fiches par appel, chaque appel depassait le delai
// autorise par la base (mesure 02/09, 22 h 30 : lots 1, 2, 3, 10, 12 en
// "statement timeout"). Le cout est par LIGNE ecrite (lignes larges, deux
// triggers), pas par requete : 200 fiches tiennent sous le delai, et le lot
// mixte garde l'essentiel du gain (une requete par 200 fiches au lieu de 5).
// Puis 50 (03/09, 7 h 20) : mesure sur des lignes deja classees, reecrites a
// l'identique, RPC de 200 lignes = 3,1 a 3,7 s a vide ; sous la charge du
// crawl et des aspirateurs, un paquet sur quatre depassait le delai de la
// base. A 50 lignes (~1 s), la marge est large ; 379 000 fiches restantes =
// ~7 600 appels, environ 2 h 30. Lent mais sans erreur.
// Puis 100 (03/09, 8 h 15) : le vrai coupable etait le trigger updated_at v1
// (to_jsonb de la ligne entiere, 180 ms sur les fiches lourdes), remplace par
// la v2 (test sur etat_verifie_at seul). Avec lui, 100 lignes tiennent
// largement sous le delai.
const LOT_RPC = 100;

/** Ecriture d'un lot. Retourne le nombre de lignes modifiees, ou une erreur. */
async function ecrireLot(lot: Lot): Promise<{ n: number; erreur: string | null }> {
  if (lot.records) {
    // Delai de 90 s : sans lui, un appel dont la reponse ne revient jamais
    // bloque tout le passage (03/09, 0 h 20 : processus a 0 % de CPU pendant
    // 20 minutes au lot 2 800, 32 connexions ouvertes, aucune erreur). Un
    // appel expire est compte en erreur, rejoue a la fin, et sinon repris au
    // passage suivant (--reprendre).
    const { data, error } = await sb
      .rpc("classer_etats_lot", { lot: lot.records, verifie_at: lot.patch.etat_verifie_at })
      .abortSignal(AbortSignal.timeout(90_000));
    if (error) return { n: 0, erreur: error.message };
    return { n: typeof data === "number" ? data : Number(data) || 0, erreur: null };
  }
  const { error, count } = await sb
    .from("pros")
    .update(lot.patch, { count: "exact" })
    .in("siret", lot.sirets)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) return { n: 0, erreur: error.message };
  return { n: count || 0, erreur: null };
}

async function lireUpdatedAt(siret: string): Promise<string | null> {
  const { data, error } = await sb.from("pros").select("updated_at").eq("siret", siret).eq("is_active", true).is("deleted_at", null).limit(1);
  if (error) {
    console.error("   lecture de updated_at impossible :", error.message);
    process.exit(1);
  }
  return data?.[0]?.updated_at ?? null;
}

/** Comptage exact filtre, ou null si la base n'a pas repondu (delai). */
async function compter(horodatage: string, etatAdmin?: "A" | "F"): Promise<number | null> {
  let q = sb
    .from("pros")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null)
    .gte("etat_verifie_at", horodatage);
  if (etatAdmin) q = q.eq("etat_admin", etatAdmin);
  const { count, error } = await q;
  if (error) {
    console.error(`   comptage impossible (${etatAdmin || "total"}) :`, error.message);
    return null;
  }
  return count;
}

(async () => {
  const tDebut = Date.now();
  console.log(`=== Classement des etablissements depuis les fichiers Stock Sirene ${APPLIQUER ? "(ECRITURE)" : "(simulation)"} ===\n`);
  if (MAX_LIGNES) console.log(`Test rapide : ${fmt(MAX_LIGNES)} lignes par fichier au maximum.\n`);

  for (const z of [ZIP_ETAB, ZIP_UNITE]) {
    if (!fs.existsSync(z)) {
      console.error(`Fichier manquant : ${z}`);
      console.error("Telecharger d'abord les fichiers Stock depuis data.gouv.fr (voir l'en-tete du script).");
      process.exit(1);
    }
    const st = fs.statSync(z);
    console.log(`  ${path.basename(z)} : ${(st.size / 1e9).toFixed(2)} Go, fichier du ${st.mtime.toISOString().slice(0, 10)}, contient ${nomDansLeZip(z)}`);
  }

  console.log("\n0. Colonnes cibles en base...");
  const test = await sb.from("pros").select(COLONNES_CIBLES).limit(1);
  const colonnesOk = !test.error;
  if (colonnesOk) console.log("   presentes.");
  else if (APPLIQUER) {
    console.error(`   ABSENTES (${test.error!.message}).`);
    console.error("   Appliquer d'abord migrations/2026-09-02_pros_etat_etablissements.sql. Rien n'est ecrit.");
    process.exit(1);
  } else console.log(`   absentes (${test.error!.message}) : la simulation continue, --appliquer sera refuse tant que la migration n'est pas passee.`);

  console.log("\n1. Lecture de nos SIRET...");
  const sirets = await nosSirets();
  if (sirets.size === 0) {
    console.log("Rien a classer.");
    return;
  }

  console.log(`\n2. Etablissements (${path.basename(ZIP_ETAB)}, rattachement par SIRET)...`);
  const etab = await lireEtats(ZIP_ETAB, "StockEtablissement", ["siret", "etatAdministratifEtablissement", "dateDebut"], sirets, "A", "F");

  console.log(`\n3. Unites legales (${path.basename(ZIP_UNITE)}, rattachement par SIREN)...`);
  const sirens = new Set<string>();
  for (const s of sirets) sirens.add(s.slice(0, 9));
  console.log(`   ${fmt(sirens.size)} SIREN distincts`);
  const unite = await lireEtats(ZIP_UNITE, "StockUniteLegale", ["siren", "etatAdministratifUniteLegale", "dateDebut"], sirens, "A", "C");
  sirens.clear();

  console.log("\n4. Assemblage...");
  // Regroupement par valeurs identiques : un UPDATE ... IN (...) par lot.
  const groupes = new Map<string, Lot>();
  const stats = {
    fiches: sirets.size,
    trouvees: 0,
    ouverts: 0,
    fermes: 0,
    fermesEntrepriseCessee: 0,
    fermesEntrepriseActive: 0,
    fermesEntrepriseInconnue: 0,
    ouvertsEntrepriseCessee: 0,
    entrepriseInconnue: 0,
  };
  for (const [siret, v] of etab.etats) {
    stats.trouvees++;
    const etatAdmin = v[0] as "A" | "F";
    const dateFermeture = v.length > 1 ? v.slice(1) : null;
    const u = unite.etats.get(siret.slice(0, 9));
    const entrepriseEtat = u ? (u[0] as "A" | "C") : null;
    const entrepriseDate = u && u.length > 1 ? u.slice(1) : null;
    if (etatAdmin === "A") {
      stats.ouverts++;
      if (entrepriseEtat === "C") stats.ouvertsEntrepriseCessee++;
    } else {
      stats.fermes++;
      if (entrepriseEtat === "C") stats.fermesEntrepriseCessee++;
      else if (entrepriseEtat === "A") stats.fermesEntrepriseActive++;
      else stats.fermesEntrepriseInconnue++;
    }
    if (!entrepriseEtat) stats.entrepriseInconnue++;
    const cle = `${etatAdmin}|${dateFermeture || ""}|${entrepriseEtat || ""}|${entrepriseDate || ""}`;
    let g = groupes.get(cle);
    if (!g) {
      g = {
        patch: {
          etat_admin: etatAdmin,
          date_fermeture: dateFermeture,
          entreprise_etat: entrepriseEtat,
          entreprise_date_fermeture: entrepriseDate,
          etat_verifie_at: "", // pose au moment de l'ecriture
        },
        sirets: [],
      };
      groupes.set(cle, g);
    }
    g.sirets.push(siret);
  }
  etab.etats.clear();
  unite.etats.clear();
  sirets.clear();

  let requetes = 0;
  for (const g of groupes.values()) requetes += Math.ceil(g.sirets.length / LOT_ECRITURE);

  console.log("\n5. Resultat");
  console.log(`   fiches du perimetre            ${fmt(stats.fiches).padStart(12)}`);
  console.log(`   trouvees dans StockEtablissement ${fmt(stats.trouvees).padStart(10)}  (${pct(stats.trouvees, stats.fiches)})`);
  console.log(`   absentes du Stock (non touchees) ${fmt(stats.fiches - stats.trouvees).padStart(10)}`);
  console.log(`   etablissement ouvert  (A)      ${fmt(stats.ouverts).padStart(12)}  (${pct(stats.ouverts, stats.trouvees)} des trouvees)`);
  console.log(`   etablissement ferme   (F)      ${fmt(stats.fermes).padStart(12)}  (${pct(stats.fermes, stats.trouvees)} des trouvees)  attendu ~45 % +/- 7 (mesure du 02/09)`);
  console.log(`      dont entreprise cessee (C)  ${fmt(stats.fermesEntrepriseCessee).padStart(12)}  (${pct(stats.fermesEntrepriseCessee, stats.trouvees)})  attendu ~34 %`);
  console.log(`      dont entreprise active (A)  ${fmt(stats.fermesEntrepriseActive).padStart(12)}  (${pct(stats.fermesEntrepriseActive, stats.trouvees)})  attendu ~11 %`);
  if (stats.fermesEntrepriseInconnue) console.log(`      dont entreprise inconnue    ${fmt(stats.fermesEntrepriseInconnue).padStart(12)}`);
  if (stats.ouvertsEntrepriseCessee) console.log(`   ouverts mais entreprise cessee ${fmt(stats.ouvertsEntrepriseCessee).padStart(12)}  (incoherence Sirene, ecrite telle quelle)`);
  if (stats.entrepriseInconnue) console.log(`   SIREN absent de StockUniteLegale ${fmt(stats.entrepriseInconnue).padStart(10)}  (entreprise_etat restera null)`);
  console.log(`   groupes de valeurs distincts   ${fmt(groupes.size).padStart(12)}  -> ${fmt(requetes)} requetes UPDATE de ${LOT_ECRITURE} SIRET max`);
  console.log(`   temps ecoule ${secondes(tDebut)} s, memoire residente ${rssMo()} Mo`);

  if (!APPLIQUER) {
    console.log(`\nSIMULATION. ${fmt(stats.trouvees)} fiches seraient classees (${fmt(stats.ouverts)} A, ${fmt(stats.fermes)} F). Rien n'a ete ecrit.`);
    console.log("Relancer avec --appliquer.");
    return;
  }

  // ---------------------------------------------------------------- ecriture
  const horodatage = new Date().toISOString();
  for (const g of groupes.values()) g.patch.etat_verifie_at = horodatage;
  // Lots MIXTES de LOT_RPC fiches, quelles que soient leurs valeurs (cf. type Lot).
  const lots: Lot[] = [];
  let courant: Lot | null = null;
  for (const g of [...groupes.values()].sort((a, b) => b.sirets.length - a.sirets.length)) {
    for (const siret of g.sirets) {
      if (!courant) courant = { patch: g.patch, sirets: [], records: [] };
      courant.sirets.push(siret);
      courant.records!.push({
        siret,
        etat_admin: g.patch.etat_admin,
        date_fermeture: g.patch.date_fermeture,
        entreprise_etat: g.patch.entreprise_etat,
        entreprise_date_fermeture: g.patch.entreprise_date_fermeture,
      });
      if (courant.sirets.length >= LOT_RPC) {
        lots.push(courant);
        courant = null;
      }
    }
  }
  if (courant) lots.push(courant);
  groupes.clear();

  console.log(`\n6. Ecriture de ${fmt(lots.length)} lots (etat_verifie_at = ${horodatage})...`);

  // Garde-fou updated_at : on ecrit UNE fiche, on relit sa date de modification.
  // Si elle a bouge, un trigger touche updated_at et on s'arrete la.
  const premier = lots[0];
  const cobaye = premier.sirets[0];
  const avant = await lireUpdatedAt(cobaye);
  const essai = await ecrireLot({ patch: premier.patch, sirets: [cobaye] });
  if (essai.erreur) {
    console.error(`   ERREUR sur la premiere fiche (${cobaye}) : ${essai.erreur}. Arret.`);
    process.exit(1);
  }
  const apres = await lireUpdatedAt(cobaye);
  if (avant !== apres) {
    console.error(`   ARRET : updated_at de ${cobaye} a change (${avant} -> ${apres}). Un trigger touche updated_at.`);
    console.error("   Une seule fiche a ete ecrite. Retirer le trigger (ou l'adapter) avant de relancer.");
    process.exit(1);
  }
  console.log(`   garde-fou updated_at : inchange sur ${cobaye}, on continue.`);
  premier.sirets = premier.sirets.slice(1);
  if (premier.records) premier.records = premier.records.filter((r) => r.siret !== cobaye);

  let ecrites = 1;
  let ecritesA = premier.patch.etat_admin === "A" ? 1 : 0;
  let ecritesF = 1 - ecritesA;
  const enErreur: Lot[] = [];
  let erreursAffichees = 0;
  const tEcriture = Date.now();
  const journal = (i: number) => {
    const s = (Date.now() - tEcriture) / 1000;
    const debit = ecrites / Math.max(s, 1);
    console.log(
      `   lot ${fmt(i)}/${fmt(lots.length)} : ${fmt(ecrites)} fiches ecrites, ${fmt(enErreur.length)} lots en erreur, ${Math.round(debit * 60).toLocaleString("fr-FR")} fiches/min, rss ${rssMo()} Mo`
    );
  };

  const traiter = async (lot: Lot, i: number, rejeu: boolean) => {
    if (lot.sirets.length === 0) return;
    const r = await ecrireLot(lot);
    if (r.erreur) {
      if (!rejeu) enErreur.push(lot);
      if (erreursAffichees < 5) {
        erreursAffichees++;
        console.error(`   lot ${i} en erreur${rejeu ? " (rejeu)" : ""} : ${r.erreur}`);
      }
      return r;
    }
    ecrites += r.n;
    if (lot.records) {
      // Lot mixte : on compte ce qu'on a ENVOYE par etat (r.n ne distingue pas).
      const a = lot.records.filter((x) => x.etat_admin === "A").length;
      ecritesA += a;
      ecritesF += lot.records.length - a;
    } else if (lot.patch.etat_admin === "A") ecritesA += r.n;
    else ecritesF += r.n;
    if (r.n !== lot.sirets.length && erreursAffichees < 5) {
      erreursAffichees++;
      console.error(`   lot ${i} : ${r.n} lignes modifiees pour ${lot.sirets.length} SIRET (fiches sorties du perimetre entre-temps ?)`);
    }
    return r;
  };

  for (let i = 0; i < lots.length; i++) {
    await traiter(lots[i], i + 1, false);
    if ((i + 1) % 200 === 0) journal(i + 1);
  }
  journal(lots.length);

  let restent = 0;
  if (enErreur.length) {
    console.log(`\n7. Rejeu des ${fmt(enErreur.length)} lots en erreur...`);
    for (let i = 0; i < enErreur.length; i++) {
      const r = await traiter(enErreur[i], i + 1, true);
      if (r?.erreur) restent++;
    }
    console.log(`   ${fmt(enErreur.length - restent)} recuperes, ${fmt(restent)} toujours en erreur`);
  }

  console.log("\n8. Recompte en base (etat_verifie_at >= horodatage du passage)...");
  const total = await compter(horodatage);
  const nA = await compter(horodatage, "A");
  const nF = await compter(horodatage, "F");
  const ligne = (nom: string, base: number | null, ecrit: number) =>
    console.log(`   ${nom.padEnd(8)} base ${base === null ? "?".padStart(12) : fmt(base).padStart(12)}   ecrit ${fmt(ecrit).padStart(12)}   ${base === null ? "COMPTAGE IMPOSSIBLE" : base === ecrit ? "concorde" : "ECART"}`);
  ligne("total", total, ecrites);
  ligne("A", nA, ecritesA);
  ligne("F", nF, ecritesF);

  const ok = restent === 0 && total !== null && nA !== null && nF !== null && total === ecrites && nA === ecritesA && nF === ecritesF;
  console.log(`\n${ok ? "OK" : "NON VERIFIE"} : ${fmt(ecrites)} fiches classees en ${secondes(tEcriture)} s (${secondes(tDebut)} s au total).`);
  if (!ok) {
    if (total === null || nA === null || nF === null) {
      console.log("   Un comptage n'a pas repondu (delai de la base). Verifier en SQL :");
      console.log(`   select etat_admin, count(*) from pros where is_active and deleted_at is null and etat_verifie_at >= '${horodatage}' group by 1;`);
    }
    if (restent) console.log(`   ${fmt(restent)} lots toujours en erreur : relancer avec --appliquer --reprendre.`);
    process.exit(1);
  }
})();
