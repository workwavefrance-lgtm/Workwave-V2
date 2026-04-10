import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import type { AiQualification } from "@/lib/types/database";

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && key.length > 0) return key;
  // Fallback : lire directement depuis .env.local si l'env var est vide
  // (contournement du conflit avec l'injection d'env de Claude Code)
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  } catch { /* ignore */ }
  throw new Error("ANTHROPIC_API_KEY introuvable");
}

function getClient() {
  return new Anthropic({ apiKey: getApiKey() });
}

type QualifyInput = {
  categoryName: string;
  categorySlug: string;
  cityName: string;
  description: string;
  urgency: string;
  budget: string;
};

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas pressé",
};

const BUDGET_LABELS: Record<string, string> = {
  lt500: "Moins de 500 €",
  "500_2000": "500 € - 2 000 €",
  "2000_5000": "2 000 € - 5 000 €",
  "5000_15000": "5 000 € - 15 000 €",
  gt15000: "Plus de 15 000 €",
  unknown: "Je ne sais pas",
};

export async function qualifyProject(
  input: QualifyInput
): Promise<AiQualification | null> {
  try {
    const message = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant de qualification de projets pour Workwave, un annuaire de professionnels locaux en France.

Un particulier vient de déposer un projet. Analyse-le et retourne un JSON structuré.

**Projet déposé :**
- Catégorie choisie par le client : ${input.categoryName} (${input.categorySlug})
- Ville : ${input.cityName}
- Description : "${input.description}"
- Urgence déclarée : ${URGENCY_LABELS[input.urgency] || input.urgency}
- Budget estimé : ${BUDGET_LABELS[input.budget] || input.budget}

**Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks, sans explication) avec ces champs :**

{
  "suggested_category": "le slug de la catégorie la plus pertinente selon la description",
  "category_match": true ou false (la catégorie choisie correspond-elle au besoin décrit ?),
  "urgency_assessment": "une phrase expliquant si l'urgence déclarée semble cohérente avec la description",
  "real_urgency": "today" ou "this_week" ou "this_month" ou "not_urgent" (l'urgence réelle selon ton analyse),
  "budget_realistic": true ou false (le budget est-il réaliste pour ce type de prestation ?),
  "budget_comment": "une phrase sur la cohérence du budget",
  "keywords": ["mot1", "mot2", "mot3"] (3 à 5 mots-clés extraits de la description),
  "summary": "résumé du besoin en une phrase claire",
  "suspicion_score": un entier de 0 à 100 évaluant le risque de spam ou de fausse demande. Score élevé (>70) si : description incohérente ou sans rapport avec des travaux, caractères aléatoires, copier-coller évident d'un autre site, langue étrangère sans contexte, contenu publicitaire ou malveillant. Score bas (<30) pour une demande normale et cohérente.
}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Nettoyer la réponse (au cas où Claude ajoute des backticks)
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned) as AiQualification;
  } catch (error) {
    console.error("Erreur qualification IA :", error);
    return null;
  }
}
