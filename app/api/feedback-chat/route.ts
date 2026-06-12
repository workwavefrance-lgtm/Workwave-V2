/**
 * POST /api/feedback-chat — agent IA SAV / écoute produit.
 *
 * Deux actions dans la même route :
 *  - { action: "chat", messages }  → réponse de l'agent (Haiku 4.5, court, humain).
 *  - { action: "save", messages, userKind?, email? } → résumé + catégorie via
 *    Haiku (JSON strict), email admin (CHEMIN CRITIQUE, awaité — leçon 24/05),
 *    archive best-effort dans platform_feedback (le code tolère l'absence de
 *    la table tant que la migration 2026-06-12_platform_feedback.sql n'est
 *    pas appliquée : l'email admin suffit à ne rien perdre).
 *
 * Même infra que /api/agent-chat (Léa) : POST JSON sans streaming, rate limit
 * mémoire par IP, fallback clé API dev (leçon 24/05 ANTHROPIC_API_KEY vide).
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { sendFeedbackAlert } from "@/lib/email/send-feedback-alert";

function readApiKeyFromDotenvLocal(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  try {
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
    if (!apiKey) apiKey = readApiKeyFromDotenvLocal() ?? undefined;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante côté serveur");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

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

const MODEL = "claude-haiku-4-5-20251001";

// ---- Garde-fous échelle (200k visiteurs/jour) ----
// Plafond IA quotidien GLOBAL, durable multi-instances via RPC Postgres
// (increment_daily_counter, migration 2026-06-12_feedback_scale.sql).
// Au-delà : l'agent dégrade en mode formulaire (le retour est conservé,
// seul le chat IA est suspendu jusqu'à minuit). Coût max/jour ≈ cap × $0.0015.
const DAILY_AI_CAP = parseInt(process.env.FEEDBACK_CHAT_DAILY_CAP || "20000", 10);
const MAX_USER_TURNS = 12;
let _fallbackCount = 0; // si la RPC manque : cap conservateur par instance
let _fallbackDay = "";

async function checkDailyBudget(): Promise<boolean> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await sb.rpc("increment_daily_counter", {
      counter_name: "feedback_chat",
    });
    if (!error && data && typeof (data as { value?: number }).value === "number") {
      return (data as { value: number }).value <= DAILY_AI_CAP;
    }
  } catch {
    /* RPC absente : fallback in-memory ci-dessous */
  }
  const today = new Date().toISOString().slice(0, 10);
  if (_fallbackDay !== today) {
    _fallbackDay = today;
    _fallbackCount = 0;
  }
  _fallbackCount++;
  return _fallbackCount <= Math.max(100, Math.floor(DAILY_AI_CAP / 10));
}

function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!origin) return true; // certains navigateurs strippent — ne pas casser les vrais users
  return (
    origin.includes("workwave.fr") ||
    origin.includes("localhost") ||
    origin.includes("vercel.app")
  );
}

const SAV_PROMPT = `Tu es l'agent d'écoute de Workwave (workwave.fr), plateforme de mise en relation entre particuliers et artisans en France. Ta mission : recueillir le retour de l'utilisateur pour améliorer la plateforme. Tu parles à la première personne, comme un humain de l'équipe — chaleureux, direct, reconnaissant.

CE QUE TU CHERCHES À RECUEILLIR (dans la conversation, naturellement, UNE question à la fois) :
1. Ce qui lui a plu ou déplu dans son expérience (dépôt de projet, réclamation de fiche, navigation...)
2. S'il a rencontré un PROBLÈME : sur quelle page, en faisant quoi, ce qui s'est affiché (assez de détail pour qu'on reproduise)
3. Ses IDÉES d'amélioration : qu'est-ce qui lui manque, qu'est-ce qui rendrait Workwave plus utile pour lui

RÈGLES STRICTES :
- Réponses TRÈS COURTES (max 2-3 phrases), UNE seule question à la fois
- JAMAIS d'emoji, vouvoiement
- Remercie sincèrement : chaque retour aide vraiment la plateforme à s'améliorer
- Ne promets JAMAIS de délai ni qu'une fonctionnalité sera développée — dis que le retour est transmis directement à l'équipe
- Après 3-5 échanges, quand tu as l'essentiel, invite l'utilisateur à cliquer sur le bouton « Envoyer mon retour » sous la conversation
- Question de facturation, litige avec un artisan, demande RGPD → oriente vers contact@workwave.fr (réponse sous 48h ouvrées)
- Si l'utilisateur demande qui tu es : tu es l'assistant de l'équipe Workwave dédié aux retours utilisateurs`;

