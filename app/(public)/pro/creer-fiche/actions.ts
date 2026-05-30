"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isValidEmail, AI_CATEGORY_IDS } from "@/lib/ai/helpers";

// Rate limit en mémoire : 8 créations / 15 min / IP (anti-spam fiches).
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW
  );
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

// Suppression des accents : \p{Mn} = combining marks apres NFD. Source 100% ASCII
// (pas de plage \u ni de caractere combinant litteral, cf. CLAUDE.md 26/05).
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Mn}/gu, "");
}

function slugify(s: string): string {
  const base = stripAccents((s || "").toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return base || "pro";
}

function normalizeName(x: string): string {
  return stripAccents(x.toLowerCase()).replace(/[^a-z0-9]/g, "");
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function matchCityId(
  sb: ReturnType<typeof getServiceClient>,
  commune: string | null,
  postalCode: string | null
): Promise<number | null> {
  if (!commune || !postalCode) return null;
  const deptCode = String(postalCode).slice(0, 2);
  const { data: dept } = await sb
    .from("departments")
    .select("id")
    .eq("code", deptCode)
    .maybeSingle();
  if (!dept) return null;
  const { data: cities } = await sb
    .from("cities")
    .select("id, name")
    .eq("department_id", dept.id);
  if (!cities) return null;
  const target = normalizeName(commune);
  const match = (cities as { id: number; name: string }[]).find(
    (c) => normalizeName(c.name) === target
  );
  return match?.id ?? null;
}

export type CreateFicheState = { success: boolean; message?: string };

/**
 * Cree une fiche pro a partir d'un SIRET (pour un pro PAS dans notre base).
 * Donnees pre-remplies via l'API recherche-entreprises cote page ; ici on
 * valide, dedoublonne, insere (source="manual", non reclamee), puis on bascule
 * sur le workflow de reclamation existant (/pro/reclamer/[slug]) pour la
 * verification email + creation de compte.
 */
export async function createFiche(
  _prev: CreateFicheState,
  formData: FormData
): Promise<CreateFicheState> {
  // Honeypot anti-bot
  const honeypot = String(formData.get("website_hp") || "");
  if (honeypot.length > 0) return { success: false, message: "Erreur. Réessayez." };

  // Rate limit
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  if (!checkRateLimit(ip)) {
    return { success: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  // Extraction
  const siret = String(formData.get("siret") || "").replace(/\D/g, "");
  const name = String(formData.get("name") || "").trim().slice(0, 150);
  const categoryId = Number(formData.get("category_id") || 0);
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 200);
  const phone = String(formData.get("phone") || "").trim().slice(0, 30);
  const address = String(formData.get("address") || "").trim().slice(0, 300) || null;
  const postalCode = String(formData.get("postal_code") || "").trim().slice(0, 10) || null;
  const commune = String(formData.get("commune") || "").trim().slice(0, 120) || null;
  const naf = String(formData.get("naf") || "").trim().slice(0, 10) || null;
  const foundingDate = String(formData.get("founding_date") || "").trim() || null;

  // Validation
  if (siret.length !== 14) return { success: false, message: "Le SIRET doit contenir 14 chiffres." };
  if (!name) return { success: false, message: "Le nom de l'entreprise est obligatoire." };
  if (!categoryId) return { success: false, message: "Choisissez votre métier." };
  if (!isValidEmail(email)) return { success: false, message: "Adresse email invalide." };
  if (phone.length < 6) return { success: false, message: "Numéro de téléphone invalide." };

  const sb = getServiceClient();

  // La catégorie doit être un métier BTP/services (pas une catégorie tech/AI)
  if ((AI_CATEGORY_IDS as readonly number[]).includes(categoryId)) {
    return { success: false, message: "Métier invalide. Choisissez dans la liste." };
  }
  const { data: category } = await sb
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) {
    return { success: false, message: "Métier invalide. Choisissez dans la liste." };
  }

  // Dédoublonnage : une fiche existe déjà pour ce SIRET ?
  const { data: existing } = await sb
    .from("pros")
    .select("slug, claimed_by_user_id")
    .eq("siret", siret)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) {
    if (existing.claimed_by_user_id) redirect("/pro/connexion?from=lookup");
    redirect(`/pro/reclamer/${existing.slug}`);
  }

  // Ville (best-effort : null si hors de notre couverture)
  const cityId = await matchCityId(sb, commune, postalCode);

  const foundingYear =
    foundingDate && /^\d{4}/.test(foundingDate)
      ? parseInt(foundingDate.slice(0, 4), 10)
      : null;

  const basePayload = {
    name,
    siret,
    siren: siret.slice(0, 9),
    category_id: categoryId,
    address,
    city_id: cityId,
    postal_code: postalCode,
    phone: phone || null,
    email: email || null,
    naf_code: naf,
    founding_date: foundingDate,
    founded_year: foundingYear,
    source: "manual" as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Slug : nom + 5 derniers chiffres du SIRET (quasi-unique). Retry plus long si collision.
  const slugCandidates = [
    `${slugify(name)}-${siret.slice(-5)}`,
    `${slugify(name)}-${siret.slice(-9)}`,
  ];

  let createdSlug: string | null = null;
  for (const slug of slugCandidates) {
    const { error } = await sb.from("pros").insert({ ...basePayload, slug });
    if (!error) {
      createdSlug = slug;
      break;
    }
    // 23505 = unique violation (slug). On retente avec un slug plus long.
    if (error.code !== "23505") {
      console.error("[createFiche] insert error:", error);
      return { success: false, message: "Une erreur technique est survenue. Réessayez." };
    }
  }

  if (!createdSlug) {
    return { success: false, message: "Impossible de créer la fiche (conflit). Réessayez." };
  }

  // Bascule sur le workflow de réclamation existant (vérif email + compte).
  redirect(`/pro/reclamer/${createdSlug}`);
}
