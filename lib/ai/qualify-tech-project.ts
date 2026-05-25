/**
 * Qualifie un projet tech depose sur /ai/deposer via Claude.
 *
 * Retourne :
 *   - category_slug : la categorie tech detectee (developpement-web,
 *     intelligence-artificielle, cloud-devops, no-code-automation,
 *     data-analytics, design-produit)
 *   - confidence : 0-100, confiance du modele
 *   - suspicion_score : 0-100, risque spam / hors-sujet
 *   - summary : resume du besoin en 1 phrase
 *   - keywords : 3-5 mots-cles extraits
 *
 * En cas d'echec Claude, retourne null. L'appelant doit fallback sur
 * la categorie selectionnee par le user dans le form.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && key.length > 0) return key;
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  } catch {
    /* ignore */
  }
  throw new Error("ANTHROPIC_API_KEY introuvable");
}

function getClient() {
  return new Anthropic({ apiKey: getApiKey() });
}

export type TechQualification = {
  category_slug: string;
  confidence: number;
  suspicion_score: number;
  summary: string;
  keywords: string[];
  budget_realistic: boolean;
  budget_comment: string;
};

type QualifyInput = {
  selectedCategorySlug: string;
  selectedCategoryName: string;
  title: string;
  description: string;
  stack: string | null;
  budget: string;
  timeline: string;
};

const BUDGET_LABELS: Record<string, string> = {
  lt5k: "Moins de 5 000 €",
  "5k-15k": "5 000 € - 15 000 €",
  "15k-50k": "15 000 € - 50 000 €",
  gt50k: "Plus de 50 000 €",
  tbd: "A definir",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "Immediat (sous 1 semaine)",
  "1month": "Sous 1 mois",
  "3months": "Dans 1 a 3 mois",
  flexible: "Flexible",
};

export async function qualifyTechProject(
  input: QualifyInput
): Promise<TechQualification | null> {
  try {
    const message = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant de qualification de projets tech pour Workwave AI, plateforme de mise en relation entre porteurs de projet et freelances tech en France et Europe.

Un porteur de projet vient de soumettre un brief. Analyse-le et retourne un JSON structure.

**Brief depose :**
- Categorie choisie par le client : ${input.selectedCategoryName} (${input.selectedCategorySlug})
- Titre : "${input.title}"
- Description : "${input.description}"
- Stack technique demandee : ${input.stack || "(non specifiee)"}
- Budget : ${BUDGET_LABELS[input.budget] || input.budget}
- Calendrier : ${TIMELINE_LABELS[input.timeline] || input.timeline}

**Categories tech disponibles :**
- developpement-web : React, Next.js, Vue, mobile, e-commerce, full-stack, backend, frontend
- intelligence-artificielle : LLM, RAG, agents IA, fine-tuning, computer vision, integration ChatGPT/Claude
- cloud-devops : AWS, GCP, Azure, Kubernetes, Docker, CI/CD, terraform, infrastructure
- no-code-automation : Bubble, Make, Zapier, Airtable, Webflow, n8n
- data-analytics : Business Intelligence, ETL, ML engineering, data science, dashboards
- design-produit : UX/UI, prototypage, design system, Figma, recherche utilisateur

**Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks, sans explication) avec ces champs :**

{
  "category_slug": "le slug de la categorie tech la plus pertinente selon la description (parmi les 6 ci-dessus)",
  "confidence": un entier de 0 a 100, confiance du modele dans le matching de categorie,
  "suspicion_score": un entier de 0 a 100 evaluant le risque de spam ou faux brief. Score eleve (>70) si : description incoherente, caracteres aleatoires, copier-coller evident, langue etrangere sans contexte, contenu publicitaire ou malveillant. Score bas (<30) pour brief normal et coherent.,
  "summary": "resume du besoin en une phrase claire et factuelle",
  "keywords": ["mot1", "mot2", "mot3"] (3 a 5 mots-cles techniques extraits, ex: ["react", "stripe", "saas"]),
  "budget_realistic": true ou false (le budget annonce est-il realiste pour ce type de projet tech ?),
  "budget_comment": "une phrase sur la coherence du budget vs scope du projet"
}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned) as TechQualification;
  } catch (error) {
    console.error("[qualifyTechProject] Erreur Claude :", error);
    return null;
  }
}