const SUMMARIZE_PROMPT = `Tu reçois la transcription d'une conversation de feedback sur la plateforme Workwave. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, au format :
{"category": "amelioration" | "bug" | "autre", "summary": "résumé factuel en 1-3 phrases du retour de l'utilisateur (ce qu'il a signalé/proposé, avec les détails utiles pour agir)", "user_kind": "particulier" | "pro" | "inconnu"}
Choisis "bug" si un dysfonctionnement est signalé, "amelioration" si c'est une idée/demande, "autre" sinon. Déduis user_kind du contexte (artisan/pro vs particulier), sinon "inconnu".`;

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as { role: string; content: string }[])
    .filter((m) => m && typeof m.content === "string" && m.content.length > 0)
    .slice(-20)
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content.slice(0, 2000),
    }));
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de messages, merci de patienter une minute." },
      { status: 429 }
    );
  }
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
  }

  let body: {
    action?: string;
    messages?: unknown;
    email?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Au moins un message est requis" },
      { status: 400 }
    );
  }

  // ---------- SAVE : résumé + email admin + archive ----------
  if (body.action === "save") {
    try {
      const transcriptText = messages
        .map((m) => `${m.role === "user" ? "Utilisateur" : "Agent"} : ${m.content}`)
        .join("\n");
      let parsed: { category?: string; summary?: string; user_kind?: string } = {};
      // Résumé IA seulement si le budget quotidien le permet — sinon le retour
      // part quand même (brut) : on ne perd JAMAIS un feedback pour une question de coût.
      if (await checkDailyBudget()) {
        try {
          const completion = await getClient().messages.create({
            model: MODEL,
            max_tokens: 300,
            system: SUMMARIZE_PROMPT,
            messages: [{ role: "user", content: transcriptText.slice(0, 8000) }],
          });
          const rawText =
            completion.content[0]?.type === "text" ? completion.content[0].text : "{}";
          parsed = JSON.parse(rawText.match(/\{[\s\S]*\}/)?.[0] || "{}");
        } catch {
          /* résumé non parsable / IA indispo : fallback brut ci-dessous */
        }
      }
      const category = ["amelioration", "bug", "autre"].includes(parsed.category || "")
        ? (parsed.category as string)
        : "autre";
      const userKind = ["particulier", "pro"].includes(parsed.user_kind || "")
        ? (parsed.user_kind as string)
        : "inconnu";
      const summary =
        parsed.summary?.slice(0, 1000) ||
        messages.filter((m) => m.role === "user").map((m) => m.content).join(" · ").slice(0, 500);
      const email =
        typeof body.email === "string" && body.email.includes("@")
          ? body.email.trim().toLowerCase().slice(0, 200)
          : null;

      // CHEMIN CRITIQUE : email admin, awaité.
      await sendFeedbackAlert({ category, summary, userKind, email, transcript: messages });

      // Archive best-effort (table peut ne pas exister tant que la migration
      // n'est pas appliquée — l'email admin garantit qu'aucun retour n'est perdu).
      try {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { error } = await sb.from("platform_feedback").insert({
          user_kind: userKind,
          email,
          category,
          summary,
          transcript: messages,
        });
        if (error) console.error("[feedback-chat] archive KO (email admin OK) :", error.message);
      } catch (e) {
        console.error("[feedback-chat] archive KO (email admin OK) :", e);
      }

      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("[feedback-chat] save erreur :", e);
      return NextResponse.json(
        { error: "Impossible d'envoyer votre retour. Écrivez-nous à contact@workwave.fr." },
        { status: 503 }
      );
    }
  }

  // ---------- CHAT ----------
  // Cap de tours : au-delà, on invite à envoyer (aucun appel IA).
  const userTurns = messages.filter((m) => m.role === "user").length;
  if (userTurns > MAX_USER_TURNS) {
    return NextResponse.json({
      reply:
        "Merci pour tous ces détails ! J'ai tout noté — cliquez sur « Envoyer mon retour à l'équipe » juste en dessous pour que ça nous parvienne.",
    });
  }
  // Plafond budgétaire quotidien : mode dégradé (formulaire) au-delà.
  if (!(await checkDailyBudget())) {
    return NextResponse.json({
      reply:
        "Merci de votre visite ! Notre assistant fait une pause aujourd'hui — écrivez directement votre retour (idée, bug, avis) dans le champ ci-dessous puis cliquez « Envoyer mon retour à l'équipe » : il sera lu par l'équipe, c'est promis.",
      degraded: true,
    });
  }
  try {
    const completion = await getClient().messages.create({
      model: MODEL,
      max_tokens: 300,
      system: SAV_PROMPT,
      messages,
    });
    const reply =
      completion.content[0]?.type === "text"
        ? completion.content[0].text
        : "Désolé, je n'ai pas pu générer de réponse. Réessayez ou écrivez-nous à contact@workwave.fr.";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[feedback-chat] erreur Claude :", e);
    return NextResponse.json(
      { error: "Service momentanément indisponible. Réessayez dans un instant." },
      { status: 503 }
    );
  }
}
