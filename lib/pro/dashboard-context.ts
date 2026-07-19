import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getBtpProByUserId } from "@/lib/queries/pros";
import type { ProWithRelations } from "@/lib/types/database";

/**
 * Contexte serveur du dashboard pro : session + fiche BTP, MÉMOÏSÉ par requête.
 *
 * PERF : avant, chaque affichage de page refaisait le même travail 2 à 3 fois —
 * `auth.getUser()` dans le middleware, puis dans le layout, puis dans la page
 * (et `getUser()` n'est PAS un décodage local : c'est un aller-retour réseau
 * vers l'auth Supabase), plus un chargement complet de la fiche pro dans le
 * layout ET dans la page. Soit ~200 à 400 ms de latence pure, en série, avant
 * la moindre donnée métier.
 *
 * `cache()` de React mémoïse sur toute la passe de rendu : le layout et la page
 * partagent désormais le MÊME résultat, sans se coordonner.
 *
 * Vertical : on utilise getBtpProByUserId (et pas getProByUserId) pour rester
 * cohérent avec le layout et garantir l'isolation BTP / AI (audit 29/05).
 *
 * Retourne toujours un objet : c'est l'appelant (le layout) qui décide des
 * redirections, car lui seul distingue "pas de session" de "pas de fiche BTP"
 * (ce dernier cas devant router vers le dashboard AI le cas échéant).
 */
export const getDashboardContext = cache(
  async (): Promise<{
    user: { id: string; email: string | null } | null;
    // ProWithRelations (et pas Pro) : la fiche est chargée AVEC ses jointures
    // (ville + département, catégorie), que les pages du dashboard lisent
    // directement (pro.city.latitude, pro.category.name…).
    pro: ProWithRelations | null;
  }> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { user: null, pro: null };

    const pro = await getBtpProByUserId(user.id);
    return { user: { id: user.id, email: user.email ?? null }, pro };
  }
);
