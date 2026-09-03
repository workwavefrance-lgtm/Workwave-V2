// Client SANS cookies : `supabase/server` appelle cookies(), ce qui bascule
// TOUTE page qui l'utilise en rendu DYNAMIQUE (ISR/cache CDN inactif).
// Ces requetes sont des lectures publiques -> client leger obligatoire.
import { cache } from "react";
import { getCityIdsByDepartment } from "@/lib/queries/cities";
import { createPublicClient } from "@/lib/supabase/public-client";
import { haversineKm } from "@/lib/utils/haversine";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type {
  PaginatedResult,
  ProCardData,
  ProWithRelations,
} from "@/lib/types/database";

// ── Réduction egress Supabase (11/06/2026, quota dépassé 188% sous crawl
// Google massif sur 1,8M pages) : 2 niveaux de select au lieu d'un seul fat
// "*, categories(*), cities(*, departments(*))" partout. ──
//
// Niveau FICHE/DASHBOARD : `*` sur pros (trop de consommateurs (fiche
// /artisan, dashboards BTP/AI) pour risquer d'oublier un champ), mais joins
// amincis : on ne tire plus categories.description / seo_keywords / naf_codes
// / popularity ni cities.equipments_count / bpe_synced_at, que AUCUN
// consommateur de ces requêtes ne lit (vérifié par grep 11/06/2026 : les
// dashboards lisent category.name + city.name/department_id/department.id ;
// la fiche lit category.{id,slug,name,vertical} + city.{name,slug,latitude,
// longitude,department.{name,code}} ; pro-seo-sections lit category.{name,
// slug} + city.name + department.name).
const PRO_SELECT: string =
  "*, category:categories(id, slug, name, vertical, parent_id), " +
  "city:cities(id, department_id, name, slug, postal_code, insee_code, population, latitude, longitude, country, " +
  "department:departments(id, code, name, region, country))";

// Niveau CARD : listings /[metier]/[location] (pages 2+), pros similaires,
// recherche, top-pros (page 1). UNIQUEMENT les champs consommés par
// ProCard / TopProCard / buildProSummary / buildProBadges / computeProScore
// et le schema ItemList des pages listing (address, phone, ratings).
// Mesuré : ~3,4 Ko -> ~1,1 Ko par row (-66%). Sur une page listing qui tire
// jusqu'à 500 rows (top-pros MAX_FETCH), c'est LE gros poste d'egress.
export const PRO_SELECT_CARD: string =
  "id, slug, name, address, postal_code, phone, description, logo_url, claimed_by_user_id, " +
  "category_id, city_id, google_rating, google_reviews_count, google_place_id, " +
  "workwave_reviews_avg, workwave_reviews_count, founded_year, certifications, rge_certified, " +
  "has_decennale, has_rc_pro, photos, profile_completion, " +
  "category:categories(id, slug, name, vertical), city:cities(id, name, slug)";

/**
 * Filtre « établissement OUVERT » d'après le registre Sirene.
 *
 * POURQUOI (mesure du 02/09/2026, décision Willy) : 45 % des fiches actives
 * sont des établissements FERMÉS (`etat_admin = 'F'`, écrit par
 * scripts/classer-etablissements.ts). La page d'une fiche fermée reste en
 * ligne et dit la vérité, mais un établissement fermé ne doit plus être
 * PROPOSÉ comme un pro disponible : ni dans les listings métier × lieu, ni
 * dans les comptes affichés, ni dans les pros similaires, ni dans le sitemap.
 *
 * COMMENT : `etat_admin` vaut 'A' OU n'a jamais été renseigné (null). Un
 * simple `.neq("etat_admin", "F")` ne suffit pas : en PostgREST, `neq`
 * EXCLUT les lignes à null, ce qui ferait disparaître toutes les fiches
 * jamais vérifiées (la majorité tant que le classement n'est pas passé
 * partout). D'où le `or` : `.or(FILTRE_OUVERTS)`.
 *
 * Équivalent SQL (RPC du sitemap, migrations/2026-09-02_sitemap_rpcs_ouverts.sql) :
 *   AND (etat_admin IS NULL OR etat_admin <> 'F')
 *
 * NE PAS l'appliquer : à la lecture d'une fiche par slug (la page fermée
 * existe), aux dashboards d'un pro connecté, ni au broadcast des projets
 * (lib/email/broadcast-btp-project.ts : un pro réclamé dont l'établissement a
 * déménagé reste une vraie personne qui veut des projets).
 */
