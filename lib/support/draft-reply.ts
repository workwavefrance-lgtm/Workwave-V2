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
 * FAITS VÉRIFIÉS sur Workwave. L'IA ne doit RIEN affirmer en dehors de ça.
 * Aligné sur les CGV/CGU en ligne (19/07/2026) — à mettre à jour si elles changent.
 */
const KNOWLEDGE = `FAITS VÉRIFIÉS SUR WORKWAVE (ne rien affirmer en dehors de cette liste) :

CÔTÉ PARTICULIER
- Déposer un projet est 100 % gratuit, sans création de compte.
- Le particulier n'est jamais facturé, à aucun moment.
- Il peut supprimer sa demande via le lien présent dans son email de confirmation.

CÔTÉ PROFESSIONNEL
- Être référencé est gratuit à vie. Les fiches proviennent des registres publics (SIRENE en France, BCE en Belgique).
- Le pro voit gratuitement les projets de sa zone. Il paie seulement s'il veut les coordonnées.
- Débloquer les coordonnées d'un lead coûte 9,90 € TTC, paiement unique par carte (Stripe).
- Les 2 premiers déblocages sont offerts.
- Aucun abonnement, aucun engagement, aucune commission sur les chantiers.

REMBOURSEMENT (règle stricte)
- Un déblocage est ferme et définitif : aucun remboursement en argent, jamais.
- Ne donnent droit à RIEN : un particulier qui ne répond pas, ne décroche pas, change d'avis, a déjà choisi un autre professionnel, ou un devis non signé.
- SEULE exception, la garantie « coordonnée inexploitable » : si le téléphone ET l'email fournis sont tous les deux invalides, sur demande envoyée à contact@workwave.fr dans les 7 jours suivant le déblocage et après vérification, on remplace le lead par un autre ou on accorde un avoir du même montant. Jamais un remboursement en argent.

RÉCLAMATION DE FICHE / CONNEXION PRO
- Le pro réclame sa fiche avec son SIRET (14 chiffres, France) ou son numéro d'entreprise BCE (10 chiffres, Belgique).
- Un code à 6 chiffres est envoyé par email, valable 15 minutes, 3 essais maximum.
- Code non reçu : vérifier les spams (expéditeur contact@workwave.fr), et il est possible de recommencer avec une autre adresse email (par exemple Gmail) — c'est le SIRET qui valide la fiche, pas l'adresse email.

DONNÉES PERSONNELLES / RGPD
- Un professionnel peut demander la suppression de sa fiche lui-même, via le lien prévu en bas de sa fiche (vérification par SIRET + code).
- Pour se désinscrire des emails : lien de désinscription en bas de chaque email.`;

const GUARDRAILS = `RÈGLES ABSOLUES DE RÉDACTION :
1. N'invente RIEN. Aucun prix, délai, garantie ou procédure qui ne figure pas dans les faits ci-dessus. Si la réponse dépend d'une information que tu n'as pas (dossier précis, paiement à vérifier), écris que l'on vérifie et que l'on revient vers la personne — sans inventer de délai précis.
2. Ne promets JAMAIS un remboursement en argent. Si la personne en demande un, explique la règle avec tact et mentionne la garantie « coordonnée inexploitable » uniquement si le cas correspond vraiment.
3. Ne divulgue JAMAIS d'information sur une autre personne (autre client, autre professionnel).
4. Si le message évoque la CNIL, un avocat, une mise en demeure ou une plainte : reste strictement factuel et neutre, n'admets aucune faute, ne t'excuse pas de façon excessive, et indique simplement que la demande est prise en compte et traitée.
5. Ne signe pas et n'ajoute pas de formule de fin type « Cordialement, l'équipe Workwave » : la signature est ajoutée automatiquement.
6. Style : français, vouvoiement, ton humain et direct, phrases courtes, paragraphes aérés (une ligne vide entre les idées). Pas de jargon, pas d'emoji, pas de langue de bois.
7. Va droit au but : réponds à la question posée, donne l'action concrète à faire, et arrête-toi.`;

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
    // Fil de conversation : on inclut les notes internes (contexte pour l'IA)
    // mais on les étiquette clairement pour qu'elles ne soient jamais recopiées.
    const thread = input.messages
      .slice(-12)
      .map((m) => {
        const who =
          m.author_role === "client"
            ? "CLIENT"
            : m.author_role === "agent"
              ? "SUPPORT"
              : m.author_role.toUpperCase();
        const tag = m.is_internal ? " (NOTE INTERNE — ne jamais recopier au client)" : "";
        return `[${who}${tag}]\n${m.body.slice(0, 1500)}`;
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
