"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sanitizeProfileUrl, AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { PERSONA_COLORS, type PersonaColor } from "@/lib/ai/personalisation";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Update profil freelance Workwave AI.
 * Securite : verifie que l'user connecte possede bien la fiche pros tech
 * concernee (claimed_by_user_id == auth.uid AND category_id in tech).
 */
export async function updateAiProfile(formData: FormData): Promise<void> {
  // 1) Verifier auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ai/connexion");

  // 2) Recuperer pro tech de l'user (avec slug pour revalidatePath public)
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, slug, category_id, claimed_by_user_id")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!pro) redirect("/ai/connexion?error=no_pro");

  // 3) Valider + sanitize les inputs
  // stripControlChars : enleve les caracteres de controle Unicode qui
  // peuvent etre utilises pour afficher des noms deformes/trompeurs sur
  // la fiche publique. Plages couvertes (escapes \u00XX pour rester
  // textuellement propre, pas de chars litteraux dans le fichier source) :
  //   \u0000-\u001F : ASCII control chars (NUL, BEL, BS, etc.)
  //   \u007F-\u009F : DEL + C1 controls
  //   \u200B-\u200D : zero-width space/joiner (invisibles)
  //   \u202A-\u202E : bidi override (LTR/RTL text direction spoofing)
  //   \uFEFF        : BOM zero-width no-break space
  const stripControlChars = (s: string): string =>
    s.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u202A-\u202E\uFEFF]/g, "");

  const name = stripControlChars(String(formData.get("name") || "").trim().slice(0, 200));
  const description = stripControlChars(String(formData.get("description") || "").trim().slice(0, 500));
  const skills = stripControlChars(String(formData.get("skills") || "").trim().slice(0, 500));
  const github = String(formData.get("github_username") || "")
    .trim()
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const linkedinRaw = String(formData.get("linkedin") || "").trim().slice(0, 300);
  // Fix #10 : valider URL pour empecher XSS via javascript:/data: protocols
  const linkedin = linkedinRaw ? sanitizeProfileUrl(linkedinRaw) : null;
  const yearsRaw = String(formData.get("years_experience") || "").trim();
  const rateRaw = String(formData.get("hourly_rate") || "").trim();

  const years = yearsRaw ? Math.min(50, Math.max(0, parseInt(yearsRaw, 10) || 0)) : null;
  const rate = rateRaw ? Math.min(5000, Math.max(50, parseInt(rateRaw, 10) || 0)) : null;

  // 4) Fix #18 : refuser si name vide (empechait l'effacement accidentel
  // mais sans feedback user). On rejette explicitement.
  if (!name) {
    redirect("/ai/dashboard/profil?error=name_required");
  }

  // Phase 12 — personnalisation (avatar_color + theme_color)
  // Whitelist stricte : on n'accepte QUE les 8 couleurs autorisees.
  // Si l'input est absent ou invalide, on retombe sur null (= orange par defaut).
  const avatarColorRaw = String(formData.get("avatar_color") || "").trim();
  const themeColorRaw = String(formData.get("theme_color") || "").trim();
  const avatarColor: PersonaColor | null = PERSONA_COLORS.includes(
    avatarColorRaw as PersonaColor
  )
    ? (avatarColorRaw as PersonaColor)
    : null;
  const themeColor: PersonaColor | null = PERSONA_COLORS.includes(
    themeColorRaw as PersonaColor
  )
    ? (themeColorRaw as PersonaColor)
    : null;

  // 5) Update via service (bypass RLS, mais on a deja check ownership)
  await service
    .from("pros")
    .update({
      name,
      description: description || null,
      skills: skills || null,
      github_username: github || null,
      linkedin: linkedin || null,
      years_experience: years,
      hourly_rate: rate,
      avatar_color: avatarColor,
      theme_color: themeColor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pro.id);

  // 5) Revalidate UNIQUEMENT la page publique du freelance pour ISR.
  // Lecon 28/04/2026 : ne PAS revalidatePath sur le dashboard ou l'user est
  // actuellement (casse les uncontrolled inputs + reaffiche les fieldErrors
  // stale). Le redirect ci-dessous suffit pour re-render le dashboard avec
  // les nouvelles donnees.
  if (pro.slug) {
    revalidatePath(`/ai/freelance/${pro.slug}`);
  }

  redirect("/ai/dashboard/profil?saved=1");
}