export const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

// NB : le param `query` est volontairement non-générique : le type-parser de
// supabase-js ne sait pas parser les longs selects concaténés (TS2589) et le
// résultat est de toute façon casté en ProCardData[] au retour.
async function paginatedQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  page: number,
  pageSize: number
): Promise<PaginatedResult<ProCardData>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Sprint 13 : boost claimed pour mettre en premier les pros qui ont
  // reclame leur fiche (engagement reel) avant les fiches scrapees Sirene.
  // Incite les pros a reclamer leur fiche pour gagner en visibilite.
  const { data, count } = await query
    .range(from, to)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("name");

  const total = count || 0;

  return {
    data: (data as unknown as ProCardData[]) || [],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Pagination des pros d'une catégorie sur un ENSEMBLE de villes (1 ou
 * plusieurs). Utilise par la page dept et par l'agregation des arrondissements
 * (Marseille/Lyon/Paris : /[metier]/marseille agrège les 16 arrondissements).
 */
export async function getProsByCategoryAndCityIds(
  categoryId: number,
  cityIds: number[],
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  if (cityIds.length === 0) {
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }
  const supabase = createPublicClient();
  const query = supabase
    .from("pros")
    .select(PRO_SELECT_CARD, { count: "exact" })
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS);

  return paginatedQuery(query, page, pageSize);
}

export async function getProsByCategoryAndDepartment(
  categoryId: number,
  departmentId: number,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  const supabase = createPublicClient();

  // Récupérer les city_ids du département
  const cityIds = await getCityIdsByDepartment(departmentId);

  return getProsByCategoryAndCityIds(categoryId, cityIds, { page, pageSize });
}

/**
 * Count LÉGER (head:true → AUCUNE row transférée, juste le header
 * Content-Range). Pour les gardes anti-thin des pages programmatiques
 * (/[metier]/urgence/[ville]) sans payer l'egress d'un listing complet.
 */
export async function countProsByCategoryAndCityIds(
  categoryId: number,
  cityIds: number[]
): Promise<number> {
  if (cityIds.length === 0) return 0;
  const supabase = createPublicClient();
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS);
  return count || 0;
}

/**
 * Mini-cartes pros (nom + slug uniquement) : select minimal pour l'egress
 * (~60 octets/row vs ~1,1 Ko en PRO_SELECT_CARD). Même tri que les listings
 * (claimed d'abord, puis nom).
 */
export async function getProMiniCardsByCategoryAndCityIds(
  categoryId: number,
  cityIds: number[],
  limit: number = 3
): Promise<{ id: number; slug: string; name: string }[]> {
  if (cityIds.length === 0) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("pros")
    .select("id, slug, name")
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("name")
    .limit(limit);
  return (data as { id: number; slug: string; name: string }[]) || [];
}

export async function getProsByCategoryAndCity(
  categoryId: number,
  cityId: number,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  const supabase = createPublicClient();
  const query = supabase
    .from("pros")
    .select(PRO_SELECT_CARD, { count: "exact" })
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS);

  return paginatedQuery(query, page, pageSize);
}

// `cache` de React regroupe les appels IDENTIQUES faits pendant le rendu d'une
// meme page. Ici c'est essentiel : `generateMetadata` et la page appellent tous
// les deux `getProBySlug(slug)` : mesure du 09/08/2026 sur une fiche pro, 8
// requetes Supabase dont exactement 1 doublon, et c'est celle-ci.
//
// Next faisait deja ce regroupement, mais au niveau de la REPONSE HTTP, en la
// dedoublant (`tee()`) et en gardant la branche non lue jusqu'au passage du
// ramasse-miettes : 512 Mo retenus en production (cf. lib/supabase/fetch-supabase.ts).
// Le regroupement au niveau du RESULTAT est strictement meilleur : la 2e demande
// ne declenche aucune requete du tout, et n'alloue rien.
export const getProBySlug = cache(async function getProBySlug(
  slug: string
): Promise<ProWithRelations | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .eq("is_active", true)
    .single();

  return data as ProWithRelations | null;
});

export async function getProByUserId(
  userId: string
): Promise<ProWithRelations | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("claimed_by_user_id", userId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .maybeSingle();

  return data as ProWithRelations | null;
}

