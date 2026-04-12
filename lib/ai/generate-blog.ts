/**
 * Generation d'articles de blog SEO via Claude Sonnet.
 * Articles de 800-1200 mots cibles sur un metier x ville.
 */

import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;

function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

export type BlogInput = {
  categoryName: string;
  categorySlug: string;
  cityName?: string;
  citySlug?: string;
  topicType: "guide" | "comparaison" | "prix" | "reglementation" | "checklist";
  titleSuggestion?: string;
};

export type BlogOutput = {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  tags: string[];
};

const TOPIC_PROMPTS: Record<string, string> = {
  guide:
    "Redige un guide pratique pour un particulier qui a besoin de ce service.",
  comparaison:
    "Redige un article comparant les differentes options et solutions pour ce type de service.",
  prix:
    "Redige un article detaille sur les prix et tarifs de ce service, avec fourchettes concretes.",
  reglementation:
    "Redige un article sur les aspects reglementaires et legaux a connaitre avant de faire appel a ce service.",
  checklist:
    "Redige une checklist pratique de tout ce qu'il faut verifier avant, pendant et apres ce type de prestation.",
};

export async function generateBlogArticle(
  input: BlogInput
): Promise<BlogOutput> {
  const client = getClient();

  const locationContext = input.cityName
    ? `a ${input.cityName} (Vienne, 86)`
    : "en Vienne (86)";

  const topicInstruction = TOPIC_PROMPTS[input.topicType] || TOPIC_PROMPTS.guide;

  const prompt = `Tu es un redacteur expert pour Workwave, un annuaire de professionnels locaux en France.

Tu rediges en francais correct, avec tous les accents.

${topicInstruction}

**Sujet :** ${input.categoryName} ${locationContext}
${input.titleSuggestion ? `**Titre suggere :** ${input.titleSuggestion}` : ""}

**Format obligatoire :**
- 800-1200 mots
- Un H1 accrocheur et SEO-friendly (commence le texte par "# Titre")
- 3-5 sections H2
- Intro engageante de 2-3 phrases
- Paragraphe de conclusion avec CTA
- Ton expert mais accessible
- Donnees chiffrees concretes (prix, delais)
- Pas d'emojis
- Markdown uniquement (H1, H2, H3, **gras**, listes)
- Ne mentionne pas Workwave dans le corps (seulement en conclusion)
- Annee de reference : 2026`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0].type === "text" ? msg.content[0].text : "";

  // Extraire le H1 comme titre
  const h1Match = content.match(/^# (.+)$/m);
  const title = h1Match?.[1]?.trim() || input.titleSuggestion || `${input.categoryName} ${locationContext}`;

  // Slug depuis le titre
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Generer meta description
  const metaMsg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Genere une meta description SEO de max 155 caracteres pour cet article : "${title}". Reponds uniquement avec la meta description, rien d'autre.`,
      },
    ],
  });

  const metaDescription =
    metaMsg.content[0].type === "text"
      ? metaMsg.content[0].text.trim()
      : `${title}. Guide pratique pour bien choisir et comparer les professionnels.`;

  // Tags
  const tags = [input.categoryName.toLowerCase()];
  if (input.cityName) tags.push(input.cityName.toLowerCase());
  tags.push(input.topicType);
  tags.push("vienne");

  return {
    title,
    slug,
    metaDescription,
    content: content.replace(/^# .+\n\n?/, ""), // Retirer le H1 (gere par la page)
    tags,
  };
}
