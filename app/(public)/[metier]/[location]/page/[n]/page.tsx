/**
 * Pages 2 et suivantes d'un listing : /[metier]/[location]/page/2
 *
 * POURQUOI une route dediee plutot que `?page=2` : lire un parametre d'URL
 * (`searchParams`) rend TOUTE la route dynamique dans Next.js : la page est
 * alors recalculee a chaque visite, `revalidate` est ignore. Resultat mesure le
 * 03/08 sous le crawl de Google : 8 a 20 secondes par listing, et Googlebot qui
 * commence a reduire son rythme. En passant le numero de page dans le CHEMIN,
 * la page redevient cachable.
 *
 * SEO : aucun impact. Ces pages ne sont pas dans le sitemap et leur canonical
 * pointe deja vers la page 1, Google ne les indexe pas. Les anciens liens
 * `?page=N` sont rediriges en 301 par le middleware.
 *
 * Le segment litteral `page` prime sur le segment dynamique `[ville]` du meme
 * niveau (regle Next.js : statique > dynamique), donc /plombier/vienne-86/page/2
 * ne peut pas etre confondu avec une sous-specialite.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { renderListing } from "../../page";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 2592000;

// Route dynamique sans prebuild : bascule en ISR (1re visite -> mise en cache).
export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ metier: string; location: string; n: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, location, n } = await params;
  // Canonical vers la page 1 : EXACTEMENT le comportement d'avant (`?page=N`
  // canonicalisait deja vers la page 1). Pas de noindex ajoute : la regle du
  // projet interdit d'en poser un sans comptage prealable et validation de Willy.
  return {
    alternates: { canonical: `${BASE_URL}/${metier}/${location}` },
    title: `Page ${n}`,
  };
}

export default async function ListingPaginatedPage({ params }: Props) {
  const { metier, location, n } = await params;
  const page = parseInt(n, 10);
  // Page 1 = l'URL canonique, pas ici. Numero invalide = 404 (evite les URLs
  // fantomes type /page/abc ou /page/-3 qui pollueraient le crawl).
  if (!Number.isFinite(page) || page < 2 || page > 500) notFound();
  return renderListing(metier, location, page);
}