/**
 * Recupere la fiche Workwave AI d'un user authentifie.
 * Filtre strict sur category_id in AI_CATEGORY_IDS (tech 43-48 + business/creatif 79-87).
 *
 * Fix #14 : si un user a a la fois une fiche BTP et AI (rare mais possible),
 * getProByUserId() generique retournait la 1ere trouvee (ordre indefini),
 * provocant un redirect en boucle dans le dashboard AI. Cette fonction force
 * le filtre AI.
 */
// 14 categories Workwave AI : import depuis helpers (source unique de verite).
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
const AI_CATEGORY_IDS_QUERY = AI_CATEGORY_IDS as unknown as number[];
export async function getAiProByUserId(
  userId: string
): Promise<ProWithRelations | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("claimed_by_user_id", userId)
    .in("category_id", AI_CATEGORY_IDS_QUERY)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("id", { ascending: false }) // si plusieurs, prendre la plus recente
    .limit(1)
    .maybeSingle();

  return data as ProWithRelations | null;
}

/**
 * Recupere la fiche BTP (Workwave BTP) d'un user authentifie.
 * Filtre strict sur category_id NOT IN AI_CATEGORY_IDS (donc tout sauf 43-48 + 79-87).
 */
export async function getBtpProByUserId(
  userId: string
): Promise<ProWithRelations | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("claimed_by_user_id", userId)
    .not("category_id", "in", `(${AI_CATEGORY_IDS_QUERY.join(",")})`)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as ProWithRelations | null;
}

export async function getSimilarPros(
  categoryId: number,
  cityId: number,
  excludeSlug: string,
  limit: number = 5
): Promise<ProCardData[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("pros")
    .select(PRO_SELECT_CARD)
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .eq("is_active", true)
    // Une fiche ouverte ne propose jamais un établissement fermé en voisin.
    .or(FILTRE_OUVERTS)
    .limit(limit);

  // 🔴 L'erreur est RELEVEE, elle n'est pas convertie en liste vide.
  //
  // Corrige le 01/09/2026, signale par la relecture croisee de l'audit integral.
  // Cette fonction est appelee sur le chemin NOMINAL de chaque fiche artisan. En
  // avalant l'erreur, un hoquet de base produisait une page complete en 200,
  // mais privee de son bloc « pros similaires », donc de ses liens internes
  // sortants. Et cette version amputee etait mise en cache par l'ISR pour
  // 30 jours (`revalidate` de app/(public)/artisan/[slug]/page.tsx).
  //
  // Autrement dit : une seconde de base capricieuse coutait un mois de maillage
  // interne sur la fiche concernee, sans que rien ne le signale. Sur 2,4 millions
  // de fiches et un site qui vit de la decouverte par les liens, c'est cher paye.
  //
  // Relever l'erreur produit une 500, que le cache ISR ne conserve PAS et que
  // Google reessaie. Une page absente une minute vaut mieux qu'une page amputee
  // pendant un mois. C'est le meme arbitrage que pour la fiche elle-meme.
  if (error) {
    throw new Error(
      `getSimilarPros a echoue (categorie ${categoryId}, ville ${cityId}) : ${error.message}`,
    );
  }

  return (data as unknown as ProCardData[]) || [];
}

export type ProsEnActiviteProches = {
  /** Jusqu'à `limit` fiches en activité, même métier, la commune d'abord. */
  pros: ProCardData[];
  /** Vrai compte (exact) des fiches en activité de ce métier dans la commune. */
  totalVille: number;
  /** true si la commune n'a pas suffi et qu'on a complété avec les voisines. */
  completeAvecVoisines: boolean;
};

/**
 * Fiches EN ACTIVITÉ du même métier, pour une fiche d'établissement FERMÉ
 * (02/09/2026 : 45 % des fiches sont fermées d'après Sirene ; la page reste
 * en ligne, dit la vérité, et renvoie vers des pros qui répondent encore).
 *
 * La commune d'abord, en une seule requête qui ramène AUSSI le compte exact
 * (`count: "exact"` + `limit` : PostgREST renvoie le total dans Content-Range
 * sans transférer les lignes au-delà de la limite). Si la commune ne suffit
 * pas, on complète avec les communes voisines déjà calculées par la page
 * (getNearbyCities), sans nouvelle requête sur `cities`.
 *
 * Erreurs RELEVÉES, jamais converties en liste vide : même arbitrage que
 * getSimilarPros ci-dessus, une 500 non mise en cache vaut mieux qu'une page
 * amputée figée 30 jours.
 */
