/**
 * « Combien d'artisans de ce métier dans ce département ? »
 *
 * POURQUOI : à l'étape 2 du formulaire, la personne choisit sa ville et il ne
 * se passe rien. C'est le moment exact où elle se demande si ce site couvre
 * vraiment chez elle — et on a la réponse en base.
 *
 * POURQUOI LE DÉPARTEMENT ET PAS LA VILLE : mesuré le 08/08/2026, le chiffre
 * par ville tombe à zéro sur les petites communes (0 plombier à Civray) alors
 * que le département en compte toujours plusieurs centaines (841 dans la
 * Vienne). Afficher « 0 artisan » à quelqu'un qui hésite serait pire que ne
 * rien afficher.
 *
 * CE QU'ON DIT ET CE QU'ON NE DIT PAS : ces artisans sont RÉFÉRENCÉS (issus du
 * registre officiel), pas « prêts à répondre ». Seuls ceux qui ont réclamé leur
 * fiche reçoivent les demandes. Le mot « référencés » est donc le seul honnête
 * — cf. la leçon du 07/06 sur les affirmations tirées d'un comportement qui
 * n'est pas celui du code.
 */
import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public-client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = parseInt(url.searchParams.get("categoryId") || "", 10);
  const cityId = parseInt(url.searchParams.get("cityId") || "", 10);
  if (isNaN(categoryId) || isNaN(cityId)) {
    return NextResponse.json({ count: null });
  }

  const sb = createPublicClient();

  const { data: ville } = await sb
    .from("cities")
    .select("department_id, departments(name)")
    .eq("id", cityId)
    .maybeSingle();
  if (!ville?.department_id) return NextResponse.json({ count: null });

  // Les villes du département, puis le compte des pros du métier dans ces
  // villes. PAGE = 1000 : c'est le plafond PostgREST par défaut, et le
  // dépasser renverrait silencieusement moins de lignes (leçon récurrente).
  const villeIds: number[] = [];
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from("cities")
      .select("id")
      .eq("department_id", ville.department_id)
      .range(offset, offset + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    villeIds.push(...rows.map((r) => r.id));
    offset += rows.length;
    if (villeIds.length >= 3000) break; // garde-fou : aucun département n'a autant de communes
  }
  if (villeIds.length === 0) return NextResponse.json({ count: null });

  const { count } = await sb
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .in("city_id", villeIds)
    .eq("is_active", true)
    .is("deleted_at", null);

  const dept = Array.isArray(ville.departments)
    ? ville.departments[0]
    : ville.departments;

  return NextResponse.json({
    count: count ?? null,
    departement: (dept as { name?: string } | null)?.name ?? null,
  });
}
