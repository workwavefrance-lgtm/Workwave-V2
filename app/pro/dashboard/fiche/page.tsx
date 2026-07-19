import type { Metadata } from "next";
import { getCategoriesForPicker } from "@/lib/queries/categories";
import FicheEditor from "@/components/pro/dashboard/FicheEditor";

export const metadata: Metadata = {
  title: "Ma fiche — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function FichePage() {
  // PERF : cette page faisait auparavant getUser() + un SELECT * sur `pros`
  // (79 colonnes) uniquement pour lire profile_completion, PUIS un SELECT * sur
  // les 183 catégories (60-150 Ko sérialisés vers le téléphone pour un menu
  // déroulant). Or l'auth ET la fiche sont déjà garanties par le middleware et
  // le layout, qui place la fiche dans le contexte lu par FicheEditor.
  // Il ne reste donc qu'UNE requête, allégée (~2 Ko).
  const categories = await getCategoriesForPicker();

  return <FicheEditor categories={categories} />;
}
