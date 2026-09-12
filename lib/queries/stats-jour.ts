/**
 * Requetes de la page admin /admin/statistiques.
 *
 * Cette page rapproche les volumes de plusieurs sources : événements du
 * formulaire, dépôts serveur, trafic, clics Google et
 * robots. La table `stats_jour` (une ligne par jour, alimentee par trois
 * producteurs independants : Umami + journal Traefik sur le VPS, Search
 * Console sur le Mac) rassemble tout cela. Cette page la croise avec `events`,
 * `projects` et `lead_unlocks`. Ces sources ne suivent pas une même cohorte :
 * elles ne permettent pas de calculer une conversion de visiteur en paiement.
 *
 * CONVENTIONS :
 *   - toutes les fenetres sont en jours UTC, comme `stats_jour.jour` (les
 *     producteurs bornent leurs mesures en UTC) : un evenement est rattache
 *     au jour UTC de son created_at, jamais a l'heure de Paris ;
 *   - la periode se termine HIER : le jour courant est incomplet chez tous
 *     les producteurs, l'afficher fausserait toute comparaison ;
 *   - NULL dans stats_jour = « pas encore mesure », JAMAIS zero : un total
 *     dont aucun jour n'est renseigne reste null, et la page ecrit
 *     « pas encore » a la place d'un 0 ;
 *   - chaque source (stats_jour, events, projects, lead_unlocks) est chargee
 *     separement et son erreur eventuelle est remontee telle quelle, pour
 *     que la page l'affiche dans le bloc concerne au lieu d'un zero ;
 *   - aucun count() sur une table entiere : tout est borne par date, et
 *     pagine par curseur sur `id` (PostgREST plafonne a 1000 lignes).
 */
import { getServiceClient } from "@/lib/supabase/service-client";
import { ANALYTICS_TEST_PRO_IDS, getAnalyticsTestUserIds, isAnalyticsTestActivity } from "@/lib/analytics/test-accounts";

// ============================================================
// Periode
// ============================================================

export const PERIODES = [7, 28, 90] as const;
export type Periode = (typeof PERIODES)[number];
export const PERIODE_DEFAUT: Periode = 28;

/** Lit `?periode=` : toute valeur hors 7/28/90 retombe sur 28. */
export function lirePeriode(brut: string | undefined): Periode {
  const n = Number(brut);
  return (PERIODES as readonly number[]).includes(n) ? (n as Periode) : PERIODE_DEFAUT;
}

/** Fenetre de jours UTC, bornes INCLUSES, au format AAAA-MM-JJ. */
export type Fenetre = { debut: string; fin: string; nbJours: number };

const JOUR_MS = 864e5;

function jourUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function decaler(jour: string, nbJours: number): string {
  return jourUtc(new Date(new Date(`${jour}T00:00:00Z`).getTime() + nbJours * JOUR_MS));
}

/** Periode actuelle (se termine hier UTC) et periode precedente contigue de meme longueur. */
export function fenetres(nbJours: Periode): { actuelle: Fenetre; precedente: Fenetre } {
  const hier = jourUtc(new Date(Date.now() - JOUR_MS));
  const debut = decaler(hier, -(nbJours - 1));
  const finPrec = decaler(debut, -1);
  const debutPrec = decaler(finPrec, -(nbJours - 1));
  return {
    actuelle: { debut, fin: hier, nbJours },
    precedente: { debut: debutPrec, fin: finPrec, nbJours },
  };
}

/** Liste des jours d'une fenetre, du plus ancien au plus recent. */
function joursDe(f: Fenetre): string[] {
  const out: string[] = [];
  for (let i = 0; i < f.nbJours; i++) out.push(decaler(f.debut, i));
  return out;
}

// ============================================================
// Types de sortie
// ============================================================

/** Un total sur une fenetre. `valeur` null = aucun jour mesure. */
export type Total = { valeur: number | null; joursMesures: number };

export type Compare = { actuel: Total; precedent: Total; ecartPct: number | null };

export type SourceMarche = "stats_jour" | "events" | "projects" | "lead_unlocks";

