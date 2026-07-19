import { notFound } from "next/navigation";
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
  if (isNaN(ticketId)) notFound();
  const detail = await getAdminTicketById(ticketId);
  if (!detail) notFound();
  return <SupportTicketClient detail={detail} />;
}
