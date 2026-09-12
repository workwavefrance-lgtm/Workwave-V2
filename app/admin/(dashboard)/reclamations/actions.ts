"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/admin/auth";
import { getServiceClient } from "@/lib/supabase/service-client";
import { revalidateProPublicPages } from "@/lib/pro/revalidate-public";
import { sendClaimNotifications } from "@/lib/pro/claim-notifications";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";

export async function reviewClaim(formData: FormData): Promise<void> {
  const admin = await verifyAdmin();
  if (!admin) redirect("/admin/login");
  const id = Number(formData.get("requestId"));
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isSafeInteger(id) || id <= 0 || !["approved", "rejected"].includes(decision)
    || note.length < 10 || note.length > 2000
    || (decision === "approved" && formData.get("ownershipVerified") !== "on")) {
    redirect("/admin/reclamations?result=incomplete");
  }
  const { data, error } = await getServiceClient().rpc("review_pro_claim", {
    p_request_id: id, p_admin_user_id: admin.userId, p_decision: decision, p_note: note,
  });
  if (error || !data) {
    console.error("[claim] review rejected", error?.code);
    redirect("/admin/reclamations?result=conflict");
  }
  revalidatePath("/admin/reclamations");
  revalidatePath("/pro/reclamations");
  if (data.status === "approved") {
    await revalidateProPublicPages(data.pro_id, data.slug);
    // Une RPC rejouée échoue avant ce point : pas de second email de bienvenue.
    after(async () => {
      await track(EVENTS.CLAIM_COMPLETED, { userId: data.user_id, proId: data.pro_id, metadata: { slug: data.slug } });
      await sendClaimNotifications({ slug: data.slug, claimEmail: data.email });
    });
  }
  redirect("/admin/reclamations?result=saved");
}
