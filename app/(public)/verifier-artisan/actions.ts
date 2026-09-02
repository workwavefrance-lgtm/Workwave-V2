"use server";

import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public-client";
import {
  rechercherParSiren,
  rechercherParSiret,
  type RechercheSiret,
} from "@/lib/utils/recherche-entreprises";
import { getCategoryArticle } from "@/lib/utils/category-grammar";
import { verifierDebit } from "@/lib/verifier-artisan/limite-debit";
import {
  analyserNumero,
  construireResultat,
  type ResultatVerification,
} from "@/lib/verifier-artisan/construire-resultat";

/** Délai maximal accordé au registre avant de répondre « ne répond pas ». */
const DELAI_API_MS = 8000;

export type FicheWorkwave = { href: string; nom: string };
export type MetierConnu = { slug: string; nom: string; article: "un" | "une" };

export type EtatVerification =
  | { statut: "vide" }
  | { statut: "erreur"; message: string }
  | {
      statut: "ok";
      resultat: ResultatVerification;
      fiche: FicheWorkwave | null;
      metier: MetierConnu | null;
    };

type CategorieLegere = {
  slug: string;
  name: string;
  vertical: "btp" | "domicile" | "personne" | "tech";
};

const VERTICAUX_PARTICULIER = ["btp", "domicile", "personne"] as const;

function hrefFiche(slug: string, vertical: CategorieLegere["vertical"]): string {
  // Même règle que la canonique de /artisan/[slug] : une catégorie tech vit
  // sous /ai/freelance/[slug] (la route /artisan y redirige en 308).
  return vertical === "tech" ? `/ai/freelance/${slug}` : `/artisan/${slug}`;
}

/**
 * La fiche Workwave.fr de cet établissement, si elle existe et est en ligne.
 * Lecture publique (client anon, RLS SELECT ouverte sur pros et categories).
 * Un échec ici ne doit pas priver le visiteur du résultat du registre.
 */
async function chercherFiche(
  siret: string
): Promise<{ fiche: FicheWorkwave | null; categorie: CategorieLegere | null }> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("pros")
    .select("slug, name, category:categories(slug, name, vertical)")
    .eq("siret", siret)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[verifier-artisan] lecture pros impossible :", error.message);
    return { fiche: null, categorie: null };
  }
  if (!data) return { fiche: null, categorie: null };
  const row = data as unknown as { slug: string; name: string; category: CategorieLegere | null };
  const categorie = row.category;
  return {
    fiche: { href: hrefFiche(row.slug, categorie?.vertical || "btp"), nom: row.name },
    categorie,
  };
}

/**
 * Le métier Workwave correspondant au code d'activité du registre, pour
 * proposer « Vous cherchez un plombier ? ». `categories.naf_codes` est stocké
 * SANS point ("4322A") alors que l'API renvoie "43.22A". Seules les catégories
 * ouvertes aux particuliers sont candidates : un code tech ne mène pas à
 * /deposer-projet.
 */
async function chercherMetierParNaf(codeNaf: string | null): Promise<CategorieLegere | null> {
  if (!codeNaf) return null;
  const sansPoint = codeNaf.replace(/\./g, "").toUpperCase();
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("categories")
    .select("slug, name, vertical")
    .contains("naf_codes", [sansPoint])
    .in("vertical", [...VERTICAUX_PARTICULIER])
    .order("id")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[verifier-artisan] lecture categories impossible :", error.message);
    return null;
  }
  return (data as CategorieLegere | null) || null;
}

function metierPourParticulier(cat: CategorieLegere | null): MetierConnu | null {
  if (!cat) return null;
  if (!(VERTICAUX_PARTICULIER as readonly string[]).includes(cat.vertical)) return null;
  return { slug: cat.slug, nom: cat.name, article: getCategoryArticle(cat.name) };
}

export async function verifierArtisan(
  _prev: EtatVerification,
  formData: FormData
): Promise<EtatVerification> {
  // Pot de miel : un humain ne voit pas ce champ, un robot le remplit.
  if (String(formData.get("site_web_hp") || "").length > 0) {
    return { statut: "erreur", message: "Erreur. Réessayez." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
  const verdict = verifierDebit(ip);
  if (!verdict.autorise) {
    return {
      statut: "erreur",
      message:
        verdict.raison === "ip"
          ? "Trop de vérifications depuis votre connexion. Réessayez dans quelques minutes."
          : "L'outil est très sollicité en ce moment. Réessayez dans quelques minutes.",
    };
  }

  const numero = analyserNumero(String(formData.get("numero") || "").slice(0, 40));
  if (numero.type === "invalide") {
    return {
      statut: "erreur",
      message: "Saisissez un SIRET (14 chiffres) ou un SIREN (9 chiffres), sans lettres.",
    };
  }

  // Appel AWAITÉ, jamais détaché (leçon du 24/05 : une promesse lâchée dans
  // une Server Action meurt avec la réponse). Délai borné pour ne pas bloquer
  // le visiteur si le registre est lent.
  const options = { signal: AbortSignal.timeout(DELAI_API_MS) };
  const reponse: RechercheSiret =
    numero.type === "siret"
      ? await rechercherParSiret(numero.valeur, options)
      : await rechercherParSiren(numero.valeur, options);

  if (reponse.statut === "erreur_api") {
    console.error(
      `[verifier-artisan] registre indisponible (${numero.type} ${numero.valeur}) : HTTP ${reponse.http ?? "-"} ${reponse.detail}`
    );
    return {
      statut: "erreur",
      message: "Le registre ne répond pas pour le moment. Réessayez dans quelques instants.",
    };
  }
  if (reponse.statut === "non_trouve") {
    return {
      statut: "erreur",
      message:
        numero.type === "siret"
          ? "Numéro introuvable au registre Sirene. Vérifiez les 14 chiffres sur le devis ou la facture."
          : "Numéro introuvable au registre Sirene. Vérifiez les 9 chiffres sur le devis ou la facture.",
    };
  }

  const resultat = construireResultat(numero, reponse.unite, reponse.etablissement, new Date());

  const { fiche, categorie } = await chercherFiche(resultat.siret);
  const metier = metierPourParticulier(
    categorie || (await chercherMetierParNaf(resultat.activite?.code || null))
  );

  return { statut: "ok", resultat, fiche, metier };
}