export type Marche = {
  cle: string;
  libelle: string;
  source: SourceMarche;
  /** null = pas mesure (stats_jour vide) ou source en erreur. */
  actuel: number | null;
  precedent: number | null;
  ecartPct: number | null;
  /** Part calculable dans un même ensemble (diffusés parmi les projets valides). */
  conversionPct: number | null;
  /** Meme conversion sur la periode precedente. */
  conversionPrecPct: number | null;
  indice?: string;
  /** Marche « groupe » : pas de nombre propre, ses sous-lignes portent les chiffres. */
  sous?: Marche[];
};

export type Ratio = {
  /** Projets valides pour 1 000 clics de listing ; null si aucun jour GSC mesure. */
  valeur: number | null;
  projets: number;
  clics: number;
  joursMesures: number;
};

export type JourLigne = {
  jour: string;
  sessions: number | null;
  sessionsListing: number | null;
  commences: number | null;
  envoyes: number | null;
  projetsValides: number | null;
  clicsGsc: number | null;
};

export type JourRobots = {
  jour: string;
  robotsDeclares: number | null;
  googlePassages: number | null;
  google5xx: number | null;
  aspirateurPages: number | null;
  aspirateurAdresses: number | null;
  err5xxTotal: number | null;
};

export type SourceTrafic = {
  cle: string;
  libelle: string;
  actuel: Total;
  precedent: Total;
  /** Part des sessions de la periode actuelle, en %. */
  partPct: number | null;
};

export type CompteurRobots = {
  cle: string;
  libelle: string;
  description: string;
  actuel: Total;
  precedent: Total;
  ecartPct: number | null;
  /** true quand une hausse est une mauvaise nouvelle (erreurs, aspirateurs). */
  hausseNegative: boolean;
};

export type Erreurs = {
  statsJour: string | null;
  events: string | null;
  projets: string | null;
  unlocks: string | null;
};

export type StatistiquesAdmin = {
  /** Derniere ecriture du script serveur dans stats_jour (maj_at max), ou null
   *  si la table est vide ou la lecture en erreur. Affiche en tete de page :
   *  un cron mort (secret tourne, conteneur arrete, route en 401) se voit
   *  a l'heure qui n'avance plus, au lieu de passer pour « tout va bien »
   *  (lecon du 20/08/2026 sur les garde-fous aveugles a leur propre panne). */
  derniereMajServeur: string | null;
  periode: { nbJours: Periode; actuelle: Fenetre; precedente: Fenetre };
  genereLe: string;
  erreurs: Erreurs;
  tete: {
    sessions: Compare;
    vues: Compare;
    clicsGsc: Compare;
    /** Part des clics Google sur les listings / les fiches, en %. */
    partListingPct: Compare;
    partFichePct: Compare;
  };
  entonnoir: Marche[];
  ratioCle: { actuel: Ratio; precedent: Ratio; ecartPct: number | null };
  parJour: JourLigne[];
  sources: { lignes: SourceTrafic[]; sessionsMesurees: Total };
  robots: { totaux: CompteurRobots[]; parJour: JourRobots[] };
};

// ============================================================
// Lignes brutes
// ============================================================

type LigneStatsJour = {
  jour: string;
  sessions: number | null;
  vues: number | null;
  sessions_depot: number | null;
  sessions_listing: number | null;
  sessions_fiche: number | null;
  sessions_accueil: number | null;
  src_google: number | null;
  src_bing: number | null;
  src_instagram: number | null;
  src_direct: number | null;
  src_autre: number | null;
  robots_declares: number | null;
  google_passages: number | null;
  google_5xx: number | null;
  aspirateur_pages: number | null;
  aspirateur_adresses: number | null;
  err_5xx_total: number | null;
  clics_gsc: number | null;
  impressions_gsc: number | null;
  clics_listing_gsc: number | null;
  clics_fiche_gsc: number | null;
};

type ColonneStatsJour = Exclude<keyof LigneStatsJour, "jour">;

type LigneEvent = {
  id: number;
  event_name: string;
  created_at: string;
  pro_id?: number | null;
  user_id?: string | null;
  metadata: { step?: number; name?: string; pro_id?: number | string; proId?: number | string } | null;
};

type LigneProjet = {
  id: number;
  created_at: string;
  broadcast_count: number | null;
};

type LigneUnlock = {
  id: number;
  created_at: string;
  pro_id: number | null;
  amount_cents: number | null;
};

