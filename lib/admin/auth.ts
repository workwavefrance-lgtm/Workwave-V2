import { createClient } from "@/lib/supabase/server";
import { getAdminServiceClient } from "./service-client";
import type { Admin } from "@/lib/types/admin";

export async function verifyAdmin(): Promise<Admin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = getAdminServiceClient();
  const { data: admin } = await service
    .from("admins")
    .select("id, user_id, email, role")
    .eq("user_id", user.id)
    .single<{ id: number; user_id: string; email: string; role: string }>();

  if (!admin) return null;

  return {
    id: admin.id,
    userId: admin.user_id,
    email: admin.email,
    role: admin.role as "admin" | "superadmin",
  };
}
