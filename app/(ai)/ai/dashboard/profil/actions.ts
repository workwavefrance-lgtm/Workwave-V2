"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sanitizeProfileUrl, AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { PERSONA_COLORS, type PersonaColor } from "@/lib/ai/personalisation";
import { localizeAiPath, type Locale } from "@/lib/i18n/config";

/**
 * Lit la locale depuis le FormData (champ cache name="locale" pose par les
 * pages EN). Defaut "fr" => toutes les redirections restent strictement
 * identiques au comportement FR de prod (additif uniquement).
 */
function readLocale(formData?: FormData): Locale {
  return String(formData?.get("locale") || "fr") === "en" ? "en" : "fr";
}

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
  const locale = readLocale(formData);
  // 1) Verifier auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localizeAiPath("/ai/connexion", locale));

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

  if (!pro) redirect(localizeAiPath("/ai/connexion", locale) + "?error=no_pro");

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
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=name_required");
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

  redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?saved=1");
}

// ============================================
// Upload avatar photo (Phase 12)
// ============================================

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 Mo
const ALLOWED_AVATAR_MIMES = ["image/jpeg", "image/png", "image/webp"];

function generateAvatarFileName(proId: number, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const ts = Date.now();
  return `${proId}/avatar-${ts}.${ext}`;
}

/**
 * Upload une photo de profil pour un freelance Workwave AI.
 * Stockee dans le bucket Supabase Storage 'pro-logos' (partage avec BTP).
 * Met a jour `pros.logo_url` avec l'URL publique.
 *
 * Securite :
 *   - Auth check via supabase.auth.getUser()
 *   - Match pro via claimed_by_user_id == auth.uid AND category_id in AI
 *   - Validation type MIME (jpeg/png/webp uniquement) + taille (max 2 Mo)
 *
 * Effets :
 *   - Upload fichier dans pro-logos/{proId}/avatar-{ts}.ext
 *   - Suppression de l'ancien logo si existant (idempotent)
 *   - Update pros.logo_url avec la nouvelle URL publique
 *   - Revalidate /ai/freelance/{slug} (page publique seulement)
 */
export async function uploadAiAvatar(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  // 1) Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localizeAiPath("/ai/connexion", locale));

  // 2) Recup pro
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, slug, logo_url")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect(localizeAiPath("/ai/connexion", locale) + "?error=no_pro");

  // 3) Recup fichier
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=avatar_no_file");
  }
  if (!ALLOWED_AVATAR_MIMES.includes(file.type)) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=avatar_invalid_type");
  }
  if (file.size > MAX_AVATAR_SIZE) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=avatar_too_large");
  }

  // 4) Upload Supabase Storage
  const fileName = generateAvatarFileName(pro.id, file.name);
  const { error: uploadError } = await service.storage
    .from("pro-logos")
    .upload(fileName, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[uploadAiAvatar] upload failed:", uploadError.message);
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=avatar_upload_failed");
  }

  const { data: urlData } = service.storage.from("pro-logos").getPublicUrl(fileName);

  // 5) Cleanup ancien logo si existant
  if (pro.logo_url) {
    const oldPath = pro.logo_url.split("/pro-logos/")[1];
    if (oldPath) {
      // Non-bloquant : si la suppression echoue (ex. fichier deja absent),
      // on continue. Le nouvel upload remplace deja la reference en BDD.
      await service.storage.from("pro-logos").remove([oldPath]);
    }
  }

  // 6) Update pros.logo_url
  await service
    .from("pros")
    .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  // 7) Revalidate page publique (pas le dashboard)
  if (pro.slug) {
    revalidatePath(`/ai/freelance/${pro.slug}`);
  }

  redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?saved=1#avatar");
}

/**
 * Supprime la photo de profil (revient aux initiales avec couleur).
 */
