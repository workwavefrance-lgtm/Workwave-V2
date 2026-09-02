/**
 * Limite de débit de l'outil public /verifier-artisan.
 *
 * POURQUOI. Chaque vérification déclenche un appel à l'API Annuaire des
 * entreprises (recherche-entreprises.api.gouv.fr), gratuite mais plafonnée à
 * 7 requêtes par seconde et par adresse IP, celle de NOTRE serveur. Un seul
 * visiteur (ou un script) qui enchaîne les numéros peut donc faire bannir
 * temporairement le VPS entier, ce qui casse aussi /pro/creer-fiche et le
 * script d'enrichissement des fiches.
 *
 * DEUX PLAFONDS, comme pour les codes de connexion (leçon du 26/05/2026) :
 *   - PAR ADRESSE IP : un visiteur qui s'acharne ;
 *   - GLOBAL : l'attaque réelle, des milliers d'adresses différentes, contre
 *     laquelle un plafond par IP ne peut rien. 400 par 15 min = 0,45 req/s en
 *     moyenne, très en dessous des 7 req/s de l'API.
 *
 * HYPOTHÈSE D'ARCHITECTURE : les compteurs vivent EN MÉMOIRE du processus
 * Node. C'est correct tant que le site tourne sur UNE SEULE instance, ce qui
 * est le cas du VPS Hostinger (un conteneur Docker piloté par Coolify, pas de
 * réplique). Si un jour l'application est répliquée, chaque réplique aura ses
 * propres compteurs et le plafond effectif sera multiplié par le nombre de
 * répliques : il faudra alors passer par une table Supabase (cf.
 * lib/support/rate-limit.ts) ou Redis. Un redéploiement remet les compteurs
 * à zéro, ce qui est sans conséquence.
 *
 * MÉMOIRE : la table est purgée des adresses inactives à intervalle régulier
 * (leçon des 09-10/08 : tout ce qui grossit sans jamais être vidé finit par
 * saturer le tas).
 */

const FENETRE_MS = 15 * 60 * 1000;
const MAX_PAR_IP = 20;
const MAX_GLOBAL = 400;
const PURGE_TOUTES_LES_N_VERIFS = 200;

const parIp = new Map<string, number[]>();
let global: number[] = [];
let compteurAppels = 0;

function purger(maintenant: number): void {
  for (const [ip, dates] of parIp) {
    const recentes = dates.filter((t) => maintenant - t < FENETRE_MS);
    if (recentes.length === 0) parIp.delete(ip);
    else parIp.set(ip, recentes);
  }
  global = global.filter((t) => maintenant - t < FENETRE_MS);
}

export type VerdictDebit = { autorise: true } | { autorise: false; raison: "ip" | "global" };

/**
 * Enregistre une tentative pour cette IP et dit si elle est autorisée.
 * L'appel est compté même quand il est refusé : un client qui insiste ne
 * gagne rien à insister.
 */
export function verifierDebit(ip: string): VerdictDebit {
  const maintenant = Date.now();
  compteurAppels += 1;
  if (compteurAppels % PURGE_TOUTES_LES_N_VERIFS === 0) purger(maintenant);

  const recentesIp = (parIp.get(ip) || []).filter((t) => maintenant - t < FENETRE_MS);
  recentesIp.push(maintenant);
  parIp.set(ip, recentesIp);

  global = global.filter((t) => maintenant - t < FENETRE_MS);
  global.push(maintenant);

  if (recentesIp.length > MAX_PAR_IP) return { autorise: false, raison: "ip" };
  if (global.length > MAX_GLOBAL) return { autorise: false, raison: "global" };
  return { autorise: true };
}
