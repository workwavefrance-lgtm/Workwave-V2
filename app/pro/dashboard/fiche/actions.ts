"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getProByUserId } from "@/lib/queries/pros";

/** Client admin (service role) pour les opérations storage qui bypass les RLS */
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================
// Helpers
// ============================================

async function getAuthenticatedPro() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const pro = await getProByUserId(user.id);
  return pro;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 10;

function generateUniqueFileName(proId: number, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const id = crypto.randomUUID();
  return `${proId}/${id}.${ext}`;
}

// ============================================
// Calcul profil complété
// ============================================

function calculateProfileCompletion(pro: Record<string, unknown>): number {
  const fields = [
    !!pro.name,
    !!pro.description,
    !!pro.phone,
    !!pro.email,
    !!pro.logo_url,
    Array.isArray(pro.photos) && pro.photos.length > 0,
    !!pro.founded_year,
    !!pro.website,
    Array.isArray(pro.certifications) && pro.certifications.length > 0,
    !!(pro.has_rc_pro || pro.has_decennale),
    !!pro.opening_hours,
    Array.isArray(pro.payment_methods) && pro.payment_methods.length > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ============================================
// Update profil
// ============================================

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .default(""),
  phone: z
    .string()
    .min(1, "Le téléphone est obligatoire"),
  email: z
    .string()
    .email("Adresse email invalide"),
  website: z.string().optional().default(""),
  instagram: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  founded_year: z
    .union([z.coerce.number().int().min(1800).max(new Date().getFullYear()), z.literal(0)])
    .optional(),
  has_rc_pro: z.boolean().optional().default(false),
  has_decennale: z.boolean().optional().default(false),
  free_quote: z.boolean().optional().default(true),
  rge_number: z.string().optional().default(""),
  certifications: z.array(z.string()).optional().default([]),
  payment_methods: z.array(z.string()).optional().default([]),
  secondary_category_ids: z.array(z.coerce.number()).optional().default([]),
  hourly_rate: z.union([z.coerce.number().min(0), z.literal(0), z.nan()]).optional(),
  travel_fee: z.union([z.coerce.number().min(0), z.literal(0), z.nan()]).optional(),
  opening_hours: z.record(z.string(), z.object({
    open: z.boolean(),
    from: z.string(),
    to: z.string(),
  })).optional(),
});

export type ProfileFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  // Extraire les données du formData
  const rawData: Record<string, unknown> = {
    name: formData.get("name"),
    description: formData.get("description") || "",
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website") || "",
    instagram: formData.get("instagram") || "",
    facebook: formData.get("facebook") || "",
    linkedin: formData.get("linkedin") || "",
    founded_year: formData.get("founded_year")
      ? Number(formData.get("founded_year"))
      : 0,
    has_rc_pro: formData.get("has_rc_pro") === "true",
    has_decennale: formData.get("has_decennale") === "true",
    free_quote: formData.get("free_quote") !== "false",
    rge_number: formData.get("rge_number") || "",
    certifications: formData.getAll("certifications").map(String),
    payment_methods: formData.getAll("payment_methods").map(String),
    secondary_category_ids: formData
      .getAll("secondary_category_ids")
      .map(Number)
      .filter((id) => id !== pro.category_id),
    hourly_rate: formData.get("hourly_rate")
      ? Number(formData.get("hourly_rate"))
      : undefined,
    travel_fee: formData.get("travel_fee")
      ? Number(formData.get("travel_fee"))
      : undefined,
  };

  // Parser les horaires
  const openingHoursRaw = formData.get("opening_hours");
  if (openingHoursRaw) {
    try {
      rawData.opening_hours = JSON.parse(openingHoursRaw as string);
    } catch {
      // Ignorer si mal formé
    }
  }

  const parsed = profileSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field) fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  // Limiter les catégories secondaires à 3
  const secondaryCats = (data.secondary_category_ids || []).slice(0, 3);

  const updateData: Record<string, unknown> = {
    name: data.name,
    description: data.description || null,
    phone: data.phone,
    email: data.email,
    website: data.website || null,
    instagram: data.instagram || null,
    facebook: data.facebook || null,
    linkedin: data.linkedin || null,
    founded_year: data.founded_year && data.founded_year > 0 ? data.founded_year : null,
    has_rc_pro: data.has_rc_pro,
    has_decennale: data.has_decennale,
    free_quote: data.free_quote,
    rge_number: data.rge_number || null,
    certifications: data.certifications,
    payment_methods: data.payment_methods,
    secondary_category_ids: secondaryCats.length > 0 ? secondaryCats : null,
    hourly_rate: data.hourly_rate && !isNaN(data.hourly_rate) ? data.hourly_rate : null,
    travel_fee: data.travel_fee && !isNaN(data.travel_fee) ? data.travel_fee : null,
    opening_hours: data.opening_hours || null,
    updated_at: new Date().toISOString(),
  };

  // Calculer la complétion
  const merged = { ...pro, ...updateData };
  updateData.profile_completion = calculateProfileCompletion(merged);

  const supabase = await createClient();
  const { error } = await supabase
    .from("pros")
    .update(updateData)
    .eq("id", pro.id);

  if (error) return { error: "Erreur lors de la sauvegarde" };

  revalidatePath("/pro/dashboard/fiche");
  revalidatePath("/pro/dashboard");
  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true };
}

