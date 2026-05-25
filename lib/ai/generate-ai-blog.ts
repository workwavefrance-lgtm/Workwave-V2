/**
 * Generation d'articles de blog SEO tech via Claude Sonnet 4-6.
 * Articles de 1000-1500 mots cibles sur des requetes long-tail tech (FR).
 *
 * Diffère de lib/ai/generate-blog.ts (BTP/Vienne) :
 *   - System prompt oriente tech freelance
 *   - Reference Workwave AI (vs Workwave BTP)
 *   - Pas de city_slug obligatoire (sujets souvent nationaux)
 *   - Tags inclus = ['workwave-ai', skill] pour identification
 *
 * NOTE : Ce module est server-only (utilise via scripts/ uniquement).
 * On evite les imports Node ('fs', 'path') au top-level pour ne pas
 * polluer le bundle Next.js. La cle ANTHROPIC_API_KEY est attendue via
 * process.env (settee par dotenv dans le script appelant).
 */
import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;

function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || undefined,
    });
  }
  return _anthropic;
}

export type AiBlogTopicType =
  | "choisir-freelance"
  | "tjm-stack"
  | "top-freelances"
  | "guide-pratique"
  | "comparatif"
  | "glossaire-ia"
  | "ressource-stack";

export type AiBlogInput = {
  topicType: AiBlogTopicType;
  title: string;
  /** Skill/technology principale (React, Python, AWS...) */
  skillName: string;
  /** Slug skill pour URL */
  skillSlug: string;
  /** Description du sujet pour aider Claude a calibrer */
  contextHint?: string;
  /** Si "Top X freelances à Y", la ville cible */
  cityName?: string;
};

export type AiBlogOutput = {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  tags: string[];
};

const TOPIC_INSTRUCTIONS: Record<AiBlogTopicType, string> = {
  "choisir-freelance":
    "Redige un guide pour aider un porteur de projet (CTO, fondateur, lead) a choisir le bon freelance sur cette technologie : criteres techniques, signaux de qualite, questions a poser en entretien, red flags, fourchettes de TJM, duree typique de mission.",
  "tjm-stack":
    "Redige un article sur le TJM moyen d'un freelance sur cette stack en 2026 : fourchettes par niveau (junior 0-3 ans, intermediaire 3-7, senior 7-10, expert 10+), facteurs d'evolution (Paris vs province, remote, stack precise), comparaison avec marche du salariat, conseils pour negocier.",
  "top-freelances":
    "Redige un article guide qui presente comment trouver les meilleurs freelances de cette technologie. PAS DE LISTE NOMINATIVE (RGPD + faits) — focus sur les criteres de selection, ou les chercher, comment evaluer un portfolio, exemples de profils types.",
  "guide-pratique":
    "Redige un tutoriel pratique de niveau intermediaire : approche, etapes principales, pieges classiques, outils recommandes, ressources pour aller plus loin. Format actionnable.",
  comparatif:
    "Redige un comparatif objectif entre les options listees : ce qu'ils ont en commun, ce qui les differencie, cas d'usage typiques pour chaque, prix/cout, courbe d'apprentissage, ecosystem.",
  "glossaire-ia":
    "Redige une explication claire et accessible de ce concept IA/LLM : definition simple, analogie concrete, exemple concret d'usage, pieges courants de comprehension, ressources complementaires.",
  "ressource-stack":
    "Redige un guide de choix de stack/outils pour cet usage en 2026 : recommandations argumentees, alternatives, criteres de selection, exemples d'entreprises qui utilisent.",
};

export async function generateAiBlogArticle(
  input: AiBlogInput
): Promise<AiBlogOutput> {
  const client = getClient();
  const topicInstruction = TOPIC_INSTRUCTIONS[input.topicType];

  const prompt = `Tu es un redacteur senior pour Workwave AI (workwave.fr/ai), une plateforme francaise qui connecte les porteurs de projet aux freelances tech (IA, dev, cloud, data, no-code, design) avec selection automatique par IA en moins de 24h.

Tu rediges en francais correct, avec TOUS les accents (e, e, a, c, etc.).

CONTEXTE DE L'ARTICLE :
 - Titre suggere : "${input.title}"
 - Technologie / sujet : ${input.skillName}
${input.cityName ? ` - Ville cible : ${input.cityName}` : ""}
${input.contextHint ? ` - Contexte additionnel : ${input.contextHint}` : ""}

INSTRUCTION POUR CET ARTICLE :
${topicInstruction}

CONTRAINTES DE QUALITE OBLIGATOIRES :
 1. Article entre 1000 et 1500 mots, structure H2/H3 markdown.
 2. Aucune information inventee : si tu n'es pas sur d'un chiffre, donne une fourchette explicite ("entre X et Y selon les sources").
 3. Mentionner les vrais frameworks/outils (React, Next.js, AWS, OpenAI, etc.) sans introduire de marques fictives.
 4. Inclure 1 ou 2 references discretes a Workwave AI dans le contenu (ex. "vous pouvez aussi consulter notre barometre TJM sur workwave.fr/ai/barometre-tjm" ou "Workwave AI selectionne les 3 freelances qui matchent votre projet en 24h"), MAIS l'article reste informatif et neutre, pas commercial.
 5. Conclusion courte (3-5 lignes), avec un CTA leger : "Si vous portez un projet ${input.skillName}, deposez-le sur workwave.fr/ai/deposer".
 6. Pas d'emojis. Pas de "🚀". Pas de placeholders type [INSERT VALUE].
 7. Markdown only : pas de HTML brut.

FORMAT DE REPONSE (STRICT JSON) :
\`\`\`json
{
  "title": "Titre final SEO optimise (60-70 caracteres, sans 'En 2026' redondant)",
  "metaDescription": "Meta description engageante (140-160 caracteres, accroche + benefice clair)",
  "content": "Article markdown complet, 1000-1500 mots, debut par un paragraphe d'intro engageant",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
\`\`\`

Reponds UNIQUEMENT avec le JSON entre les balises \`\`\`json et \`\`\`, rien d'autre.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) {
    throw new Error("Reponse Claude sans bloc JSON valide");
  }

  let parsed: { title: string; metaDescription: string; content: string; tags: string[] };
  try {
    parsed = JSON.parse(jsonMatch[1]);
  } catch (e) {
    throw new Error("JSON Claude invalide: " + String(e));
  }

  // Generer le slug a partir du title (kebab-case sans accents)
  const slug = parsed.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacriticals (NFD accents)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const tags = Array.from(
    new Set([...(parsed.tags || []), "workwave-ai", input.skillSlug])
  );

  return {
    title: parsed.title,
    slug,
    metaDescription: parsed.metaDescription,
    content: parsed.content,
    tags,
  };
}
