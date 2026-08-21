"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service-client";
import { getProByUserId } from "@/lib/queries/pros";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";

/** Client admin (service role) pour les opérations storage qui bypass les RLS.
 *  Partage : un client neuf par appel lancerait une minuterie jamais arretee
 *  (cf. lib/supabase/service-client.ts). */
const createAdminClient = getServiceClient;

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
const MAX_COUVERTURE_SIZE = 5 * 1024 * 1024; // 5 Mo, comme une realisation
const MAX_LEGENDE = 160; // une phrase, pas un paragraphe

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
  // Metier PRINCIPAL, modifiable par le pro lui-meme.
  //
  // Pourquoi c'est indispensable : les codes d'activite INSEE sont ambigus. Le
  // 96.09Z « autres services personnels » couvre aussi bien la garde d'animaux
  // que le tatouage ou les services domestiques ; le 8121Z melange menage et
  // nettoyage professionnel ; le 4334Z melange peintre et vitrier. Le classement
  // automatique se trompe donc regulierement, et le pro etait le seul a pouvoir
  // corriger, sans en avoir les moyens.
  //
  // Cas reel du 04/08/2026 : une pro classee « garde animaux » par deduction du
  // 96.09Z, qui avait ajoute « multiservice » en categorie SECONDAIRE faute de
  // pouvoir toucher a la principale. Sa fiche continuait d'afficher un metier
  // qui n'etait pas le sien.
  category_id: z.coerce.number().int().positive().optional(),
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
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
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
    category_id: formData.get("category_id")
      ? Number(formData.get("category_id"))
      : undefined,
    // On exclut le metier principal des secondaires, en prenant celui que le pro
    // vient de CHOISIR, pas l'ancien : sinon il resterait en doublon dans la liste.
    secondary_category_ids: formData
      .getAll("secondary_category_ids")
      .map(Number)
      .filter((id) => id !== Number(formData.get("category_id") || pro.category_id)),
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
    // Construire un message d'erreur global listant les champs manquants
    const fieldLabels: Record<string, string> = {
      name: "Nom commercial",
      phone: "Téléphone",
      email: "Email de contact",
      description: "Description",
    };
    const missingFields = Object.keys(fieldErrors)
      .map((f) => fieldLabels[f] || f)
      .join(", ");
    return {
      fieldErrors,
      error: `Impossible de sauvegarder. Veuillez corriger : ${missingFields}`,
    };
  }

  const data = parsed.data;

  // Limite catégories secondaires : 10 (vs 3 historique). 10 = couvre une vraie
  // entreprise BTP multi-métiers (ex. Frederick Florit fait plaquiste +
  // plombier + électricien + chauffagiste + couvreur + peintre + climaticien).
  const secondaryCats = (data.secondary_category_ids || []).slice(0, 10);

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

  // Metier principal : on ne fait confiance a rien de ce qui vient du formulaire.
  // On verifie que la categorie existe VRAIMENT en base avant de l'ecrire : un
  // identifiant fantaisiste rendrait la fiche invisible partout, elle
  // n'apparaitrait plus dans aucun listing. Au moindre doute, on garde l'actuelle.
  // Changement de metier principal.
  //
  // Le VERTICAL est verrouille cote serveur : un pro BTP ne peut basculer que
  // vers un autre metier BTP/domicile/personne, jamais vers une categorie tech
  // (/ai/*), qui a son propre dashboard, son propre routage et sa propre
  // facturation. Le menu du dashboard filtre deja par vertical, mais un menu
  // n'est pas une barriere : la requete peut etre forgee. C'est la lecon du
  // 07/08 : un controle pose sur l'interface doit l'etre sur le serveur.
  if (data.category_id && data.category_id !== pro.category_id) {
    const { data: cible } = await supabase
      .from("categories")
      .select("id, vertical")
      .eq("id", data.category_id)
      .maybeSingle();
    const { data: actuelle } = await supabase
      .from("categories")
      .select("vertical")
      .eq("id", pro.category_id)
      .maybeSingle();
    if (cible && actuelle && cible.vertical === actuelle.vertical) {
      updateData.category_id = data.category_id;
    }
  }

  const { error } = await supabase
    .from("pros")
    .update(updateData)
    .eq("id", pro.id);

  if (error) return { error: "Erreur lors de la sauvegarde" };

  // Tracking (fire-and-forget)
  track(EVENTS.PRO_PROFILE_UPDATED, {
    proId: pro.id,
    metadata: { profileCompletion: updateData.profile_completion },
  });

  // ⚠️ NE PAS revalidatePath("/pro/dashboard/fiche") : ça fait un re-render RSC
  // pendant que le pro est sur la page → reset des uncontrolled inputs (mail,
  // tel, site web disparaissent et le user doit les retaper) + réaffichage de
  // fieldErrors stale d'un précédent submit. Cf. leçon CLAUDE.md 28/04/2026.
  // On revalidate uniquement la fiche publique /artisan/[slug] qui doit
  // refléter les modifs côté visiteur.
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

  if (uploadError) {
    console.error("[uploadProLogo] storage error :", uploadError.message);
    return { error: `Upload impossible : ${uploadError.message}` };
  }

  const { data: urlData } = admin.storage
    .from("pro-logos")
    .getPublicUrl(fileName);

  const { error: updateError } = await admin
    .from("pros")
    .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (updateError) {
    // On ne laisse pas un fichier orphelin dans le compartiment.
    await admin.storage.from("pro-logos").remove([fileName]);
    return { error: "Erreur lors de la mise à jour" };
  }

  // L'ancien logo n'est supprime QU'APRES le succes de l'ecriture (21/08/2026).
  // Il l'etait avant : si la mise a jour echouait, la fiche continuait de
  // pointer vers un fichier qui venait d'etre efface, et le pro se retrouvait
  // avec un logo casse sur sa page publique comme dans son tableau de bord.
  if (pro.logo_url) {
    const oldPath = pro.logo_url.split("/pro-logos/")[1];
    if (oldPath) {
      await admin.storage.from("pro-logos").remove([oldPath]);
    }
  }

  // Pas de revalidatePath sur /pro/dashboard/fiche : le state client gere
  // deja l'affichage du nouveau logo (setLogoUrl). Revalider le dashboard ici
  // declenche un re-render RSC qui peut effacer les valeurs DOM des inputs
  // uncontrolled (defaultValue) et reafficher des fieldErrors stale.
  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true, url: urlData.publicUrl };
}

