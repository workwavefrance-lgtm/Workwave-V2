"use server";

import { createClient } from "@supabase/supabase-js";
import { sendProjectRetractionEmail } from "@/lib/email/send-project-retraction";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type DeleteState = {
  success: boolean;
  message?: string;
};

export async function deleteProject(
  _prevState: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  const token = formData.get("token") as string;

  if (!token) {
    return { success: false, message: "Token manquant." };
  }

  const supabase = getServiceClient();

  // Vérifier que le projet existe et n'est pas déjà supprimé
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, status, category:categories(name), city:cities(name)"
    )
    .eq("deletion_token", token)
    .single();

  if (projectError || !project) {
    return {
      success: false,
      message: "Demande introuvable ou déjà supprimée.",
    };
  }

  if (project.status === "deleted") {
    return {
      success: false,
      message: "Cette demande a déjà été supprimée.",
    };
  }

  // Marquer le projet comme supprimé
  const { error: updateError } = await supabase
    .from("projects")
    .update({ status: "deleted" })
    .eq("id", project.id);

  if (updateError) {
    console.error("Erreur suppression projet:", updateError);
    return {
      success: false,
      message: "Une erreur est survenue. Veuillez réessayer.",
    };
  }

  // Récupérer les pros qui ont reçu ce lead pour les notifier
  const { data: leads } = await supabase
    .from("project_leads")
    .select("pro_id, sent_at, pro:pros(name, email)")
    .eq("project_id", project.id);

  const category = project.category as unknown as { name: string } | null;
  const city = project.city as unknown as { name: string } | null;

  if (leads && leads.length > 0) {
    for (const lead of leads) {
      const pro = lead.pro as unknown as { name: string; email: string | null } | null;
      if (pro?.email) {
        sendProjectRetractionEmail({
          email: pro.email,
          proName: pro.name,
          categoryName: category?.name || "Non précisé",
          cityName: city?.name || "Non précisée",
          sentDate: lead.sent_at,
        }).catch((err) =>
          console.error(
            `Erreur email rétractation pro ${lead.pro_id}:`,
            err
          )
        );
      }
    }
  }

  return { success: true };
}
