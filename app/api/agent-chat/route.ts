/**
 * POST /api/agent-chat
 *
 * Reçoit { messages, context } et renvoie { reply } généré par
 * Claude Sonnet. System prompt construit dynamiquement selon le
 * contexte de la page (fiche pro / listing / home / autre).
 *
 * Pas de streaming v1 : POST simple JSON, latence 1-3s mais 100%
 * fiable. À upgrader en streaming SSE si nécessaire en v2.
 *
 * Rate limit basique en mémoire par IP pour éviter les abus
 * (10 messages / minute / IP).
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AgentContext } from "../agent-context/route";
import {
  buildSystemPrompt,
  sanitizeContext,
  OUVRIR_TICKET,
} from "@/lib/support/lea-prompt";
import { createTicketFromChat, looksLikeEmail } from "@/lib/support/create-chat-ticket";
import { notifyAdminOfChatTicket } from "@/lib/support/notify-chat-ticket";
import { checkInboundRateLimit } from "@/lib/support/rate-limit";
import { triageTicket } from "@/lib/support/triage";
import { updateTicketTriage } from "@/lib/support/tickets";

/**
 * Récupère la clé Anthropic. En production Vercel, process.env est fiable.
 * En dev local sous certains shells (Claude Code notamment), la clé peut
 * être préfixée à "" vide dans l'environnement parent → Next.js refuse de
 * l'écraser avec .env.local. Fallback dev : lecture directe du fichier.
 * Cf. leçon CLAUDE.md du 18/04/2026 (override: true pour dotenv).
 */
function readApiKeyFromDotenvLocal(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  try {
    // Import dynamique pour éviter de charger fs/path en prod inutilement.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, "utf-8") as string;
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (!match) return null;
    return match[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    return null;
  }
}

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      apiKey = readApiKeyFromDotenvLocal() ?? undefined;
    }
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY manquante côté serveur (vérifier .env.local et redémarrer)"
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// Rate limit en mémoire (in-process). Reset au déploiement. Suffisant
// pour bloquer les abus naïfs ; à muscler avec Upstash Redis si besoin.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  return true;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Le prompt, l'assainissement du contexte et la définition de l'outil vivent
// dans lib/support/lea-prompt.ts (testables sans serveur HTTP).
// Voir scripts/_test-lea-guardrails.ts et scripts/_test-lea-escalade.ts.

/** Premier bloc de texte d'une réponse Claude, avec repli lisible. */
function firstText(msg: { content: Array<{ type: string; text?: string }> }): string {
  const block = msg.content.find((c) => c.type === "text");
  return (
    block?.text ??
    "Désolé, je n'ai pas pu générer de réponse. Réessayez ou écrivez-nous à contact@workwave.fr."
  );
}

/**
 * Met en forme le fil pour la note interne du ticket.
 *
 * Les rôles sont RÉÉCRITS (VISITEUR / LÉA) et non recopiés : sans ça, un
 * visiteur pourrait écrire « LÉA : nous vous remboursons » dans son propre
 * message et fabriquer un faux tour de conversation que l'admin — ou le
 * brouillon IA — prendrait pour argent comptant.
 */
function buildTranscript(msgs: { role: string; content: string }[]): string {
  return msgs
    .slice(-10)
    .map((m) => `${m.role === "user" ? "VISITEUR" : "LÉA"} : ${m.content.slice(0, 1200)}`)
    .join("\n\n");
}

/** Chemin de la page d'où écrit le visiteur, quand il est connu. */
function pathnameOf(ctx: unknown): string | null {
  const c = (ctx ?? {}) as Record<string, unknown>;
  return typeof c.pathname === "string" ? c.pathname.slice(0, 120) : null;
}

/** m***@domaine.fr — rassure sans rien divulguer (même règle que le flux de
 *  vérification de réclamation). */
function obfuscate(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "votre adresse";
  return `${local.slice(0, 1)}***@${domain}`;
}