type Resultat<T> = { ok: true; lignes: T[] } | { ok: false; erreur: string };

const EVENTS_ENTONNOIR = [
  "project_form_viewed",
  "project_form_started",
  "project_step_reached",
  "project_form_submitted",
];

// PostgREST plafonne a 1000 lignes par reponse : on pagine par curseur sur `id`
// (index primaire, range scan) et on s'arrete sur une page VIDE, jamais sur une
// page « plus courte que prevu » (lecon du 30/04/2026, recidive du 09/05).
const PAGE = 1000;

// ============================================================
// Chargement (une fonction par source, erreur remontee telle quelle)
// ============================================================

async function chargerStatsJour(debut: string, fin: string): Promise<Resultat<LigneStatsJour>> {
  const db = getServiceClient();
  const lignes: LigneStatsJour[] = [];
  // Curseur initial anterieur a toute ligne possible (Postgres refuse "0000-00-00").
  let dernier = "1970-01-01";
  while (true) {
    const { data, error } = await db
      .from("stats_jour")
      .select(
        "jour, sessions, vues, sessions_depot, sessions_listing, sessions_fiche, sessions_accueil, src_google, src_bing, src_instagram, src_direct, src_autre, robots_declares, google_passages, google_5xx, aspirateur_pages, aspirateur_adresses, err_5xx_total, clics_gsc, impressions_gsc, clics_listing_gsc, clics_fiche_gsc"
      )
      .gte("jour", debut)
      .lte("jour", fin)
      .gt("jour", dernier)
      .order("jour", { ascending: true })
      .limit(PAGE);
    if (error) return { ok: false, erreur: `stats_jour : ${error.message}` };
    const page = (data ?? []) as LigneStatsJour[];
    if (page.length === 0) break;
    lignes.push(...page);
    dernier = page[page.length - 1].jour;
  }
  return { ok: true, lignes };
}

async function chargerEvents(debutIso: string, finExcluIso: string): Promise<Resultat<LigneEvent>> {
  const db = getServiceClient();
  let testUserIds: ReadonlySet<string>;
  try {
    testUserIds = await getAnalyticsTestUserIds();
  } catch {
    return { ok: false, erreur: "events : impossible de vérifier les comptes de test." };
  }
  const lignes: LigneEvent[] = [];
  let dernier = 0;
  while (true) {
    const { data, error } = await db
      .from("events")
      .select("id, event_name, created_at, pro_id, user_id, metadata")
      .in("event_name", EVENTS_ENTONNOIR)
      .gte("created_at", debutIso)
      .lt("created_at", finExcluIso)
      .gt("id", dernier)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (error) return { ok: false, erreur: `events : ${error.message}` };
    const page = (data ?? []) as LigneEvent[];
    if (page.length === 0) break;
    lignes.push(...page.filter((event) => !isAnalyticsTestActivity(event, testUserIds)));
    dernier = page[page.length - 1].id;
  }
  return { ok: true, lignes };
}

async function chargerProjets(debutIso: string, finExcluIso: string): Promise<Resultat<LigneProjet>> {
  const db = getServiceClient();
  const lignes: LigneProjet[] = [];
  let dernier = 0;
  while (true) {
    const { data, error } = await db
      .from("projects")
      .select("id, created_at, broadcast_count")
      .gte("created_at", debutIso)
      .lt("created_at", finExcluIso)
      // Un projet supprime (RGPD) ou classe suspect par l'IA n'est pas un projet valide.
      .not("status", "in", "(deleted,suspicious)")
      .gt("id", dernier)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (error) return { ok: false, erreur: `projects : ${error.message}` };
    const page = (data ?? []) as LigneProjet[];
    if (page.length === 0) break;
    lignes.push(...page);
    dernier = page[page.length - 1].id;
  }
  return { ok: true, lignes };
}

