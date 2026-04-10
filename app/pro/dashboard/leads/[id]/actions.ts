"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";

async function getAuthenticatedProId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getProByUserId(user.id);
  return pro?.id || null;
}

async function verifyLeadOwnership(
  leadId: number,
  proId: number
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_leads")
    .select("id")
    .eq("id", leadId)
    .eq("pro_id", proId)
    .single();

  return !!data;
}

export async function markLeadOpened(leadId: number) {
  const proId = await getAuthenticatedProId();
  if (!proId) return { error: "Non authentifié" };

  const isOwner = await verifyLeadOwnership(leadId, proId);
  if (!isOwner) return { error: "Lead introuvable" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_leads")
    .update({
      status: "opened",
      opened_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("pro_id", proId)
    .in("status", ["sent"]);

  if (error) return { error: "Erreur lors de la mise à jour" };

  revalidatePath("/pro/dashboard/leads");
  revalidatePath(`/pro/dashboard/leads/${leadId}`);
  return { success: true };
}

export async function markLeadContacted(leadId: number) {
  const proId = await getAuthenticatedProId();
  if (!proId) return { error: "Non authentifié" };

  const isOwner = await verifyLeadOwnership(leadId, proId);
  if (!isOwner) return { error: "Lead introuvable" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_leads")
    .update({
      status: "contacted",
      contacted_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("pro_id", proId);

  if (error) return { error: "Erreur lors de la mise à jour" };

  revalidatePath("/pro/dashboard/leads");
  revalidatePath(`/pro/dashboard/leads/${leadId}`);
  revalidatePath("/pro/dashboard");
  return { success: true };
}

export async function markLeadNotRelevant(leadId: number) {
  const proId = await getAuthenticatedProId();
  if (!proId) return { error: "Non authentifié" };

  const isOwner = await verifyLeadOwnership(leadId, proId);
  if (!isOwner) return { error: "Lead introuvable" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_leads")
    .update({
      status: "not_relevant",
      not_relevant: true,
    })
    .eq("id", leadId)
    .eq("pro_id", proId);

  if (error) return { error: "Erreur lors de la mise à jour" };

  revalidatePath("/pro/dashboard/leads");
  revalidatePath(`/pro/dashboard/leads/${leadId}`);
  revalidatePath("/pro/dashboard");
  return { success: true };
}