// ============================================
// Upload logo
// ============================================

export type UploadState = {
  success?: boolean;
  error?: string;
  url?: string;
};

export async function uploadProLogo(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné" };

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Format accepté : JPEG, PNG ou WebP" };
  }

  if (file.size > MAX_LOGO_SIZE) {
    return { error: "Le logo ne doit pas dépasser 2 Mo" };
  }

  const fileName = generateUniqueFileName(pro.id, file.name);
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("pro-logos")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Erreur lors de l\u2019upload" };

  const { data: urlData } = admin.storage
    .from("pro-logos")
    .getPublicUrl(fileName);

  // Supprimer l'ancien logo si existant
  if (pro.logo_url) {
    const oldPath = pro.logo_url.split("/pro-logos/")[1];
    if (oldPath) {
      await admin.storage.from("pro-logos").remove([oldPath]);
    }
  }

  const { error: updateError } = await admin
    .from("pros")
    .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (updateError) return { error: "Erreur lors de la mise à jour" };

  revalidatePath("/pro/dashboard/fiche");
  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true, url: urlData.publicUrl };
}

// ============================================
// Upload photo galerie
// ============================================

export async function uploadProPhoto(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  const currentPhotos = pro.photos || [];
  if (currentPhotos.length >= MAX_PHOTOS) {
    return { error: `Maximum ${MAX_PHOTOS} photos atteint` };
  }

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné" };

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Format accepté : JPEG, PNG ou WebP" };
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return { error: "La photo ne doit pas dépasser 5 Mo" };
  }

  const fileName = generateUniqueFileName(pro.id, file.name);
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("pro-photos")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Erreur lors de l\u2019upload" };

  const { data: urlData } = admin.storage
    .from("pro-photos")
    .getPublicUrl(fileName);

  const updatedPhotos = [...currentPhotos, urlData.publicUrl];

  const { error: updateError } = await admin
    .from("pros")
    .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (updateError) return { error: "Erreur lors de la mise à jour" };

  revalidatePath("/pro/dashboard/fiche");
  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true, url: urlData.publicUrl };
}

// ============================================
// Supprimer une photo
// ============================================

export async function deleteProPhoto(photoUrl: string) {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  const currentPhotos = pro.photos || [];
  if (!currentPhotos.includes(photoUrl)) {
    return { error: "Photo introuvable" };
  }

  // Supprimer du storage
  const admin = createAdminClient();
  const path = photoUrl.split("/pro-photos/")[1];
  if (path) {
    await admin.storage.from("pro-photos").remove([path]);
  }

  const updatedPhotos = currentPhotos.filter((p) => p !== photoUrl);

  const { error } = await admin
    .from("pros")
    .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (error) return { error: "Erreur lors de la suppression" };

  revalidatePath("/pro/dashboard/fiche");
  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true };
}
