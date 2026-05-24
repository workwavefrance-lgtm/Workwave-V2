import { getAdminServiceClient } from "@/lib/admin/service-client";
import PartnershipsClient from "./PartnershipsClient";
import type { Partnership } from "@/lib/types/database";

export const dynamic = "force-dynamic";

/**
 * Page admin de gestion des partenariats locaux.
 *
 * Charge tous les partenariats (en pratique < 1500 lignes pour les 12
 * departements de Nouvelle-Aquitaine + CCI + CMA + ajouts manuels)
 * et passe a un client component pour l'interactivite.
 *
 * Stats agregees pour les cards en haut.
 */
export default async function AdminPartnershipsPage() {
  const sb = getAdminServiceClient();

  // Pagination cote serveur : PostgREST cap a 1000 lignes par requete,
  // on a ~4400 partenariats. Cf. lecon CLAUDE.md 09/05/2026.
  const PAGE = 1000;
  const MAX_BATCHES = 6; // plafond defensif (6000 max)
  const partnerships: Partnership[] = [];
  let offset = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (sb.from("partnerships") as any)
      .select("*")
      .order("status", { ascending: true })
      .order("city", { ascending: true })
      .range(offset, offset + PAGE - 1);
    const rows = (data as Partnership[] | null) ?? [];
    if (rows.length === 0) break;
    partnerships.push(...rows);
    offset += rows.length;
    if (rows.length < PAGE) break;
  }

  // Stats agregees rapides en JS (la vue partnerships_stats SQL existe
  // aussi mais on calcule ici pour eviter une 2eme query)
  const stats = {
    total: partnerships.length,
    to_contact: partnerships.filter((p) => p.status === "to_contact").length,
    contacted: partnerships.filter((p) => p.status === "contacted").length,
    responded: partnerships.filter((p) => p.status === "responded").length,
    partnership: partnerships.filter((p) => p.status === "partnership").length,
    declined: partnerships.filter((p) => p.status === "declined").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Partenariats locaux
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-2 max-w-2xl">
          Démarchage mairies / offices de tourisme / notaires / agences immo / CCI / CMA pour
          obtenir des backlinks autoritaires et un flux régulier de recommandations locales.
          Aucun blast : chaque envoi est validé via l&apos;aperçu ci-dessous.
        </p>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-2">
          Sender :{" "}
          <code className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[11px]">
            Workwave &lt;contact@workwave.fr&gt;
          </code>{" "}
          · Recommandation : 10-20 envois/jour maximum pour préserver la délivrabilité.
        </p>
      </div>

      <PartnershipsClient partnerships={partnerships} stats={stats} />
    </div>
  );
}
