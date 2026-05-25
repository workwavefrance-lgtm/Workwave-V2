"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Marquer un lead comme VU (opened_at = NOW()).
 *
 * Securite : on verifie que le lead.pro_id = pro de l'user authentifie
 * (ownership strict) avant tout UPDATE.
 *
 * Idempotent : si deja opened, no-op (pas d'overwrite du timestamp).
 */
export async function markLeadAsOpened(leadId: number): Promise<void> {
  // 1) Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // silent fail OK (UI peut afficher state local)

  // 2) Verifier ownership
  const service = getServiceClient();
  const { data: lead } = await service
    .from("project_leads")
    .select("id, pro_id, opened_at, pros!inner(claimed_by_user_id, category_id)")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return;

  // Type assertion : pros est embedded
  const proRel = Array.isArray(lead.pros) ? lead.pros[0] : lead.pros;
  if (
    !proRel ||
    proRel.claimed_by_user_id !== user.id ||
    !AI_CATEGORY_IDS.includes(proRel.category_id)
  ) {
    return; // pas son lead, silent fail
  }

  // 3) Idempotent : skip si deja opened
  if (lead.opened_at) return;

  await service
    .from("project_leads")
    .update({
      opened_at: new Date().toISOString(),
      status: "opened",
    })
    .eq("id", leadId)
    .eq("pro_id", lead.pro_id); // belt and suspenders

  revalidatePath("/ai/dashboard/projets");
}

/**
 * Server Action invoquee via form action depuis /ai/dashboard/projets.
 * Marque un lead comme CONTACTE (contacted_at = NOW(), status='contacted').
 */
export async function markLeadAsContacted(formData: FormData): Promise<void> {
  const leadIdRaw = String(formData.get("leadId") || "");
  const leadId = parseInt(leadIdRaw, 10);
  if (isNaN(leadId) || leadId <= 0) {
    redirect("/ai/dashboard/projets?error=invalid_lead");
  }

  // 1) Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ai/connexion");

  // 2) Verifier ownership
  const service = getServiceClient();
  const { data: lead } = await service
    .from("project_leads")
    .select(
      "id, pro_id, contacted_at, pros!inner(claimed_by_user_id, category_id)"
    )
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) redirect("/ai/dashboard/projets?error=not_found");

  const proRel = Array.isArray(lead.pros) ? lead.pros[0] : lead.pros;
  if (
    !proRel ||
    proRel.claimed_by_user_id !== user.id ||
    !AI_CATEGORY_IDS.includes(proRel.category_id)
  ) {
    redirect("/ai/dashboard/projets?error=unauthorized");
  }

  // 3) Update (idempotent : pas d'overwrite si deja contacted)
  if (!lead.contacted_at) {
    await service
      .from("project_leads")
      .update({
        contacted_at: new Date().toISOString(),
        status: "contacted",
        // opened_at aussi si pas deja set (l'user a forcement vu le lead
        // avant de marquer contacted)
        opened_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .eq("pro_id", lead.pro_id);
  }

  revalidatePath("/ai/dashboard/projets");
  redirect("/ai/dashboard/projets?marked=contacted");
}
