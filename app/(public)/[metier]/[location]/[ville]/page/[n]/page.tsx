/**
 * Pages 2+ d'une sous-specialite x ville : /[metier]/[specialite]/[ville]/page/2
 * Meme principe que le listing principal : le numero de page passe par le
 * CHEMIN pour que la route reste cachable (lire searchParams la rendrait
 * dynamique, donc recalculee a chaque visite).
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { renderSpecialtyCity } from "../../page";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 2592000;

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ metier: string; location: string; ville: string; n: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, location, ville, n } = await params;
  // Canonical vers la page 1, comportement identique a l'ancien ?page=N.
  return {
    alternates: { canonical: `${BASE_URL}/${metier}/${location}/${ville}` },
    title: `Page ${n}`,
  };
}

export default async function SpecialtyCityPaginated({ params }: Props) {
  const { metier, location, ville, n } = await params;
  const page = parseInt(n, 10);
  if (!Number.isFinite(page) || page < 2 || page > 500) notFound();
  return renderSpecialtyCity(metier, location, ville, page);
}