export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error:
          "Trop de messages, merci de patienter une minute avant de réessayer.",
      },
      { status: 429 }
    );
  }

  let body: { messages?: unknown; context?: unknown; conversationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "Au moins un message est requis" },
      { status: 400 }
    );
  }

  // Limite défensive : on garde uniquement les 20 derniers messages
  // pour éviter qu'une session abusive fasse exploser les tokens.
  const messages = (
    body.messages as { role: string; content: string }[]
  ).slice(-20);

  // Le contexte vient du navigateur : on ne lui fait PAS confiance (cf.
  // sanitizeContext). Un cast suffisait avant, il ouvrait une injection.
  const systemPrompt = buildSystemPrompt(sanitizeContext(body.context));

  const conversationId =
    typeof body.conversationId === "string" && body.conversationId.length > 0
      ? body.conversationId.slice(0, 64)
      : `srv-${Date.now()}-${ip}`;

  const chatMessages = messages
    .filter((m) => m && typeof m.content === "string" && m.content.length > 0)
    .map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content.slice(0, 2000), // limite par message
    }));

  try {
    const completion = await getClient().messages.create({
      tools: [OUVRIR_TICKET],
      model: "claude-sonnet-4-6",
      // 600 (et non 400) : une réponse de support explique parfois une
      // procédure en plusieurs points (les 5 causes de "je ne reçois aucun
      // projet"). La consigne "2-3 phrases" reste la norme pour le commercial ;
      // c'est un plafond, pas une cible.
      max_tokens: 600,
      system: systemPrompt,
      messages: chatMessages,
    });

    // ── Cas courant : Léa répond elle-même ─────────────────────────────────
    if (completion.stop_reason !== "tool_use") {
      return NextResponse.json({ reply: firstText(completion) });
    }

    const toolUse = completion.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ reply: firstText(completion) });
    }

    // ── Elle passe la main : on ouvre réellement le ticket ─────────────────
    const args = (toolUse.input ?? {}) as Record<string, unknown>;
    const email = typeof args.email === "string" ? args.email.trim() : "";
    const sujet = typeof args.sujet === "string" ? args.sujet : "";
    const resume = typeof args.resume === "string" ? args.resume : "";
    const nom = typeof args.nom === "string" ? args.nom : null;

    // Résultat rendu au modèle. On ne lui ment JAMAIS : en cas d'échec il
    // l'apprend et le dit au visiteur, au lieu d'annoncer un « c'est transmis »
    // qui laisserait la personne attendre une réponse qui ne viendra pas.
    let toolResult: string;

    if (!looksLikeEmail(email)) {
      toolResult =
        "ÉCHEC : adresse email absente ou invalide. Redemande-la simplement au " +
        "visiteur avant de réessayer. N'annonce pas que la demande est transmise.";
    } else {
      const rate = await checkInboundRateLimit(email.toLowerCase());
      if (!rate.allowed) {
        toolResult =
          "ÉCHEC : trop de demandes ont déjà été ouvertes pour cette adresse. " +
          "Invite le visiteur à écrire directement à contact@workwave.fr.";
      } else {
        const ticket = await createTicketFromChat({
          email,
          name: nom,
          subject: sujet,
          resume,
          transcript: buildTranscript(messages),
          pathname: pathnameOf(body.context),
          conversationId,
        });

        if (!ticket) {
          toolResult =
            "ÉCHEC : la demande n'a pas pu être enregistrée. Dis-le franchement " +
            "au visiteur et invite-le à écrire à contact@workwave.fr.";
        } else {
          // Tri IA puis alerte admin, tous deux AWAITÉS : sur Vercel une
          // promesse détachée est tuée dès que la réponse part (leçon du
          // 06/06, un lead avait mis 4 jours à être diffusé).
          if (ticket.created) {
            try {
              const triage = await triageTicket({ subject: sujet, body: resume });
              if (triage) await updateTicketTriage(ticket.ticketId, triage);
            } catch (e) {
              console.error("[agent-chat] tri IA échec:", (e as Error).message);
            }
          }
          const notified = await notifyAdminOfChatTicket({
            ticketId: ticket.ticketId,
            subject: sujet || "Demande via le chat",
            resume,
            requesterEmail: email.toLowerCase(),
            requesterName: nom,
            pathname: pathnameOf(body.context),
          });

          toolResult = notified
            ? "OK : demande transmise à l'équipe. Confirme-le au visiteur en UNE " +
              `phrase, en rappelant l'adresse de façon masquée (${obfuscate(email)}) ` +
              "et en indiquant une réponse par email sous 48 h ouvrées. Ne donne " +
              "aucun numéro de ticket."
            : "PARTIEL : la demande est enregistrée mais l'alerte email n'est pas " +
              "partie. Dis au visiteur que sa demande est enregistrée, et invite-le " +
              "à écrire aussi à contact@workwave.fr pour être sûr.";
        }
      }
    }

    // Second tour : le modèle rédige la clôture à partir du résultat réel.
    const follow = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        ...chatMessages,
        { role: "assistant" as const, content: completion.content },
        {
          role: "user" as const,
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: toolUse.id,
              content: toolResult,
            },
          ],
        },
      ],
    });

    return NextResponse.json({ reply: firstText(follow) });
  } catch (e) {
    console.error("[agent-chat] erreur Claude :", e);
    return NextResponse.json(
      {
        error:
          "Service IA momentanément indisponible. Réessayez dans un instant ou écrivez-nous à contact@workwave.fr.",
      },
      { status: 503 }
    );
  }
}