async function chargerUnlocks(debutIso: string, finExcluIso: string): Promise<Resultat<LigneUnlock>> {
  const db = getServiceClient();
  const lignes: LigneUnlock[] = [];
  let dernier = 0;
  while (true) {
    const { data, error } = await db
      .from("lead_unlocks")
      .select("id, created_at, pro_id, amount_cents")
      .gte("created_at", debutIso)
      .lt("created_at", finExcluIso)
      .or(`pro_id.is.null,pro_id.not.in.(${ANALYTICS_TEST_PRO_IDS.join(",")})`)
      .gt("id", dernier)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (error) return { ok: false, erreur: `lead_unlocks : ${error.message}` };
    const page = (data ?? []) as LigneUnlock[];
    if (page.length === 0) break;
    lignes.push(...page.filter((u) => !isAnalyticsTestActivity(u)));
    dernier = page[page.length - 1].id;
  }
  return { ok: true, lignes };
}

// ============================================================
// Agregats par jour
// ============================================================

/** Compteurs d'evenements pour un jour UTC. `ecrans` = affichages par numero d'ecran. */
type JourEvents = {
  vus: number;
  commences: number;
  envoyes: number;
  ecrans: Map<number, { count: number; noms: Map<string, number> }>;
};

function jourEventsVide(): JourEvents {
  return { vus: 0, commences: 0, envoyes: 0, ecrans: new Map() };
}

export function agregerEvents(lignes: LigneEvent[]): Map<string, JourEvents> {
  const parJour = new Map<string, JourEvents>();
  for (const e of lignes) {
    const jour = e.created_at.slice(0, 10);
    const j = parJour.get(jour) ?? jourEventsVide();
    switch (e.event_name) {
      case "project_form_viewed":
        j.vus += 1;
        break;
      case "project_form_started":
        j.commences += 1;
        break;
      case "project_form_submitted":
        j.envoyes += 1;
        break;
      case "project_step_reached": {
        const step = e.metadata?.step;
        if (typeof step !== "number" || !Number.isInteger(step) || step < 1) break;
        const ecran = j.ecrans.get(step) ?? { count: 0, noms: new Map<string, number>() };
        ecran.count += 1;
        const nom = e.metadata?.name;
        if (typeof nom === "string" && nom) ecran.noms.set(nom, (ecran.noms.get(nom) ?? 0) + 1);
        j.ecrans.set(step, ecran);
        break;
      }
    }
    parJour.set(jour, j);
  }
  return parJour;
}

type JourProjets = { valides: number; diffuses: number };

export function agregerProjets(lignes: LigneProjet[]): Map<string, JourProjets> {
  const parJour = new Map<string, JourProjets>();
  for (const p of lignes) {
    const jour = p.created_at.slice(0, 10);
    const j = parJour.get(jour) ?? { valides: 0, diffuses: 0 };
    j.valides += 1;
    if ((p.broadcast_count ?? 0) > 0) j.diffuses += 1;
    parJour.set(jour, j);
  }
  return parJour;
}

type JourUnlocks = { total: number; payes: number; offerts: number };

export function agregerUnlocks(lignes: LigneUnlock[]): Map<string, JourUnlocks> {
  const parJour = new Map<string, JourUnlocks>();
  for (const u of lignes) {
    const jour = u.created_at.slice(0, 10);
    const j = parJour.get(jour) ?? { total: 0, payes: 0, offerts: 0 };
    j.total += 1;
    if ((u.amount_cents ?? 0) > 0) j.payes += 1;
    else j.offerts += 1;
    parJour.set(jour, j);
  }
  return parJour;
}

// ============================================================
// Totaux et comparaisons
// ============================================================

/** Somme d'une colonne stats_jour sur une fenetre : null si aucun jour renseigne. */
function totalStatsJour(
  lignes: Map<string, LigneStatsJour>,
  f: Fenetre,
  colonne: ColonneStatsJour
): Total {
  let somme = 0;
  let joursMesures = 0;
  for (const jour of joursDe(f)) {
    const v = lignes.get(jour)?.[colonne];
    if (v === null || v === undefined) continue;
    somme += v;
    joursMesures += 1;
  }
  return { valeur: joursMesures > 0 ? somme : null, joursMesures };
}

/** Somme d'un compteur calcule (events, projets, unlocks) : toujours mesure, meme a zero. */
function totalCalcule<T>(parJour: Map<string, T>, f: Fenetre, lire: (j: T) => number): Total {
  let somme = 0;
  for (const jour of joursDe(f)) {
    const j = parJour.get(jour);
    if (j) somme += lire(j);
  }
  return { valeur: somme, joursMesures: f.nbJours };
}

