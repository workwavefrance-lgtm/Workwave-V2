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
import { buildSystemPrompt, sanitizeContext } from "@/lib/support/lea-prompt";

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

// Le prompt et l'assainissement du contexte vivent dans lib/support/lea-prompt.ts
// (testables sans serveur HTTP). Voir scripts/_test-lea-guardrails.ts.


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

  let body: { messages?: unknown; context?: unknown };
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

  try {
    const completion = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      // 600 (et non 400) : une réponse de support explique parfois une
      // procédure en plusieurs points (les 5 causes de "je ne reçois aucun
      // projet"). La consigne "2-3 phrases" reste la norme pour le commercial ;
      // c'est un plafond, pas une cible.
      max_tokens: 600,
      system: systemPrompt,
      messages: messages
        .filter((m) => m && typeof m.content === "string" && m.content.length > 0)
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content.slice(0, 2000), // limite par message
        })),
    });

    const reply =
      completion.content[0]?.type === "text"
        ? completion.content[0].text
        : "Désolé, je n'ai pas pu générer de réponse. Réessayez ou écrivez-nous à contact@workwave.fr.";

    return NextResponse.json({ reply });
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
