/**
 * Génère un BROUILLON de réponse support, à relire et valider par l'admin.
 * Rien n'est jamais envoyé automatiquement : le brouillon remplit la zone de
 * texte, l'admin l'édite puis clique "Envoyer au client".
 *
 * Modèle Sonnet : la réponse est destinée à un vrai client, la qualité prime
 * (~0,01 $ par brouillon).
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import {
  WORKWAVE_FACTS,
  CONFIDENTIALITY_RULES,
  NO_INVENTION_RULES,
} from "./knowledge";

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

/**
 * Les faits et les règles de confidentialité viennent du module partagé
 * lib/support/knowledge.ts : Léa (le chat du site) et ce brouillon doivent
 * dire EXACTEMENT la même chose. Ne reste ici que ce qui est propre au canal
 * email traité par un humain (ton, signature, posture face au juridique).
 */
const KNOWLEDGE = WORKWAVE_FACTS;

const GUARDRAILS = `RÈGLES ABSOLUES DE RÉDACTION :

${NO_INVENTION_RULES}

${CONFIDENTIALITY_RULES}

PROPRE À LA RÉPONSE PAR EMAIL :
1. Si le message évoque la CNIL, un avocat, une mise en demeure ou une plainte : reste strictement factuel et neutre, n'admets aucune faute, ne t'excuse pas de façon excessive, et indique simplement que la demande est prise en compte et traitée.
2. Ne signe pas et n'ajoute pas de formule de fin type « Cordialement, l'équipe Workwave » : la signature est ajoutée automatiquement.
3. Style : français, vouvoiement, ton humain et direct, phrases courtes, paragraphes aérés (une ligne vide entre les idées). Pas de jargon, pas d'emoji, pas de langue de bois.
4. Va droit au but : réponds à la question posée, donne l'action concrète à faire, et arrête-toi.`;

export type DraftReplyInput = {
  subject: string | null;
  requesterName: string | null;
  category: string | null;
  messages: { author_role: string; body: string; is_internal: boolean }[];
  pro?: {
    name: string;
    category: string | null;
    city: string | null;
    subscription_status: string | null;
  } | null;
  unlocks?: number;
  projectsCount?: number;
};

export async function generateDraftReply(
  input: DraftReplyInput
): Promise<string | null> {
  try {
    // Fil de conversation : les NOTES INTERNES sont EXCLUES, pas étiquetées.
    //
    // POURQUOI : une note interne peut contenir tout ce qu'un admin écrit hors
    // du regard du client (« ce pro ment sur son RGE », le téléphone d'un
    // particulier, une consigne juridique). La version précédente les envoyait
    // au modèle avec la mention « ne jamais recopier au client » — c'est une
    // consigne en français, pas un filtre : le corps d'un email entrant est du
    // texte hostile potentiel, et une injection bien tournée peut retourner une
    // consigne. Ce qu'on ne transmet pas ne peut pas fuiter.
    //
    // Le rôle de l'auteur est réécrit en libellé neutre plutôt que d'être
    // interpolé brut : un client ne peut pas fabriquer un faux tour « SUPPORT »
    // dans le fil pour influencer le brouillon.
    const ROLE_LABEL: Record<string, string> = {
      client: "CLIENT",
      pro: "CLIENT",
      agent: "SUPPORT",
      ai: "SUPPORT",
      system: "SYSTEME",
    };
    const thread = input.messages
      .filter((m) => !m.is_internal)
      .slice(-12)
      .map((m) => {
        const who = ROLE_LABEL[m.author_role] ?? "CLIENT";
        return `[${who}]\n${m.body.slice(0, 1500)}`;
      })
      .join("\n\n---\n\n");

    const contextLines: string[] = [];
    if (input.requesterName) contextLines.push(`Nom du demandeur : ${input.requesterName}`);
    if (input.category) contextLines.push(`Catégorie détectée : ${input.category}`);
    if (input.pro) {
      contextLines.push(
        `Il s'agit d'un PROFESSIONNEL inscrit : ${input.pro.name}${
          input.pro.category ? ` (${input.pro.category}` : ""
        }${input.pro.city ? `, ${input.pro.city})` : input.pro.category ? ")" : ""}.`
      );
      if (typeof input.unlocks === "number") {
        contextLines.push(`Leads déjà débloqués par ce pro : ${input.unlocks}.`);
      }
    } else if (input.projectsCount) {
      contextLines.push(
        `Il s'agit probablement d'un PARTICULIER ayant déposé ${input.projectsCount} projet(s).`
      );
    }

    const client = new Anthropic({ apiKey: getApiKey() });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Tu rédiges un BROUILLON de réponse pour le support de Workwave. Ce brouillon sera relu et corrigé par un humain avant envoi.

${KNOWLEDGE}

${GUARDRAILS}

CONTEXTE DU TICKET
Objet : ${input.subject || "(sans objet)"}
${contextLines.join("\n")}

FIL DE LA CONVERSATION (du plus ancien au plus récent) :
${thread}

Rédige maintenant UNIQUEMENT le corps du message de réponse au dernier message du client. Pas d'objet, pas de signature, pas de commentaire de ta part — juste le texte de la réponse.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const draft = text.trim();
    return draft.length > 0 ? draft : null;
  } catch (error) {
    console.error("[support] brouillon IA échec :", error);
    return null;
  }
}
