/**
 * Tri automatique d'un ticket de support (catégorie + urgence + flag légal).
 *
 * Tourne UNE fois, à la création du ticket, en best-effort : un échec ne bloque
 * jamais l'ingestion (le ticket existe déjà quand on appelle ceci).
 * Modèle Haiku : classification simple, rapide et quasi gratuite (~0,0005 $/ticket).
 * Le corps est tronqué pour borner le coût même sur un mail très long.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && key.length > 0) return key;
  // Fallback dev : l'injection d'env de Claude Code peut vider la variable.
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  } catch {
    /* ignore */
  }
  throw new Error("ANTHROPIC_API_KEY introuvable");
}

export const TICKET_CATEGORIES = [
  "rgpd",
  "unlock",
  "claim",
  "facturation",
  "projet",
  "autre",
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export type TicketTriage = {
  category: TicketCategory;
  priority: "normal" | "urgent";
  isLegal: boolean;
};

const MAX_BODY_CHARS = 2000;

export async function triageTicket(input: {
  subject: string | null;
  body: string;
}): Promise<TicketTriage | null> {
  try {
    const body = (input.body || "").slice(0, MAX_BODY_CHARS);
    const client = new Anthropic({ apiKey: getApiKey() });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Tu tries les messages reçus par le support de Workwave (plateforme de mise en relation entre particuliers et artisans, France + Belgique francophone ; le particulier dépose un projet gratuitement, le professionnel paie 9,90 € pour débloquer les coordonnées d'un lead).

Message reçu :
Objet : ${input.subject || "(sans objet)"}
Corps : "${body}"

Classe-le et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks, sans explication) :

{
  "category": une valeur parmi "rgpd" | "unlock" | "claim" | "facturation" | "projet" | "autre",
  "priority": "urgent" ou "normal",
  "is_legal": true ou false
}

Définitions :
- "rgpd" : demande de suppression de fiche, d'accès ou d'opposition sur ses données personnelles, "je ne veux pas figurer", "ce n'est pas mon entreprise".
- "unlock" : problème de déblocage de lead (paiement passé mais coordonnées non reçues, lead injoignable, demande d'avoir/remplacement).
- "claim" : réclamation/revendication de fiche professionnelle, code de vérification à 6 chiffres non reçu, connexion au compte pro.
- "facturation" : facture, reçu, TVA, moyen de paiement, remboursement.
- "projet" : question d'un particulier sur son projet déposé, modification ou suppression de sa demande.
- "autre" : tout le reste (partenariat, presse, spam, question générale).

- "priority" = "urgent" UNIQUEMENT si : la personne est bloquée sur quelque chose qu'elle a payé, exprime une colère nette, menace de partir/de se plaindre publiquement, ou signale un dysfonctionnement qui touche plusieurs utilisateurs. Sinon "normal".
- "is_legal" = true UNIQUEMENT si le message évoque explicitement une démarche juridique ou une autorité : CNIL, avocat, mise en demeure, plainte, tribunal, huissier, action en justice. Une simple demande RGPD polie n'est PAS "is_legal".`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      category?: string;
      priority?: string;
      is_legal?: boolean;
    };

    const category = (TICKET_CATEGORIES as readonly string[]).includes(parsed.category || "")
      ? (parsed.category as TicketCategory)
      : "autre";
    const priority = parsed.priority === "urgent" ? "urgent" : "normal";

    return { category, priority, isLegal: parsed.is_legal === true };
  } catch (error) {
    console.error("[support] tri IA échec :", error);
    return null;
  }
}
