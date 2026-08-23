/**
 * Fraicheur des projets proposes aux pros.
 *
 * Un chantier depose il y a plus d'un mois est mort : le particulier a trouve
 * quelqu'un, ou a renonce. Le proposer encore fait payer 9,90 EUR pour un
 * numero qui ne repondra pas, et ca coute bien plus cher que le lead : le pro
 * ne revient pas.
 *
 * Constat qui a fait poser la regle (23/08/2026) : un pro a consomme ses DEUX
 * leads offerts le meme matin sur des projets de 38 et 31 jours. Deux premieres
 * impressions gachees d'un coup, sur le seul pro reellement actif du site.
 *
 * REGLE : un projet de plus de 30 jours n'est plus propose.
 *
 * EXCEPTION, non negociable : un projet DEJA DEBLOQUE reste visible pour
 * toujours. On ne retire jamais a un pro ce qu'il a paye, meme d'un lead
 * offert. Chaque appelant doit donc combiner l'age AVEC la liste des
 * deblocages du pro, jamais l'age seul.
 */

export const JOURS_VALIDITE_PROJET = 30;

/** Date limite ISO : tout projet cree AVANT n'est plus proposable. */
export function dateLimiteProjet(maintenant: Date = new Date()): string {
  return new Date(
    maintenant.getTime() - JOURS_VALIDITE_PROJET * 24 * 60 * 60 * 1000
  ).toISOString();
}

/** true si le projet est trop vieux pour etre propose ou debloque. */
export function projetTropAncien(
  creeLe: string | Date,
  maintenant: Date = new Date()
): boolean {
  const t = typeof creeLe === "string" ? new Date(creeLe).getTime() : creeLe.getTime();
  if (Number.isNaN(t)) return false; // date illisible : on ne masque pas a tort
  return t < maintenant.getTime() - JOURS_VALIDITE_PROJET * 24 * 60 * 60 * 1000;
}

/** Age en jours, pour les messages et les journaux. */
export function ageEnJours(creeLe: string | Date, maintenant: Date = new Date()): number {
  const t = typeof creeLe === "string" ? new Date(creeLe).getTime() : creeLe.getTime();
  return Math.floor((maintenant.getTime() - t) / (24 * 60 * 60 * 1000));
}