export function ecartPct(actuel: number | null, precedent: number | null): number | null {
  if (actuel === null || precedent === null || precedent === 0) return null;
  return Math.round(((actuel - precedent) / precedent) * 1000) / 10;
}

function pct(num: number | null, den: number | null): number | null {
  if (num === null || den === null || den === 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

function comparer(actuel: Total, precedent: Total): Compare {
  return { actuel, precedent, ecartPct: ecartPct(actuel.valeur, precedent.valeur) };
}

function totalPct(num: Total, den: Total): Total {
  const valeur = pct(num.valeur, den.valeur);
  return { valeur, joursMesures: Math.min(num.joursMesures, den.joursMesures) };
}

function indiceCouverture(t: Total, nbJours: number): string | undefined {
  if (t.valeur === null || t.joursMesures >= nbJours) return undefined;
  return `sur ${t.joursMesures} jour${t.joursMesures > 1 ? "s" : ""} mesuré${t.joursMesures > 1 ? "s" : ""} sur ${nbJours}`;
}

// ============================================================
// Entonnoir
// ============================================================

export type Contexte = {
  fA: Fenetre;
  fP: Fenetre;
  statsJour: Map<string, LigneStatsJour> | null;
  events: Map<string, JourEvents> | null;
  projets: Map<string, JourProjets> | null;
  unlocks: Map<string, JourUnlocks> | null;
};

function marcheStatsJour(
  ctx: Contexte,
  cle: string,
  libelle: string,
  colonne: ColonneStatsJour,
  indice?: string
): Marche {
  const a = ctx.statsJour ? totalStatsJour(ctx.statsJour, ctx.fA, colonne) : null;
  const p = ctx.statsJour ? totalStatsJour(ctx.statsJour, ctx.fP, colonne) : null;
  const couverture = a ? indiceCouverture(a, ctx.fA.nbJours) : undefined;
  return {
    cle,
    libelle,
    source: "stats_jour",
    actuel: a?.valeur ?? null,
    precedent: p?.valeur ?? null,
    ecartPct: ecartPct(a?.valeur ?? null, p?.valeur ?? null),
    conversionPct: null,
    conversionPrecPct: null,
    indice: [indice, couverture].filter(Boolean).join(" · ") || undefined,
  };
}

function marcheCalculee<T>(
  ctx: Contexte,
  parJour: Map<string, T> | null,
  source: SourceMarche,
  cle: string,
  libelle: string,
  lire: (j: T) => number,
  indice?: string
): Marche {
  const a = parJour ? totalCalcule(parJour, ctx.fA, lire).valeur : null;
  const p = parJour ? totalCalcule(parJour, ctx.fP, lire).valeur : null;
  return {
    cle,
    libelle,
    source,
    actuel: a,
    precedent: p,
    ecartPct: ecartPct(a, p),
    conversionPct: null,
    conversionPrecPct: null,
    indice,
  };
}

/** Numeros d'ecran vus sur l'une ou l'autre periode, dans l'ordre. */
function ecransObserves(events: Map<string, JourEvents>, fA: Fenetre, fP: Fenetre): number[] {
  const steps = new Set<number>();
  for (const jour of [...joursDe(fP), ...joursDe(fA)]) {
    const j = events.get(jour);
    if (j) for (const s of j.ecrans.keys()) steps.add(s);
  }
  return [...steps].sort((x, y) => x - y);
}

/** Libelle d'un ecran = son metadata.name le plus frequent sur la periode actuelle
 *  (repli : periode precedente). Le formulaire a change de decoupage le 28/08/2026,
 *  d'ou un nom lu dans les donnees plutot qu'une constante. */
function nomEcran(events: Map<string, JourEvents>, step: number, fA: Fenetre, fP: Fenetre): string {
  for (const f of [fA, fP]) {
    const noms = new Map<string, number>();
    for (const jour of joursDe(f)) {
      const e = events.get(jour)?.ecrans.get(step);
      if (!e) continue;
      for (const [nom, n] of e.noms) noms.set(nom, (noms.get(nom) ?? 0) + n);
    }
    let meilleur: string | null = null;
    let max = 0;
    for (const [nom, n] of noms) {
      if (n > max) {
        max = n;
        meilleur = nom;
      }
    }
    if (meilleur) return meilleur;
  }
  return "sans nom";
}

export function construireEntonnoir(ctx: Contexte): Marche[] {
  const visiteurs = marcheStatsJour(ctx, "visiteurs", "Visiteurs réels", "sessions", "sessions Umami, JS exécuté");
  const listing = marcheStatsJour(
    ctx,
    "listing",
    "Sessions sur une page métier x ville",
    "sessions_listing"
  );
  const vu = marcheCalculee(
    ctx,
    ctx.events,
    "events",
    "vu",
    "Formulaire vu",
    (j) => j.vus,
    "affiché, sans intention · cookies acceptés uniquement · événement créé le 09/09/2026"
  );
  const commence = marcheCalculee(
    ctx,
    ctx.events,
    "events",
    "commence",
    "Formulaire commencé",
    (j) => j.commences,
    "première interaction · cookies acceptés uniquement"
  );

  // Sous-lignes ecrans : chaque affichage compte (retours arriere inclus).
  const sous: Marche[] = [];
  if (ctx.events) {
    const events = ctx.events;
    for (const step of ecransObserves(events, ctx.fA, ctx.fP)) {
      const m = marcheCalculee(
        ctx,
        events,
        "events",
        `ecran-${step}`,
        `Écran ${step} · ${nomEcran(events, step, ctx.fA, ctx.fP)}`,
        (j) => j.ecrans.get(step)?.count ?? 0
      );
      sous.push(m);
    }
  }
  const ecrans: Marche = {
    cle: "ecrans",
    libelle: "Écrans atteints",
    source: "events",
    actuel: null,
    precedent: null,
    ecartPct: null,
    conversionPct: null,
    conversionPrecPct: null,
    indice:
      "formulaires BTP · chaque affichage compte, retours inclus · certaines pages démarrent directement à un écran avancé",
    sous,
  };

  const envoye = marcheCalculee(
    ctx, ctx.events, "events", "envoye", "Envois BTP enregistrés", (j) => j.envoyes,
    "événements serveur · tous les visiteurs, avec ou sans cookies acceptés"
  );
  const valides = marcheCalculee(
    ctx,
    ctx.projets,
    "projects",
    "valides",
    "Projets valides",
    (j) => j.valides,
    "BTP et freelances · hors supprimés et suspects"
  );
  const diffuses = marcheCalculee(
    ctx,
    ctx.projets,
    "projects",
    "diffuses",
    "Projets diffusés",
    (j) => j.diffuses,
    "parmi les projets valides créés sur la période · BTP et freelances"
  );

  const payes = ctx.unlocks ? totalCalcule(ctx.unlocks, ctx.fA, (j) => j.payes).valeur : null;
  const offerts = ctx.unlocks ? totalCalcule(ctx.unlocks, ctx.fA, (j) => j.offerts).valeur : null;
  const debloques = marcheCalculee(
    ctx,
    ctx.unlocks,
    "lead_unlocks",
    "debloques",
    "Coordonnées débloquées",
    (j) => j.total,
    payes !== null && offerts !== null
      ? `${payes} payé${payes > 1 ? "s" : ""} · ${offerts} offert${offerts > 1 ? "s" : ""} · comptes de test exclus`
      : "comptes de test exclus"
  );

  // Seule part démontrable : la diffusion d'un sous-ensemble des mêmes
  // projets. Les événements sont répétés et sans cohorte ; les envois serveur
  // ne dépendent pas du consentement ; les achats peuvent viser d'anciens
  // projets ou plusieurs pros. Aucun ratio entre ces populations.
  diffuses.conversionPct = pct(diffuses.actuel, valides.actuel);
  diffuses.conversionPrecPct = pct(diffuses.precedent, valides.precedent);

  return [visiteurs, listing, vu, commence, ecrans, envoye, valides, diffuses, debloques];
}

// ============================================================
// Ratio cle : projets valides pour 1 000 clics de listing
// ============================================================

/** Calcule sur les SEULS jours ou clics_listing_gsc est renseigne (Search
 *  Console a 2 jours de retard) : numerateur et denominateur couvrent ainsi
 *  exactement les memes jours. */
function ratio(ctx: Contexte, f: Fenetre): Ratio {
  if (!ctx.statsJour || !ctx.projets) return { valeur: null, projets: 0, clics: 0, joursMesures: 0 };
  let projets = 0;
  let clics = 0;
  let joursMesures = 0;
  for (const jour of joursDe(f)) {
    const c = ctx.statsJour.get(jour)?.clics_listing_gsc;
    if (c === null || c === undefined) continue;
    joursMesures += 1;
    clics += c;
    projets += ctx.projets.get(jour)?.valides ?? 0;
  }
  const valeur = joursMesures > 0 && clics > 0 ? Math.round((projets / clics) * 10000) / 10 : null;
  return { valeur, projets, clics, joursMesures };
}

// ============================================================
// API publique
// ============================================================

/** maj_at le plus recent de stats_jour. Jamais bloquant : null en cas d'erreur. */
async function chargerDerniereMaj(): Promise<string | null> {
  const { data, error } = await getServiceClient()
    .from("stats_jour")
    .select("maj_at")
    .order("maj_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return (data[0] as { maj_at: string | null }).maj_at ?? null;
}

export async function getStatistiquesAdmin(nbJours: Periode): Promise<StatistiquesAdmin> {
  const { actuelle: fA, precedente: fP } = fenetres(nbJours);

  // Une seule fenetre de chargement = les deux periodes contigues.
  const debutIso = `${fP.debut}T00:00:00.000Z`;
  const finExcluIso = `${decaler(fA.fin, 1)}T00:00:00.000Z`;

  const [rStats, rEvents, rProjets, rUnlocks, derniereMajServeur] = await Promise.all([
    chargerStatsJour(fP.debut, fA.fin),
    chargerEvents(debutIso, finExcluIso),
    chargerProjets(debutIso, finExcluIso),
    chargerUnlocks(debutIso, finExcluIso),
    chargerDerniereMaj(),
  ]);

  const erreurs: Erreurs = {
    statsJour: rStats.ok ? null : rStats.erreur,
    events: rEvents.ok ? null : rEvents.erreur,
    projets: rProjets.ok ? null : rProjets.erreur,
    unlocks: rUnlocks.ok ? null : rUnlocks.erreur,
  };

  const statsJour = rStats.ok ? new Map(rStats.lignes.map((l) => [l.jour, l])) : null;
  const ctx: Contexte = {
    fA,
    fP,
    statsJour,
    events: rEvents.ok ? agregerEvents(rEvents.lignes) : null,
    projets: rProjets.ok ? agregerProjets(rProjets.lignes) : null,
    unlocks: rUnlocks.ok ? agregerUnlocks(rUnlocks.lignes) : null,
  };

  const absent: Total = { valeur: null, joursMesures: 0 };
  const tsj = (f: Fenetre, col: ColonneStatsJour): Total =>
    statsJour ? totalStatsJour(statsJour, f, col) : absent;

  // A) Ligne de tete
  const clicsA = tsj(fA, "clics_gsc");
  const clicsP = tsj(fP, "clics_gsc");
  const tete = {
    sessions: comparer(tsj(fA, "sessions"), tsj(fP, "sessions")),
    vues: comparer(tsj(fA, "vues"), tsj(fP, "vues")),
    clicsGsc: comparer(clicsA, clicsP),
    partListingPct: comparer(
      totalPct(tsj(fA, "clics_listing_gsc"), clicsA),
      totalPct(tsj(fP, "clics_listing_gsc"), clicsP)
    ),
    partFichePct: comparer(
      totalPct(tsj(fA, "clics_fiche_gsc"), clicsA),
      totalPct(tsj(fP, "clics_fiche_gsc"), clicsP)
    ),
  };

  // C) Ratio cle
  const ratioA = ratio(ctx, fA);
  const ratioP = ratio(ctx, fP);

  // D) Par jour, du plus recent au plus ancien
  const parJour: JourLigne[] = joursDe(fA)
    .reverse()
    .map((jour) => {
      const s = statsJour?.get(jour);
      const e = ctx.events?.get(jour);
      const p = ctx.projets?.get(jour);
      return {
        jour,
        sessions: s?.sessions ?? null,
        sessionsListing: s?.sessions_listing ?? null,
        commences: ctx.events ? (e?.commences ?? 0) : null,
        envoyes: ctx.events ? (e?.envoyes ?? 0) : null,
        projetsValides: ctx.projets ? (p?.valides ?? 0) : null,
        clicsGsc: s?.clics_gsc ?? null,
      };
    });

  // E) Sources
  const sessionsMesurees = tsj(fA, "sessions");
  const SOURCES: { cle: string; libelle: string; col: ColonneStatsJour }[] = [
    { cle: "google", libelle: "Google", col: "src_google" },
    { cle: "bing", libelle: "Bing", col: "src_bing" },
    { cle: "instagram", libelle: "Instagram", col: "src_instagram" },
    { cle: "direct", libelle: "Direct", col: "src_direct" },
    { cle: "autre", libelle: "Autre", col: "src_autre" },
  ];
  const sources: SourceTrafic[] = SOURCES.map((s) => {
    const a = tsj(fA, s.col);
    return {
      cle: s.cle,
      libelle: s.libelle,
      actuel: a,
      precedent: tsj(fP, s.col),
      partPct: pct(a.valeur, sessionsMesurees.valeur),
    };
  });

  // F) Robots
  const ROBOTS: {
    cle: string;
    libelle: string;
    description: string;
    col: ColonneStatsJour;
    hausseNegative: boolean;
  }[] = [
    {
      cle: "robots_declares",
      libelle: "Robots déclarés",
      description: "requêtes HTML d'un agent qui se présente comme robot, ou de Google",
      col: "robots_declares",
      hausseNegative: false,
    },
    {
      cle: "google_passages",
      libelle: "Passages de Google",
      description: "toutes les requêtes des adresses 66.249.*",
      col: "google_passages",
      hausseNegative: false,
    },
    {
      cle: "google_5xx",
      libelle: "Erreurs 5xx servies à Google",
      description: "passages de Google ayant reçu un statut 5xx",
      col: "google_5xx",
      hausseNegative: true,
    },
    {
      cle: "aspirateur_pages",
      libelle: "Pages aspirées",
      description: "requêtes HTML d'adresses non déclarées qui n'ont jamais chargé /_next/static/",
      col: "aspirateur_pages",
      hausseNegative: true,
    },
    {
      cle: "aspirateur_adresses",
      libelle: "Adresses aspirantes",
      description: "adresses distinctes derrière ces pages aspirées",
      col: "aspirateur_adresses",
      hausseNegative: true,
    },
    {
      cle: "err_5xx_total",
      libelle: "Erreurs 5xx, toutes",
      description: "toutes les réponses 5xx sur les hôtes workwave.fr",
      col: "err_5xx_total",
      hausseNegative: true,
    },
  ];
  const robotsTotaux: CompteurRobots[] = ROBOTS.map((r) => {
    const a = tsj(fA, r.col);
    const p = tsj(fP, r.col);
    return {
      cle: r.cle,
      libelle: r.libelle,
      description: r.description,
      actuel: a,
      precedent: p,
      ecartPct: ecartPct(a.valeur, p.valeur),
      hausseNegative: r.hausseNegative,
    };
  });
  const robotsParJour: JourRobots[] = joursDe(fA)
    .reverse()
    .map((jour) => {
      const s = statsJour?.get(jour);
      return {
        jour,
        robotsDeclares: s?.robots_declares ?? null,
        googlePassages: s?.google_passages ?? null,
        google5xx: s?.google_5xx ?? null,
        aspirateurPages: s?.aspirateur_pages ?? null,
        aspirateurAdresses: s?.aspirateur_adresses ?? null,
        err5xxTotal: s?.err_5xx_total ?? null,
      };
    });

  return {
    derniereMajServeur,
    periode: { nbJours, actuelle: fA, precedente: fP },
    genereLe: new Date().toISOString(),
    erreurs,
    tete,
    entonnoir: construireEntonnoir(ctx),
    ratioCle: { actuel: ratioA, precedent: ratioP, ecartPct: ecartPct(ratioA.valeur, ratioP.valeur) },
    parJour,
    sources: { lignes: sources, sessionsMesurees },
    robots: { totaux: robotsTotaux, parJour: robotsParJour },
  };
}