// ============================================
// Photo de couverture
// ============================================

/**
 * Envoi de la photo de couverture affichee en haut de la fiche.
 *
 * Elle est FOURNIE par le pro, jamais fabriquee a partir de ses photos de
 * chantier : mesure du 21/08/2026 sur seize photos reelles, treize sont en
 * portrait et la plus etroite fait 720x1560. La decouper en bandeau large ne
 * garderait que 19 % de la hauteur, soit une tranche de tronc d'arbre.
 *
 * Elle vit dans le compartiment existant `pro-photos` sous un prefixe
 * `couverture/`, donc aucun nouveau compartiment ni nouvelle regle d'acces.
 */
export async function uploadProCover(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  const file = formData.get("couverture") as File | null;
  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné" };

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Format accepté : JPEG, PNG ou WebP" };
  }
  if (file.size > MAX_COUVERTURE_SIZE) {
    const mo = (file.size / 1024 / 1024).toFixed(1);
    return { error: `Cette image pèse ${mo} Mo, le maximum est de 5 Mo. Réduisez-la ou choisissez-en une autre.` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `couverture/${pro.id}/${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("pro-photos")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[uploadProCover] storage error :", uploadError.message);
    return { error: `Envoi impossible : ${uploadError.message}` };
  }

  const { data: urlData } = admin.storage.from("pro-photos").getPublicUrl(fileName);

  const { error: updateError } = await admin
    .from("pros")
    .update({ cover_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (updateError) {
    console.error("[uploadProCover] update error :", updateError.message);
    // On ne laisse pas un fichier orphelin dans le compartiment.
    await admin.storage.from("pro-photos").remove([fileName]);
    return { error: "Erreur lors de la mise à jour" };
  }

  // L'ancienne couverture n'est supprimee QU'APRES le succes de la mise a
  // jour : si on la supprimait avant et que l'ecriture echouait, la fiche
  // pointerait vers un fichier qui n'existe plus.
  const ancienne = (pro as { cover_url?: string | null }).cover_url;
  if (ancienne) {
    const chemin = ancienne.split("/pro-photos/")[1];
    if (chemin) await admin.storage.from("pro-photos").remove([chemin]);
  }

  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true, url: urlData.publicUrl };
}

/** Retrait de la photo de couverture. La fiche retombe sur le fond calme. */
export async function deleteProCover(): Promise<UploadState> {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const actuelle = (pro as { cover_url?: string | null }).cover_url;

  const { error } = await admin
    .from("pros")
    .update({ cover_url: null, updated_at: new Date().toISOString() })
    .eq("id", pro.id);
  if (error) return { error: "Erreur lors de la mise à jour" };

  if (actuelle) {
    const chemin = actuelle.split("/pro-photos/")[1];
    if (chemin) await admin.storage.from("pro-photos").remove([chemin]);
  }

  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true };
}

// ============================================
// Legendes des realisations
// ============================================

/**
 * Enregistre la legende d'une realisation.
 *
 * C'est le seul texte de la fiche que personne d'autre ne possede. Mesure du
 * 20/08/2026 : deux fiches voisines (meme metier, meme commune) partagent
 * 71,4 % de leur texte, dont 28 points ecrits par la plateforme. Une phrase
 * ecrite par l'artisan sur SON chantier est du contenu unique, et c'est ce
 * que Google Images lit dans le texte alternatif.
 *
 * Stockage : une table de correspondance {url: legende}, clef = URL de la
 * photo. Pas d'index numerique, qui se decalerait a la premiere suppression
 * et collerait la legende d'un chantier sur la photo d'un autre.
 */
export async function saveProPhotoCaption(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  const url = String(formData.get("url") || "");
  const legende = String(formData.get("legende") || "").trim();

  const photos: unknown = pro.photos;
  const liste = Array.isArray(photos) ? photos : [];
  // Garde anti-usurpation : on n'ecrit une legende que pour une photo qui
  // appartient VRAIMENT a ce pro.
  if (!url || !liste.includes(url)) {
    return { error: "Photo introuvable" };
  }
  if (legende.length > MAX_LEGENDE) {
    return { error: `La légende ne doit pas dépasser ${MAX_LEGENDE} caractères` };
  }

  const actuelles = (pro as { photo_captions?: Record<string, string> | null }).photo_captions;
  const table: Record<string, string> =
    actuelles && typeof actuelles === "object" && !Array.isArray(actuelles)
      ? { ...actuelles }
      : {};

  if (legende) table[url] = legende;
  else delete table[url];

  const admin = createAdminClient();
  const { error } = await admin
    .from("pros")
    .update({ photo_captions: table, updated_at: new Date().toISOString() })
    .eq("id", pro.id);
  if (error) {
    console.error("[saveProPhotoCaption] update error :", error.message);
    return { error: "Erreur lors de l'enregistrement" };
  }

  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true };
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

  if (uploadError) {
    // Log la vraie erreur c\u00f4t\u00e9 serveur pour debug (bucket manquant, RLS,
    // policies storage, quota, etc.) + remonter un message + d\u00e9taill\u00e9 au pro.
    console.error("[uploadProPhoto] storage error :", uploadError.message);
    return { error: `Upload impossible : ${uploadError.message}` };
  }

  const { data: urlData } = admin.storage
    .from("pro-photos")
    .getPublicUrl(fileName);

  const updatedPhotos = [...currentPhotos, urlData.publicUrl];

  const { error: updateError } = await admin
    .from("pros")
    .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
    .eq("id", pro.id);

  if (updateError) return { error: "Erreur lors de la mise à jour" };

  // Pas de revalidatePath sur /pro/dashboard/fiche : meme raison que pour
  // uploadProLogo (cf. commentaire). Le client gere setPhotos.
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

  // La legende part avec sa photo, mais dans une ECRITURE SEPAREE et non
  // bloquante. Raison : tant que la migration 2026-08-21 n'est pas appliquee,
  // la colonne `photo_captions` n'existe pas. Si on l'incluait dans la mise a
  // jour ci-dessus, la suppression de photo, qui fonctionne aujourd'hui,
  // echouerait pour tous les pros. Un nettoyage rate laisse une entree
  // orpheline sans consequence visible ; une suppression ratee, elle, est un
  // sujet d'image et de RGPD.
  const legendes = (pro as { photo_captions?: Record<string, string> | null }).photo_captions;
  if (legendes && typeof legendes === "object" && !Array.isArray(legendes) && photoUrl in legendes) {
    const tableNettoyee = { ...legendes };
    delete tableNettoyee[photoUrl];
    const { error: erreurLegende } = await admin
      .from("pros")
      .update({ photo_captions: tableNettoyee })
      .eq("id", pro.id);
    if (erreurLegende) {
      console.error("[deleteProPhoto] nettoyage de la legende impossible :", erreurLegende.message);
    }
  }

  // Pas de revalidatePath sur /pro/dashboard/fiche : meme raison que pour
  // uploadProLogo (cf. commentaire). Le client gere setPhotos.
  revalidatePath(`/artisan/${pro.slug}`);
  return { success: true };
}
