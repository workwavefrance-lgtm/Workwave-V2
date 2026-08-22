"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServiceClient } from "@/lib/supabase/service-client";

// Rate limit en memoire : 15 lookups / 5 min / IP. Generaux mais anti-scrape.
// En prod sur Vercel, chaque serverless est independant ; pour vraie protection
// il faudra passer sur Upstash Redis. Pour l'instant ca casse les bots casuals.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

export type LookupState = {
  success: boolean;
  message?: string;
};

/**
 * Cherche un pro par son SIRET et redirige vers le bon endroit :
 *  - SIRET trouve + fiche non reclamee → /pro/reclamer/[slug] (workflow claim)
 *  - SIRET trouve + fiche deja reclamee → /pro/connexion?from=lookup (deja un compte)
 *  - SIRET non trouve → /pro/creer-fiche?siret=... (creation, numero pre-rempli)
 *
 * Aucun chemin ne se termine par un cul-de-sac : le seul message d'erreur
 * possible concerne un numero mal forme ou le rate limit.
 *
 * Le SIRET est une donnee publique (annuaire Sirene), donc pas de leak de
 * confidentialite. La redirection ne revele que l'existence de la fiche
 * publique qui est deja indexable Google.
 */
export async function lookupBySiret(
  _prev: LookupState,
  formData: FormData
): Promise<LookupState> {
  // Honeypot anti-bot : champ cache "website" doit rester vide
  const honeypot = formData.get("website") as string;
  if (honeypot && honeypot.length > 0) {
    return { success: false, message: "Erreur. Réessayez." };
  }

  // Rate limit par IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return {
      success: false,
      message: "Trop de tentatives. Réessayez dans quelques minutes.",
    };
  }

  // Validation : SIRET francais (14 chiffres) OU numero d'entreprise belge
  // BCE (10 chiffres) : les deux vivent dans pros.siret, longueurs disjointes.
  const raw = ((formData.get("siret") as string) || "").replace(/\D/g, "");
  if (raw.length !== 14 && raw.length !== 10) {
    return {
      success: false,
      message:
        "Numero invalide : SIRET = 14 chiffres (France), numero d'entreprise BCE = 10 chiffres (Belgique).",
    };
  }

  const sb = getServiceClient();

  const { data: pro } = await sb
    .from("pros")
    .select("id, slug, claimed_by_user_id")
    .eq("siret", raw)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!pro) {
    // Aucune fiche en base : on n'envoie plus l'artisan dans le mur. Il a
    // deja tape son numero, on l'emmene directement le creer avec le numero
    // pre-rempli. Cote francais, /pro/creer-fiche interroge le registre
    // officiel et pre-remplit nom/adresse/NAF ; cote belge il saisit a la
    // main (le webservice BCE est payant, le scraping de Public Search est
    // interdit par ses CGU).
    redirect(
      `/pro/creer-fiche?siret=${raw}${raw.length === 10 ? "&pays=be" : ""}`
    );
  }

  // Fiche deja reclamee : on envoie vers la connexion
  if (pro.claimed_by_user_id) {
    redirect("/pro/connexion?from=lookup");
  }

  // Fiche existe mais non reclamee : on lance le workflow claim
  redirect(`/pro/reclamer/${pro.slug}`);
}
