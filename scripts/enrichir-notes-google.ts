/**
 * Enrichit les fiches pros avec leur NOTE GOOGLE, leur NOMBRE D'AVIS et leurs
 * HORAIRES — uniquement quand l'identite de l'entreprise est CERTAINE.
 *
 * ------------------------------------------------------------------------
 * POURQUOI CE SCRIPT PLUTOT QUE `enrich-pros-google-places.ts`
 * ------------------------------------------------------------------------
 * L'ancien script rapproche par NOM + VILLE. Mesure faite le 11/08/2026 sur
 * 22 fiches reelles : ce rapprochement se trompe la moitie du temps.
 *
 *     MARTINE ABRAHAMSE   -> "Martine Pressing"        (un pressing)
 *     THIERRY MALAURENT   -> "Martaud Thierry"         (autre personne)
 *     ADELF'SERVICES      -> "Centre Services Vif"     (mot commun : "services")
 *     ELIOR SERVICES      -> "DERICHEBOURG Facility"   (meme zone d'activite)
 *
 * Un prenom ne distingue personne, "services" non plus, et deux entreprises
 * concurrentes partagent souvent une adresse en zone d'activite. C'est le meme
 * mecanisme qui, via Apify en mai 2026, avait colle le telephone d'une personne
 * sur l'entreprise d'une autre — 857 fiches touchees, une plainte RGPD.
 *
 * ------------------------------------------------------------------------
 * LA CLE FIABLE
 * ------------------------------------------------------------------------
 * On n'accepte un rapprochement QUE si Google renvoie EXACTEMENT le meme
 * telephone ou le meme nom de domaine que celui deja en base. Ces deux
 * elements ne se partagent pas entre deux entreprises : la correspondance est
 * binaire, pas approximative. Aucun faux positif possible.
 *
 * Consequence : on ne traite que les 34 774 fiches qui ont deja un telephone
 * ou un site web. Ce ne sont PAS de nouvelles coordonnees qu'on cherche — ce
 * sont des notes et des horaires sur des fiches qu'on sait identifier.
 *
 * ------------------------------------------------------------------------
 * GARDE-FOU FACTURATION
 * ------------------------------------------------------------------------
 * Google facture des le 5 001e appel du mois (17 $ les 1 000). Le compteur est
 * persiste sur disque et remis a zero au changement de mois. Le script REFUSE
 * de depasser, meme si on le relance dix fois. Willy n'a pas de budget : il ne
 * doit pas pouvoir se reveiller avec une facture.
 *
 * ------------------------------------------------------------------------
 * USAGE
 *   npx tsx scripts/enrichir-notes-google.ts                  # simulation, 20 fiches
 *   npx tsx scripts/enrichir-notes-google.ts --appliquer      # ecrit, 20 fiches
 *   npx tsx scripts/enrichir-notes-google.ts --appliquer --nb 500
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const CLE = process.env.GOOGLE_PLACES_API_KEY;
if (!CLE) {
  console.error("GOOGLE_PLACES_API_KEY absente de .env.local");
  process.exit(1);
}

const APPLIQUER = process.argv.includes("--appliquer");
const NB = Number(process.argv[process.argv.indexOf("--nb") + 1]) || 20;

// Palier gratuit "Place Details Pro" : 5 000 appels par mois. On s'arrete a
// 4 800 pour garder une marge (un appel de test, un retry...).
const QUOTA_MENSUEL = 4800;
const COMPTEUR = path.resolve(process.cwd(), ".google-places-quota.json");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// --- compteur d'appels, persiste, remis a zero chaque mois ---
function lireCompteur(mois: string): number {
  try {
    const j = JSON.parse(fs.readFileSync(COMPTEUR, "utf8"));
    return j.mois === mois ? j.appels : 0;
  } catch {
    return 0;
  }
}
function ecrireCompteur(mois: string, appels: number) {
  fs.writeFileSync(COMPTEUR, JSON.stringify({ mois, appels }, null, 2));
}

// --- normalisations pour la comparaison EXACTE ---
function chiffresTel(t: string | null): string {
  if (!t) return "";
  const d = t.replace(/[^\d]/g, "");
  // +33 6 12... et 06 12... doivent se comparer : on ramene au format national.
  if (d.startsWith("33") && d.length > 10) return "0" + d.slice(2);
  if (d.startsWith("32") && d.length > 9) return "0" + d.slice(2); // Belgique
  return d;
}
function domaine(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

type Pro = {
  id: number;
  name: string;
  phone: string | null;
  website: string | null;
  cities: { name: string; postal_code: string | null } | null;
};

function appelPlaces(textQuery: string) {
  return fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": CLE!,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.nationalPhoneNumber,places.websiteUri," +
        "places.rating,places.userRatingCount,places.regularOpeningHours,places.primaryType",
    },
    body: JSON.stringify({ textQuery, languageCode: "fr", maxResultCount: 3 }),
  });
}

(async () => {
  const mois = new Date().toISOString().slice(0, 7);
  let appels = lireCompteur(mois);
  const restants = QUOTA_MENSUEL - appels;

  console.log(`Mois ${mois} : ${appels} appels deja consommes, ${restants} restants sur ${QUOTA_MENSUEL} gratuits`);
  if (restants <= 0) {
    console.log("Quota gratuit du mois epuise. On s'arrete — aucun appel facture.");
    return;
  }
  const aTraiter = Math.min(NB, restants);
  console.log(`${APPLIQUER ? "ECRITURE EN BASE" : "SIMULATION (aucune ecriture)"} — ${aTraiter} fiches\n`);

  let trouves = 0, ecrits = 0, refuses = 0, sansResultat = 0, sansCle = 0, erreurs = 0;

  /**
   * Marque la fiche comme TENTEE, quel que soit le resultat.
   *
   * POURQUOI MARQUER AUSSI LES ECHECS — mesure du lot du 11/08/2026 :
   * sur 1 000 fiches, 777 sont inconnues de Google. Sans marquage, la requete
   * de selection (`google_enriched_at IS NULL`) les represente a CHAQUE
   * lancement : le quota gratuit se viderait indefiniment sur les memes fiches,
   * 78 % des appels perdus.
   *
   * La colonne signifie donc "un appel a deja ete depense pour celle-ci", pas
   * "on a trouve quelque chose". Pour tout retenter un jour (Google finit par
   * referencer de nouveaux etablissements) :
   *     UPDATE pros SET google_enriched_at = NULL WHERE google_rating IS NULL;
   */
  async function marquer(id: number, extra: Record<string, unknown> = {}) {
    if (!APPLIQUER) return;
    const { error } = await sb
      .from("pros")
      .update({ google_enriched_at: new Date().toISOString(), ...extra })
      .eq("id", id);
    if (error) console.log(`      ECRITURE REFUSEE : ${error.message}`);
    else if (Object.keys(extra).length > 0) ecrits++;
  }

  // PAGINATION PAR CURSEUR, ET SURTOUT PAS `.limit(aTraiter)`.
  //
  // PostgREST plafonne toute requete a 1 000 lignes (reglage "Max Rows"). Un
  // `.limit(3000)` est donc ramene a 1 000 EN SILENCE, sans erreur : le lot du
  // 11/08 a traite exactement 1 000 fiches (141 + 42 + 777 + 40 rejets HTTP)
  // au lieu des 3 000 demandees. Un total parfaitement rond est toujours une
  // troncature, jamais une donnee reelle.
  //
  // C'est la sixieme fois que ce plafond mord ce projet (sitemap 30/04,
  // match-rge 09/05, RPC sitemap 08/06, API Sirene 04/08...). D'ou le squelette
  // canonique : pages de 1 000, curseur sur `id`, arret quand la page est VIDE
  // — jamais sur `rows.length < PAGE`.
  const PAGE = 1000;
  let dernierId = 0;
  let appelsFaits = 0;

  boucle: while (appelsFaits < aTraiter) {
    const { data, error } = await sb
      .from("pros")
      .select("id, name, phone, website, cities(name, postal_code)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .is("google_enriched_at", null)
      .or("phone.not.is.null,website.not.is.null")
      .gt("id", dernierId)
      .order("id")
      .limit(PAGE);
    if (error) {
      console.error("ERREUR lecture :", error.message);
      process.exit(1);
    }
    const lot = (data || []) as unknown as Pro[];
    if (lot.length === 0) break;

    for (const p of lot) {
    dernierId = p.id;
    if (appelsFaits >= aTraiter) break boucle;
    // Sans telephone ET sans domaine exploitable, la requete partirait VIDE :
    // Google repond HTTP 400 et le compteur est consomme pour rien. Certaines
    // fiches ont un `website` present mais inexploitable (URL malformee), d'ou
    // le controle sur le domaine extrait et non sur la simple presence du champ.
    const requete = p.phone || domaine(p.website);
    if (!requete) { sansCle++; continue; }

    // ON CHERCHE PAR LE NUMERO, PAS PAR LE NOM.
    // Mesure du 11/08/2026 sur deux echantillons de 20 fiches :
    //   recherche par nom      1 identifie, 11 rejetes (et des faux positifs
    //                          des qu'on relache le controle)
    //   recherche par numero   3 identifies, 0 faux positif
    // Google identifie l'etablissement directement a partir du numero : la
    // reponse est binaire, il le trouve ou il ne le trouve pas. C'est ce qui
    // supprime toute possibilite de rapprochement approximatif.
    // Faute de telephone, on cherche par le domaine du site web.
    //
    // JAMAIS de repli sur le nom. Le 11/08 j'avais laisse un
    // `|| \`${p.name} ${ville}\`` : "Kevin VACHE" a matche le restaurant
    // "O'la vache". La recherche par nom est precisement celle qu'on a rejetee
    // — la remettre en secours revient a la remettre tout court. Une fiche sans
    // telephone ni site n'est pas traitee, point.
    //
    // LE FORMAT DU NUMERO NE SE TOUCHE PAS. Mesure du 11/08 sur 8 fiches deja
    // identifiees avec certitude :
    //     format brut international ("+33 5 49 43 86 68")  8 trouvees sur 8
    //     format compact ("0549438668")                    1 trouvee sur 8,
    //                                                      et c'etait un FAUX
    // Passer au format compact aurait donc detruit le rendement en croyant
    // corriger un defaut.
    let r = await appelPlaces(requete);

    // ~4 % des numeros declenchent un HTTP 400 "Coordinates are not a valid
    // input" : Google lit "+33 7 49 13 00 39" comme une latitude/longitude, a
    // cause du "+" suivi de nombres espaces. Les guillemets le forcent a lire
    // du texte. Mesure du 11/08 : l'erreur disparait, et sur deux numeros
    // connus bons le resultat reste STRICTEMENT identique (MSA Services POITOU,
    // Votre Toiture SRL). On n'essaie les guillemets qu'en second recours, pour
    // ne rien changer aux 96 % qui fonctionnent deja.
    if (r.status === 400) r = await appelPlaces(`"${requete}"`);

    // Un 400 n'est pas facture par Google : les deux tentatives comptent pour
    // un seul appel.
    appels++;
    appelsFaits++;
    ecrireCompteur(mois, appels);

    if (!r.ok) {
      // Une erreur HTTP est un defaut de NOTRE cote, pas un verdict de Google :
      // on ne marque pas la fiche, elle sera retentee au prochain lancement.
      erreurs++;
      console.log(`  ! ${p.name.slice(0, 34).padEnd(36)} HTTP ${r.status}`);
      continue;
    }
    const j = await r.json();
    const candidats = j.places || [];
    if (candidats.length === 0) {
      sansResultat++;
      await marquer(p.id);
      continue;
    }

    // LE CONTROLE : meme telephone OU meme domaine. Rien d'autre n'est accepte.
    const telBase = chiffresTel(p.phone);
    const domBase = domaine(p.website);
    const g = candidats.find((c: Record<string, string>) => {
      const memeTel = telBase && chiffresTel(c.nationalPhoneNumber) === telBase;
      const memeDom = domBase && domaine(c.websiteUri) === domBase;
      return memeTel || memeDom;
    });

    if (!g) {
      refuses++;
      await marquer(p.id);
      continue;
    }

    // GARDE-FOU DE VRAISEMBLANCE.
    // Meme avec un numero identique, la donnee de DEPART peut etre fausse :
    // l'enrichissement Apify de mai a colle le telephone de Brico Depot sur la
    // fiche "BRICODAB" et celui d'un E.Leclerc sur "ESTELLE LECLERC". Le
    // rapprochement est alors techniquement juste et le resultat absurde.
    // Un artisan n'est ni un hypermarche, ni un restaurant, ni une enseigne de
    // bricolage — et il n'a pas 8 000 avis.
    const TYPES_INTERDITS = /supermarket|hypermarket|grocery|store|restaurant|cafe|bar|hotel|bank|pharmacy|gas_station|school|hospital|shopping/i;
    const typeSuspect = TYPES_INTERDITS.test(g.primaryType || "");
    const tropDAvis = (g.userRatingCount ?? 0) > 300;
    if (typeSuspect || tropDAvis) {
      refuses++;
      await marquer(p.id);
      console.log(
        `  ✗ ${p.name.slice(0, 32).padEnd(34)} REFUSE — ${
          typeSuspect ? `type "${g.primaryType}"` : `${g.userRatingCount} avis, invraisemblable pour un artisan`
        } (donnee de depart probablement fausse)`
      );
      continue;
    }
    trouves++;
    const parQuoi = telBase && chiffresTel(g.nationalPhoneNumber) === telBase ? "telephone" : "domaine";
    const note = g.rating ?? null;
    const nbAvis = g.userRatingCount ?? null;
    const horaires = g.regularOpeningHours?.weekdayDescriptions ?? null;

    console.log(
      `  ✓ ${p.name.slice(0, 32).padEnd(34)} ${String(note ?? "—").padStart(4)}/5` +
      ` ${String(nbAvis ?? 0).padStart(5)} avis  ${horaires ? "horaires" : "        "}  (${parQuoi})`
    );

    const maj: Record<string, unknown> = { google_place_id: g.id };
    if (note !== null) maj.google_rating = note;
    if (nbAvis !== null) maj.google_reviews_count = nbAvis;
    // On n'ecrase JAMAIS des horaires deja saisis par le pro lui-meme.
    if (horaires) maj.opening_hours = horaires;
    await marquer(p.id, maj);

    await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log(`\n  identifies avec certitude : ${trouves}`);
  if (sansCle) console.log(`  ignorees (ni telephone ni domaine exploitable) : ${sansCle} — aucun appel consomme`);
  console.log(`  refuses (ni tel ni domaine identique) : ${refuses}`);
  console.log(`  absents de Google : ${sansResultat}`);
  if (erreurs) console.log(`  erreurs HTTP (fiche non marquee, sera retentee) : ${erreurs}`);
  if (APPLIQUER) console.log(`  ecrits en base : ${ecrits}`);
  console.log(`\n  appels consommes ce mois : ${appels} / ${QUOTA_MENSUEL} gratuits`);
})();
