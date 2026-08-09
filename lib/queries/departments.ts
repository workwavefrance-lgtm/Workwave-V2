import { cache } from "react";
// Client SANS cookies : `supabase/server` appelle cookies(), ce qui bascule
// TOUTE page qui l'utilise en rendu DYNAMIQUE (ISR/cache CDN inactif).
// Ces requetes sont des lectures publiques -> client leger obligatoire.
import { createPublicClient } from "@/lib/supabase/public-client";
import type { Department } from "@/lib/types/database";
import { generateDepartmentSlug, parseDepartmentSlug } from "@/lib/utils/slugs";

// Regroupe les appels IDENTIQUES faits pendant le rendu d'une meme page
// (`generateMetadata` et la page appellent souvent la meme requete). Next le
// faisait deja, mais en dedoublant la REPONSE HTTP et en gardant la branche non
// lue jusqu'au ramasse-miettes : 512 Mo retenus en production le 09/08/2026.
// Cf. lib/supabase/fetch-supabase.ts. Regrouper le RESULTAT ne coute rien.
export const getAllDepartments = cache(async function getAllDepartments(): Promise<Department[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .order("code");
  return (data as Department[]) || [];
})

// Regroupe les appels IDENTIQUES faits pendant le rendu d'une meme page
// (`generateMetadata` et la page appellent souvent la meme requete). Next le
// faisait deja, mais en dedoublant la REPONSE HTTP et en gardant la branche non
// lue jusqu'au ramasse-miettes : 512 Mo retenus en production le 09/08/2026.
// Cf. lib/supabase/fetch-supabase.ts. Regrouper le RESULTAT ne coute rien.
export const getDepartmentBySlug = cache(async function getDepartmentBySlug(
  slug: string
): Promise<Department | null> {
  const parsed = parseDepartmentSlug(slug);
  if (!parsed) return null;

  const supabase = createPublicClient();
  // parsed.code est en minuscules (ex. "2a"). La BDD stocke les codes Corse en
  // majuscules ("2A"/"2B"). toUpperCase() : numérique inchangé ("86"->"86"),
  // Corse re-majusculée pour matcher.
  const { data } = await supabase
    .from("departments")
    .select("*")
    .eq("code", parsed.code.toUpperCase())
    .single();
  const dept = data as Department | null;
  if (!dept) return null;

  // Strict slug match : éviter qu'un slug type "saint-savin-86" matche le
  // département Vienne uniquement parce qu'il finit par "-86". On regénère
  // le slug canonique du département trouvé et on compare strictement avec
  // le slug fourni en entrée. Sans cette garde, n'importe quel slug "xxx-NN"
  // résolverait au département de code NN, ce qui produit du duplicate
  // content massif (ex. /macon/saint-savin-86 servait la page Vienne avec
  // 997 maçons à la place d'un 404).
  if (slug !== generateDepartmentSlug(dept)) return null;

  return dept;
})
