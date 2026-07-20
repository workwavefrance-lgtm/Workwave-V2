/**
 * Journal des conversations de Léa.
 *
 * Léa parle au nom de Workwave sans relecture humaine. Avant ce module, ses
 * échanges ne laissaient aucune trace : seuls ceux finissant en ticket étaient
 * visibles. Un dérapage sur une conversation non escaladée serait passé
 * totalement inaperçu.
 *
 * PRINCIPE : on n'enregistre pas tout. 95 % des échanges sont des « bonjour je
 * cherche un plombier » sans intérêt, et les stocker reviendrait à accumuler
 * des données personnelles de particuliers sans raison valable. On garde ce qui
 * mérite un œil humain, plus un petit échantillon aléatoire — parce que
 * surveiller uniquement les incidents ne dit rien du fonctionnement normal.
 *
 * DÉTECTION PAR MOTIFS, PAS PAR IA : c'est instantané, gratuit, et surtout
 * auditable — on peut lire la liste et savoir exactement ce qui déclenche. Un
 * classifieur IA coûterait un appel par message, ajouterait de la latence à
 * chaque réponse, et serait lui-même imprévisible.
 */
import { createClient } from "@supabase/supabase-js";

export type LeaFlag =
  | "juridique"
  | "remboursement"
  | "colere"
  | "donnees"
  | "refus"
  | "escalade"
  | "echantillon";

/**
 * Part des conversations ordinaires conservées au hasard.
 *
 * Sans cet échantillon, on ne verrait QUE les incidents : impossible de dire si
 * Léa se comporte bien le reste du temps, ni de repérer une dérive lente (un
 * ton qui change, une erreur factuelle récurrente sur une question banale).
 */
const TAUX_ECHANTILLON = 0.03;

/** Ce que le VISITEUR écrit et qui justifie un contrôle. */
const MOTIFS_VISITEUR: { flag: LeaFlag; re: RegExp }[] = [
  {
    flag: "juridique",
    re: /\b(cnil|avocat|mise en demeure|huissier|tribunal|proc[èe]s|porter plainte|je porte plainte|poursuite[s]? judiciaire|assignation|contentieux|m[ée]diateur)\b/i,
  },
  {
    flag: "remboursement",
    re: /\b(rembours\w*|arnaque|arnaquer|escroquer|escroquerie|voleur[s]?|c'est du vol|remboursez)\b/i,
  },
  {
    flag: "colere",
    // Les variantes comptent plus que l'exhaustivité du vocabulaire : les gens
    // écrivent au pluriel et sans accent. Un `\b` en fin de motif rate
    // « connards », d'où les `\w*` systématiques sur les formes fléchies.
    re: /\b(scandale|scandaleux|inadmissible|honteux|honte|foutage de gueule|je vais vous (attaquer|d[ée]truire|pourrir)|d[ée]noncer|presse|avis google|proc[èe]s verbal)\b|\b(conn(ard|asse)\w*|encul\w*|salop\w*|merde\w*|putain|escroc\w*|charlatan\w*|incomp[ée]tent\w*)\b/i,
  },
  {
    flag: "donnees",
    // Demande de coordonnées d'un tiers ou du dirigeant : le scénario type de
    // la fuite de données personnelles.
    re: /\b(num[ée]ro|t[ée]l[ée]phone|portable|adresse|mail|email|coordonn[ée]es|nom complet)\b[\s\S]{0,40}\b(dirigeant|patron|g[ée]rant|fondateur|responsable|propri[ée]taire|artisan|pro|client)\b/i,
  },
];

/** Ce que LÉA répond et qui mérite d'être relu (elle a buté sur quelque chose). */
const MOTIFS_LEA: { flag: LeaFlag; re: RegExp }[] = [
  {
    flag: "refus",
    re: /\b(je ne peux pas|je ne suis pas en mesure|je n'ai pas acc[èe]s|ce n'est pas mon domaine|je ne peux ni|je ne suis pas autoris)\b/i,
  },
];

/**
 * Détermine si une conversation doit être conservée, et pourquoi.
 * Fonction pure : testable sans base ni réseau.
 */
export function detecterFlags(input: {
  messagesVisiteur: string[];
  reponseLea: string;
  escalade?: boolean;
  /** Injectable pour rendre les tests déterministes. */
  tirage?: number;
}): LeaFlag[] {
  const flags = new Set<LeaFlag>();
  const texteVisiteur = input.messagesVisiteur.join("\n");

  for (const m of MOTIFS_VISITEUR) {
    if (m.re.test(texteVisiteur)) flags.add(m.flag);
  }
  for (const m of MOTIFS_LEA) {
    if (m.re.test(input.reponseLea)) flags.add(m.flag);
  }
  if (input.escalade) flags.add("escalade");

  // Échantillon : uniquement si rien d'autre n'a été relevé, pour ne pas
  // diluer les vrais signaux dans le bruit.
  if (flags.size === 0) {
    const t = input.tirage ?? Math.random();
    if (t < TAUX_ECHANTILLON) flags.add("echantillon");
  }

  return [...flags];
}

const MAX_TRANSCRIPT = 12_000;

/**
 * Enregistre (ou met à jour) une conversation surveillée.
 *
 * Ne lève JAMAIS et ne bloque jamais la réponse au visiteur : un journal
 * indisponible ne doit pas casser le chat. En contrepartie l'échec est loggué,
 * jamais avalé en silence.
 */
export async function journaliserConversation(input: {
  conversationId: string;
  messages: { role: string; content: string }[];
  reponseLea: string;
  pathname?: string | null;
  ticketId?: number | null;
  escalade?: boolean;
}): Promise<void> {
  try {
    const messagesVisiteur = input.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    const flags = detecterFlags({
      messagesVisiteur,
      reponseLea: input.reponseLea,
      escalade: input.escalade,
    });
    if (flags.length === 0) return; // conversation ordinaire : rien à conserver

    // Rôles RÉÉCRITS, jamais recopiés : un visiteur ne doit pas pouvoir
    // fabriquer un faux tour « LÉA : nous vous remboursons » dans le journal
    // qui servira ensuite de preuve.
    const transcript = [
      ...input.messages.map(
        (m) => `${m.role === "user" ? "VISITEUR" : "LÉA"} : ${m.content.slice(0, 1500)}`
      ),
      `LÉA : ${input.reponseLea.slice(0, 1500)}`,
    ]
      .join("\n\n")
      .slice(0, MAX_TRANSCRIPT);

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Une ligne par conversation, mise à jour au fil de l'échange : on garde le
    // fil complet et les motifs cumulés, sans créer une ligne par message.
    const { error } = await sb.from("lea_conversations").upsert(
      {
        conversation_id: input.conversationId,
        flags,
        pathname: input.pathname ?? null,
        transcript,
        message_count: input.messages.length + 1,
        ticket_id: input.ticketId ?? null,
      },
      { onConflict: "conversation_id" }
    );
    if (error) console.error("[lea-journal] écriture échouée :", error.message);
  } catch (e) {
    console.error("[lea-journal] exception :", (e as Error).message);
  }
}
