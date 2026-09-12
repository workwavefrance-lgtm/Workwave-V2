import type { BlogPost } from "./blog";
import { getCategoryBySlug } from "./categories";
import { getCityBySlug } from "./cities";
import { createPublicClient } from "@/lib/supabase/public-client";

/** Les destinations métier/ville et prix sont vérifiées en base avant rendu. */
export async function getBlogRelatedLinks(post: BlogPost) {
  const categorySlug = post.category_slug || post.tags?.[0]?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [category, city] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : null,
    post.city_slug ? getCityBySlug(post.city_slug) : null,
  ]);
  const links: { href: string; label: string }[] = [];
  const params = new URLSearchParams();
  if (category) {
    params.set("categorie", category.slug);
    if (city) params.set("ville", city.slug);
    links.push({
      href: city ? `/${category.slug}/${city.slug}` : `/${category.slug}`,
      label: city ? `${category.name} à ${city.name} : comparer les professionnels` : `${category.name} : choisir votre ville`,
    });
    const { data: guides, error } = await createPublicClient().from("price_guides")
      .select("slug, scope, metier_slug, h1").eq("status", "published")
      .eq("metier_slug", category.slug).order("id").limit(3);
    if (error) throw new Error(`Lecture des guides liés au blog impossible : ${error.message}`);
    for (const guide of guides ?? []) {
      links.push({ href: guide.scope === "metier" ? `/${category.slug}/prix` : `/guide-des-prix/${guide.slug}`, label: guide.h1 });
    }
  } else {
    links.push({ href: "/recherche", label: "Rechercher un professionnel près de chez vous" });
  }
  if (links.length === 1) links.push({ href: "/guide-des-prix", label: "Consulter les guides de prix" });
  return { tags: post.tags.filter((tag) => !(city && city.department.code !== "86" && tag.toLowerCase() === "vienne")), links, projectHref: `/deposer-projet${params.size ? `?${params}` : ""}` };
}
