import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Limite de débit de l'ingestion des emails entrants.
 *
 * POURQUOI : `contact@workwave.fr` est une adresse PUBLIQUE. N'importe qui peut
 * y déverser des milliers de mails, depuis autant d'adresses d'expéditeur qu'il
 * veut — aucune authentification n'est possible sur du courrier entrant. Sans
 * plafond, chaque mail déclenche : un appel Resend receiving.get, deux SELECT
 * de contexte, deux INSERT, un appel Haiku de tri, et un envoi vers la boîte
 * admin. Les dégâts d'un flot ne sont pas théoriques :
 *   - la boîte Gmail admin devient inutilisable (le support est noyé) ;
 *   - le quota d'envoi Resend est consommé, donc les emails VITAUX ne partent
 *     plus : codes de vérification de réclamation, notifications de projet aux
 *     artisans, réponses du support ;
 *   - la facture Anthropic monte pour trier du bruit.
 *
 * Deux plafonds, car ils protègent de deux choses différentes :
 *   - PAR EXPÉDITEUR : une adresse qui s'acharne (boucle d'auto-répondeur,
 *     client énervé, script) ;
 *   - GLOBAL : l'attaque réelle, des milliers d'adresses DIFFÉRENTES, contre
 *     laquelle un plafond par expéditeur ne peut rien.
 *
 * Les deux requêtes utilisent des index existants (idx_support_tickets_email,
 * idx_support_tickets_created) : aucune migration nécessaire.
 *
 * En cas de dépassement, l'appelant doit répondre 200 (et non 5xx) : un 5xx
 * ferait rejouer l'événement par svix indéfiniment, ce qui amplifierait
 * l'attaque au lieu de l'absorber.
 */

const PER_SENDER_MAX = 15; // nouveaux tickets d'une même adresse
const PER_SENDER_WINDOW_MIN = 15;
const GLOBAL_MAX = 300; // nouveaux tickets, toutes adresses confondues
const GLOBAL_WINDOW_MIN = 60;

export type RateLimitVerdict = {
  allowed: boolean;
  reason: "ok" | "per_sender" | "global";
  detail: string;
};

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function checkInboundRateLimit(
  senderEmail: string | null
): Promise<RateLimitVerdict> {
  try {
    const sb = getServiceClient();
    const now = Date.now();
    const senderSince = new Date(now - PER_SENDER_WINDOW_MIN * 60_000).toISOString();
    const globalSince = new Date(now - GLOBAL_WINDOW_MIN * 60_000).toISOString();

    // Les deux comptages sont indépendants : on les lance en parallèle.
    // count "exact" est ici légitime : la fenêtre est courte, donc le nombre de
    // lignes scannées reste petit (contrairement à un COUNT sur toute la table).
    const [sender, global] = await Promise.all([
      senderEmail
        ? sb
            .from("support_tickets")
            .select("*", { count: "exact", head: true })
            .eq("requester_email", senderEmail)
            .gte("created_at", senderSince)
        : Promise.resolve({ count: 0 }),
      sb
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .gte("created_at", globalSince),
    ]);

    const senderCount = sender.count ?? 0;
    const globalCount = global.count ?? 0;

    if (senderEmail && senderCount >= PER_SENDER_MAX) {
      return {
        allowed: false,
        reason: "per_sender",
        detail: `${senderCount} tickets de ${senderEmail} en ${PER_SENDER_WINDOW_MIN} min`,
      };
    }
    if (globalCount >= GLOBAL_MAX) {
      return {
        allowed: false,
        reason: "global",
        detail: `${globalCount} tickets créés en ${GLOBAL_WINDOW_MIN} min (toutes adresses)`,
      };
    }
    return { allowed: true, reason: "ok", detail: `${senderCount}/${globalCount}` };
  } catch (e) {
    // Un échec du garde-fou ne doit JAMAIS bloquer un email légitime : en cas
    // de doute on laisse passer (fail-open). Le risque d'un flot non filtré est
    // très inférieur à celui de perdre en silence les demandes des clients.
    console.error("[support] rate-limit indisponible, on laisse passer:", e);
    return { allowed: true, reason: "ok", detail: "check_failed" };
  }
}