export async function getProsEnActiviteProches(
  categoryId: number,
  cityId: number,
  excludeSlug: string,
  villesVoisinesIds: number[],
  limit: number = 10
): Promise<ProsEnActiviteProches> {
  const supabase = createPublicClient();
  const { data, count, error } = await supabase
    .from("pros")
    .select(PRO_SELECT_CARD, { count: "exact" })
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("name")
    .limit(limit);

  if (error) {
    throw new Error(
      `getProsEnActiviteProches a echoue (categorie ${categoryId}, ville ${cityId}) : ${error.message}`,
    );
  }

  const pros = ((data as unknown as ProCardData[]) || []).slice();
  const totalVille = count || 0;
  const manque = limit - pros.length;
  if (manque <= 0 || villesVoisinesIds.length === 0) {
    return { pros, totalVille, completeAvecVoisines: false };
  }

  const { data: voisins, error: erreurVoisins } = await supabase
    .from("pros")
    .select(PRO_SELECT_CARD)
    .eq("category_id", categoryId)
    .in("city_id", villesVoisinesIds)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("name")
    .limit(manque);

  if (erreurVoisins) {
    throw new Error(
      `getProsEnActiviteProches (voisines) a echoue (categorie ${categoryId}, ville ${cityId}) : ${erreurVoisins.message}`,
    );
  }

  const ajout = (voisins as unknown as ProCardData[]) || [];
  return {
    pros: pros.concat(ajout),
    totalVille,
    completeAvecVoisines: ajout.length > 0,
  };
}

/**
 * Borne haute d'un encadrement `siret >= SIREN AND siret < sirenSuivant(SIREN)`,
 * qui laisse Postgres utiliser l'index de `siret` la ou `like 'SIREN%'` seul
 * balayait toute la table (collation non C). "392639928" -> "392639929".
 * Un SIREN de neuf 9 donne une borne a dix chiffres, donc un encadrement vide :
 * ce numero n'existe pas.
 */
function sirenSuivant(siren: string): string {
  return String(Number(siren) + 1).padStart(siren.length, "0");
}

/**
 * Pour une fiche d'établissement FERMÉ dont l'entreprise existe encore
 * (`entreprise_etat = 'A'`) : la fiche EN ACTIVITÉ d'un autre établissement
 * de la même entreprise, s'il y en a une en base. Même clé que
 * getFicheRemplacante : les 9 premiers chiffres du SIRET (le SIREN).
 * Toutes communes confondues, puisque l'entreprise a précisément déménagé.
 */
export async function getFicheActiveMemeSiren(
  siret: string,
  excludeSlug: string
): Promise<{ slug: string; name: string; cityName: string | null } | null> {
  const siren = String(siret).slice(0, 9);
  if (siren.length !== 9) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("pros")
    .select("slug, name, city:cities(name)")
    // 03/09/2026 : `like 'SIREN%'` seul ne passait pas par l'index de siret
    // (collation non C) et balayait 2,4 M de lignes : 7 s mesurees, soit un
    // depassement du delai PostgREST et une 500 sur chaque fiche fermee dont
    // l'entreprise existe encore. L'encadrement gte/lt utilise l'index
    // (140 ms) ; le `like` conserve exactement la semantique d'avant.
    .gte("siret", siren)
    .lt("siret", sirenSuivant(siren))
    .like("siret", `${siren}%`)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("id")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `getFicheActiveMemeSiren a echoue (SIREN ${siren}) : ${error.message}`,
    );
  }
  if (!data) return null;
  const row = data as unknown as { slug: string; name: string; city: { name: string } | null };
  return { slug: row.slug, name: row.name, cityName: row.city?.name ?? null };
}

export async function searchPros(
  query: string,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  const supabase = createPublicClient();
  const q = supabase
    .from("pros")
    .select(PRO_SELECT_CARD, { count: "exact" })
    .ilike("name", `%${query}%`)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(FILTRE_OUVERTS)
    // Anti-fuite vertical : la recherche BTP exclut les freelances AI
    // (leur fiche /artisan/[slug] redirige vers /ai/freelance, incoherent
    // dans un contexte BTP). Audit separation 29/05/2026.
    .not("category_id", "in", `(${AI_CATEGORY_IDS_QUERY.join(",")})`);

  return paginatedQuery(q, page, pageSize);
}