export async function deleteAiAvatar(formData?: FormData): Promise<void> {
  const locale = readLocale(formData);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localizeAiPath("/ai/connexion", locale));

  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, slug, logo_url")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect(localizeAiPath("/ai/connexion", locale) + "?error=no_pro");

  if (pro.logo_url) {
    const oldPath = pro.logo_url.split("/pro-logos/")[1];
    if (oldPath) {
      await service.storage.from("pro-logos").remove([oldPath]);
    }
  }

  await service
    .from("pros")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (pro.slug) {
    revalidatePath(`/ai/freelance/${pro.slug}`);
  }

  redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?saved=1#avatar");
}

// ============================================
// Portfolio photos (galerie sur fiche publique)
// ============================================

const MAX_PORTFOLIO_PHOTOS = 10;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 Mo (photos plus grandes que l'avatar)
const ALLOWED_PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"];

function generatePhotoFileName(proId: number, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${proId}/portfolio-${ts}-${rand}.${ext}`;
}

/**
 * Ajoute une photo au portfolio (galerie publique sur la fiche).
 * Limite : MAX_PORTFOLIO_PHOTOS photos max par freelance.
 * Stockage : bucket Supabase 'pro-photos' (partage avec BTP).
 */
export async function addAiPortfolioPhoto(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  // 1) Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localizeAiPath("/ai/connexion", locale));

  // 2) Recup pro avec son tableau photos actuel
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, slug, photos")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect(localizeAiPath("/ai/connexion", locale) + "?error=no_pro");

  // 3) Verifier la limite
  const currentPhotos: string[] = Array.isArray(pro.photos) ? pro.photos : [];
  if (currentPhotos.length >= MAX_PORTFOLIO_PHOTOS) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=portfolio_max#portfolio");
  }

  // 4) Recup fichier
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=photo_no_file#portfolio");
  }
  if (!ALLOWED_PHOTO_MIMES.includes(file.type)) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=photo_invalid_type#portfolio");
  }
  if (file.size > MAX_PHOTO_SIZE) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=photo_too_large#portfolio");
  }

  // 5) Upload
  const fileName = generatePhotoFileName(pro.id, file.name);
  const { error: uploadError } = await service.storage
    .from("pro-photos")
    .upload(fileName, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[addAiPortfolioPhoto] upload failed:", uploadError.message);
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=photo_upload_failed#portfolio");
  }

  const { data: urlData } = service.storage.from("pro-photos").getPublicUrl(fileName);

  // 6) Append URL au tableau photos
  const newPhotos = [...currentPhotos, urlData.publicUrl];
  await service
    .from("pros")
    .update({ photos: newPhotos, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  // 7) Revalidate page publique
  if (pro.slug) {
    revalidatePath(`/ai/freelance/${pro.slug}`);
  }

  redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?saved=1#portfolio");
}

/**
 * Supprime une photo du portfolio par son URL.
 */
export async function deleteAiPortfolioPhoto(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  const photoUrl = String(formData.get("photoUrl") || "").trim();
  if (!photoUrl) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=photo_missing#portfolio");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localizeAiPath("/ai/connexion", locale));

  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, slug, photos")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect(localizeAiPath("/ai/connexion", locale) + "?error=no_pro");

  const currentPhotos: string[] = Array.isArray(pro.photos) ? pro.photos : [];
  // Verif que la photo appartient bien au pro (anti-CSRF/spoof)
  if (!currentPhotos.includes(photoUrl)) {
    redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?error=photo_not_yours#portfolio");
  }

  // Supprimer du storage Supabase (best-effort, on continue meme si echec)
  const storagePath = photoUrl.split("/pro-photos/")[1];
  if (storagePath) {
    await service.storage.from("pro-photos").remove([storagePath]);
  }

  // Update photos array (filter)
  const newPhotos = currentPhotos.filter((u) => u !== photoUrl);
  await service
    .from("pros")
    .update({ photos: newPhotos, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (pro.slug) {
    revalidatePath(`/ai/freelance/${pro.slug}`);
  }

  redirect(localizeAiPath("/ai/dashboard/profil", locale) + "?saved=1#portfolio");
}
