import { NextRequest, NextResponse } from "next/server";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { generateBlogArticle } from "@/lib/ai/generate-blog";

/**
 * Cron endpoint : genere un article de blog par jour.
 * Securise par CRON_SECRET (header Authorization: Bearer <secret>).
 *
 * Vercel cron config dans vercel.json :
 * { "crons": [{ "path": "/api/cron/daily-blog", "schedule": "0 8 * * *" }] }
 */
export async function GET(request: NextRequest) {
  // Verifier le secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminServiceClient();

  // Prendre le prochain sujet en queue
  const { data: queueItem, error: queueError } = await supabase
    .from("blog_queue")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: true })
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  if (queueError || !queueItem) {
    return NextResponse.json({
      message: "Aucun sujet en queue",
    });
  }

  const item = queueItem as {
    id: number;
    category_slug: string;
    city_slug: string | null;
    topic_type: string;
    title_suggestion: string | null;
  };

  // Marquer comme en cours
  await supabase
    .from("blog_queue")
    .update({ status: "generating" } as never)
    .eq("id", item.id);

  try {
    // Charger la categorie
    const { data: category } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("slug", item.category_slug)
      .single();

    if (!category) {
      await supabase
        .from("blog_queue")
        .update({ status: "failed", error_message: "Categorie introuvable" } as never)
        .eq("id", item.id);
      return NextResponse.json({ error: "Categorie introuvable" }, { status: 404 });
    }

    const cat = category as { name: string; slug: string };

    // Charger la ville si specifiee
    let cityName: string | undefined;
    let citySlug: string | undefined;
    if (item.city_slug) {
      const { data: city } = await supabase
        .from("cities")
        .select("name, slug")
        .eq("slug", item.city_slug)
        .single();
      if (city) {
        const c = city as { name: string; slug: string };
        cityName = c.name;
        citySlug = c.slug;
      }
    }

    // Generer l'article
    const article = await generateBlogArticle({
      categoryName: cat.name,
      categorySlug: cat.slug,
      cityName,
      citySlug,
      topicType: item.topic_type as "guide" | "comparaison" | "prix" | "reglementation" | "checklist",
      titleSuggestion: item.title_suggestion || undefined,
    });

    // Verifier qu'un article avec ce slug n'existe pas deja
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", article.slug)
      .single();

    const finalSlug = existing ? `${article.slug}-${Date.now()}` : article.slug;

    // Inserer l'article (publie automatiquement)
    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        slug: finalSlug,
        title: article.title,
        meta_description: article.metaDescription,
        content: article.content,
        category_slug: item.category_slug,
        city_slug: item.city_slug,
        tags: article.tags,
        status: "published",
        published_at: new Date().toISOString(),
      } as never)
      .select("id")
      .single();

    if (insertError) {
      await supabase
        .from("blog_queue")
        .update({ status: "failed", error_message: insertError.message } as never)
        .eq("id", item.id);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Marquer comme genere
    await supabase
      .from("blog_queue")
      .update({
        status: "generated",
        blog_post_id: (post as { id: number }).id,
      } as never)
      .eq("id", item.id);

    return NextResponse.json({
      success: true,
      title: article.title,
      slug: finalSlug,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
    await supabase
      .from("blog_queue")
      .update({ status: "failed", error_message: errorMessage } as never)
      .eq("id", item.id);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
