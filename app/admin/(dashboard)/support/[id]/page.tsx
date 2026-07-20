import Link from "next/link";
import { getAdminTicketById } from "@/lib/queries/admin-support";
import SupportTicketClient from "./SupportTicketClient";

export const dynamic = "force-dynamic";

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = parseInt(id, 10);
  const detail = !isNaN(ticketId) ? await getAdminTicketById(ticketId) : null;

  // Ticket absent : on rend un état EN LIGNE plutôt que notFound().
  //
  // POURQUOI : chaque notification contient un lien direct vers le ticket, et
  // ces emails survivent au ticket (supprimé, purgé, nettoyé). En cliquant un
  // vieux lien on tombait sur le 404 brut de Next — écran noir, « This page
  // could not be found » en anglais, aucune sortie. Ici on reste dans l'admin,
  // on explique, et on propose le retour à la boîte de réception.
  if (!detail) {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Ticket introuvable
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Le ticket {isNaN(ticketId) ? "demandé" : `#${ticketId}`} n&apos;existe
          plus. Il a probablement été supprimé depuis l&apos;envoi de la
          notification.
        </p>
        <Link
          href="/admin/support"
          className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
        >
          Retour à la boîte de réception
        </Link>
      </div>
    );
  }

  return <SupportTicketClient detail={detail} />;
}