/**
 * Quand une fiche a ete retiree comme DOUBLON, retrouve la fiche conservee.
 *
 * 18/08/2026. Mesure : 122 447 fiches actives etaient des doublons du meme
 * SIREN dans la MEME commune. L'INSEE recense un etablissement par service
 * (le CCAS de Chatellerault en avait 13, dont 5 a la meme adresse) et on
 * publiait une page par etablissement. Google y voit du contenu duplique et
 * refuse d'indexer.
 *
 * Plutot que de laisser 122 447 pages en erreur, on renvoie vers la fiche
 * conservee : un visiteur arrivant par un vieux lien tombe sur la bonne
 * entreprise, et la redirection permanente transfere a la fiche gardee le
 * peu de valeur accumulee par les doublons.
 *
 * La recherche se fait sur les 9 premiers chiffres du numero (le SIREN,
 * commun a tous les etablissements) ET sur la commune : deux etablissements
 * dans deux villes differentes restent deux pages legitimes.
 *
 * Retourne null si la fiche est inconnue, si elle a ete supprimee pour une
 * autre raison (demande RGPD), ou s'il ne reste aucune fiche active : dans
 * ces cas la page doit bien repondre 404.
 */
export async function getFicheRemplacante(slug: string): Promise<string | null> {
  const sb = createPublicClient();
  const { data: retiree } = await sb
    .from("pros")
    .select("siret, city_id, deleted_at, do_not_contact")
    .eq("slug", slug)
    // Une suppression RGPD porte TOUJOURS do_not_contact = true. Ces
    // fiches-la doivent repondre 404 et surtout PAS rediriger vers un autre
    // etablissement de la meme entreprise : la personne a demande a ne plus
    // figurer, l'envoyer vers sa societe voisine reviendrait a la republier.
    .eq("do_not_contact", false)
    .not("deleted_at", "is", null)
    .limit(1)
    .maybeSingle();
  if (!retiree?.siret || !retiree.city_id) return null;

  const siren = String(retiree.siret).slice(0, 9);
  if (siren.length !== 9) return null;

  const { data: gardee } = await sb
    .from("pros")
    .select("slug")
    // Meme encadrement que getFicheActiveMemeSiren : index au lieu d'un balayage.
    .gte("siret", siren)
    .lt("siret", sirenSuivant(siren))
    .like("siret", `${siren}%`)
    .eq("city_id", retiree.city_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  return gardee?.slug || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// REPÈRES CALCULÉS d'une fiche enrichie (03/09/2026)
// ═══════════════════════════════════════════════════════════════════════════
//
// POURQUOI. Mesure du 02/09 : deux fiches voisines partagent 71 % de leur
// texte, dont 28 points imputables au couple métier x ville. Un fait CALCULÉ
// à partir de la position de cette fiche parmi ses voisines (rang
// d'ancienneté, confrères à 10 km, distance au centre) est unique par
// construction : deux voisines n'ont jamais le même rang ni les mêmes plus
// proches. Rien n'est inventé : tout est compté en base ou dérivé de
// coordonnées enregistrées.
//
// PÉRIMÈTRE. Appelé UNIQUEMENT pour les fiches qui ont `sirene_enrichi_at`
// (2 000 au 03/09, 2,3 M à terme) : la page ne paie ces requêtes que là où
// elles produisent quelque chose. Requêtes légères : comptes `head` (aucune
// ligne transférée), une lecture de `cities` bornée par une boîte de 10 km,
// et une lecture de pros limitée à 5 colonnes et 300 lignes.
//
// ERREURS RELEVÉES, jamais converties en « rien à afficher » : même
// arbitrage que getSimilarPros (une 500 non mise en cache vaut mieux qu'une
// page amputée figée 30 jours).

export type ProcheFiche = {
  slug: string;
  name: string;
  cityName: string | null;
  distanceKm: number;
};

export type ReperesFiche = {
  /** Rang par date de création parmi les fiches ouvertes de même métier dans
   *  la commune (1 = la plus ancienne). `total` = fiches dont la date est
   *  connue, `totalCommune` = toutes les fiches ouvertes du métier dans la
   *  commune. Null si moins de 3 dates connues, ou si moins de 80 % des
   *  fiches de la commune ont une date (mesure du 03/09 : Bordeaux,
   *  architectes, 11 datées sur 172 ouvertes ; un « 7e sur 11 » y serait
   *  faux). */
  rangAnciennete: { rang: number; total: number; totalCommune: number } | null;
  /** Fiches ouvertes de même métier dans les communes dont le centre est à
   *  moins de 10 km (la commune de la fiche comprise), fiche exclue. Null si
   *  aucune coordonnée. `plusProches` : parmi les adresses GÉOLOCALISÉES
   *  (etab_latitude) à moins de 10 km, distance exacte ; vide si aucune ou
   *  si la lecture a été tronquée (on n'affirme pas « les plus proches » sur
   *  un échantillon). */
  confreres: { total: number; plusProches: ProcheFiche[] } | null;
  /** Distance entre l'adresse de l'établissement et le centre de sa commune,
   *  en km. Null sans coordonnées d'établissement, ou si elles tombent à
   *  moins de 300 m du centre (géocodage au centre de la commune, rien à dire),
   *  ou à plus de 30 km (coordonnées douteuses). */
  distanceCentreKm: number | null;
};

const RAYON_CONFRERES_KM = 10;
const PLAFOND_LIGNES_PROCHES = 300;
/** Au-delà, les coordonnées de l'établissement contredisent sa commune : on
 *  ne s'en sert pas (ni pour le point de référence, ni pour la distance). */
const ECART_MAX_ETAB_COMMUNE_KM = 30;

function boite(lat: number, lng: number, rayonKm: number): { latMin: number; latMax: number; lngMin: number; lngMax: number } {
  const dLat = rayonKm / 111.2;
  const dLng = rayonKm / (111.2 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return { latMin: lat - dLat, latMax: lat + dLat, lngMin: lng - dLng, lngMax: lng + dLng };
}

export const getReperesFiche = cache(async function getReperesFiche(pro: {
  id: number;
  category_id: number;
  city_id: number | null;
  founding_date: string | null;
  etab_latitude: number | null;
  etab_longitude: number | null;
  city: { id: number; name: string; latitude: number | null; longitude: number | null } | null;
}): Promise<ReperesFiche> {
  const supabase = createPublicClient();

  // ── Point de référence : l'adresse exacte si elle est cohérente avec la
  // commune, sinon le centre de la commune. ──
  const villeLat = pro.city?.latitude ?? null;
  const villeLng = pro.city?.longitude ?? null;
  let refLat = villeLat;
  let refLng = villeLng;
  let distanceCentreKm: number | null = null;
  if (pro.etab_latitude != null && pro.etab_longitude != null) {
    const ecart =
      villeLat != null && villeLng != null
        ? haversineKm(pro.etab_latitude, pro.etab_longitude, villeLat, villeLng)
        : null;
    if (ecart === null || ecart <= ECART_MAX_ETAB_COMMUNE_KM) {
      refLat = pro.etab_latitude;
      refLng = pro.etab_longitude;
      if (ecart !== null && ecart >= 0.3) distanceCentreKm = Math.round(ecart * 10) / 10;
    }
  }

  // ── Rang d'ancienneté : deux comptes `head`, en parallèle avec la lecture
  // des communes voisines (indépendants). ──
  const calculRang = async (): Promise<ReperesFiche["rangAnciennete"]> => {
    const dateIso = pro.founding_date ? String(pro.founding_date).slice(0, 10) : null;
    if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso) || pro.city_id == null) return null;
    const base = () =>
      supabase
        .from("pros")
        .select("id", { count: "exact", head: true })
        .eq("category_id", pro.category_id)
        .eq("city_id", pro.city_id as number)
        .is("deleted_at", null)
        .eq("is_active", true)
        .or(FILTRE_OUVERTS);
    const [plusAnciennes, avecDate, commune] = await Promise.all([
      base().lt("founding_date", dateIso),
      base().not("founding_date", "is", null),
      base(),
    ]);
    if (plusAnciennes.error) {
      throw new Error(`getReperesFiche (rang) a échoué (pro ${pro.id}) : ${plusAnciennes.error.message}`);
    }
    if (avecDate.error) {
      throw new Error(`getReperesFiche (total datées) a échoué (pro ${pro.id}) : ${avecDate.error.message}`);
    }
    if (commune.error) {
      throw new Error(`getReperesFiche (total commune) a échoué (pro ${pro.id}) : ${commune.error.message}`);
    }
    const total = avecDate.count ?? 0;
    const totalCommune = commune.count ?? 0;
    if (total < 3 || total < 0.8 * totalCommune) return null;
    return { rang: (plusAnciennes.count ?? 0) + 1, total, totalCommune };
  };

  // ── Confrères à 10 km. ──
  const calculConfreres = async (): Promise<ReperesFiche["confreres"]> => {
    if (refLat == null || refLng == null) return null;
    const b = boite(refLat, refLng, RAYON_CONFRERES_KM);
    // `cities` : 35 163 lignes, la boîte en garde quelques dizaines.
    const { data: villes, error: erreurVilles } = await supabase
      .from("cities")
      .select("id, name, latitude, longitude")
      .gte("latitude", b.latMin)
      .lte("latitude", b.latMax)
      .gte("longitude", b.lngMin)
      .lte("longitude", b.lngMax)
      .limit(1000);
    if (erreurVilles) {
      throw new Error(`getReperesFiche (communes) a échoué (pro ${pro.id}) : ${erreurVilles.message}`);
    }
    const communes = new Map<number, { name: string; latitude: number; longitude: number }>();
    for (const v of (villes || []) as { id: number; name: string; latitude: number | null; longitude: number | null }[]) {
      if (v.latitude == null || v.longitude == null) continue;
      if (haversineKm(refLat, refLng, v.latitude, v.longitude) <= RAYON_CONFRERES_KM) {
        communes.set(v.id, { name: v.name, latitude: v.latitude, longitude: v.longitude });
      }
    }
    // La commune de la fiche compte toujours, même si son centre est loin de
    // l'adresse (grandes communes rurales).
    if (pro.city && pro.city.latitude != null && pro.city.longitude != null && !communes.has(pro.city.id)) {
      communes.set(pro.city.id, { name: pro.city.name, latitude: pro.city.latitude, longitude: pro.city.longitude });
    }
    const ids = [...communes.keys()];
    if (ids.length === 0) return { total: 0, plusProches: [] };

    const [compte, geolocalises] = await Promise.all([
      supabase
        .from("pros")
        .select("id", { count: "exact", head: true })
        .eq("category_id", pro.category_id)
        .in("city_id", ids)
        .neq("id", pro.id)
        .is("deleted_at", null)
        .eq("is_active", true)
        .or(FILTRE_OUVERTS),
      supabase
        .from("pros")
        .select("slug, name, city_id, etab_latitude, etab_longitude")
        .eq("category_id", pro.category_id)
        .in("city_id", ids)
        .neq("id", pro.id)
        .is("deleted_at", null)
        .eq("is_active", true)
        .or(FILTRE_OUVERTS)
        .gte("etab_latitude", b.latMin)
        .lte("etab_latitude", b.latMax)
        .gte("etab_longitude", b.lngMin)
        .lte("etab_longitude", b.lngMax)
        .limit(PLAFOND_LIGNES_PROCHES),
    ]);
    if (compte.error) {
      throw new Error(`getReperesFiche (compte à 10 km) a échoué (pro ${pro.id}) : ${compte.error.message}`);
    }
    if (geolocalises.error) {
      throw new Error(`getReperesFiche (plus proches) a échoué (pro ${pro.id}) : ${geolocalises.error.message}`);
    }
    const lignes = (geolocalises.data || []) as {
      slug: string;
      name: string;
      city_id: number | null;
      etab_latitude: number | null;
      etab_longitude: number | null;
    }[];
    let plusProches: ProcheFiche[] = [];
    // Lecture tronquée = on ne sait pas si les plus proches sont dedans : on
    // n'affirme rien. Le compte, lui, reste exact.
    if (lignes.length < PLAFOND_LIGNES_PROCHES) {
      plusProches = lignes
        .filter((l) => l.etab_latitude != null && l.etab_longitude != null)
        .map((l) => ({
          slug: l.slug,
          name: l.name,
          cityName: (l.city_id != null && communes.get(l.city_id)?.name) || null,
          distanceKm: haversineKm(refLat as number, refLng as number, l.etab_latitude as number, l.etab_longitude as number),
        }))
        .filter((p) => p.distanceKm <= RAYON_CONFRERES_KM)
        .sort((a, c) => a.distanceKm - c.distanceKm)
        .slice(0, 3);
    }
    return { total: compte.count ?? 0, plusProches };
  };

  const [rangAnciennete, confreres] = await Promise.all([calculRang(), calculConfreres()]);
  return { rangAnciennete, confreres, distanceCentreKm };
});
