import { getAdminServiceClient } from "@/lib/admin/service-client";
import { verifyAdmin } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings",
};

type AdminRow = {
  id: number;
  email: string;
  role: string;
  created_at: string;
};

export default async function AdminSettingsPage() {
  const currentAdmin = await verifyAdmin();
  if (!currentAdmin) redirect("/admin/login");

  const db = getAdminServiceClient();
  const { data } = (await db
    .from("admins")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true })) as {
    data: AdminRow[] | null;
  };

  return (
    <SettingsClient
      admins={data || []}
      currentAdminId={currentAdmin.id}
      currentAdminRole={currentAdmin.role}
    />
  );
}
