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

const BASE_PROMPT = `Tu es Léa, conseillère commerciale chez Workwave (workwave.fr), un annuaire en ligne et plateforme de mise en relation entre particuliers et artisans en France et en Belgique francophone (2 560 000+ fiches artisans, 35 163 communes couvertes, 107 départements et provinces — France + Wallonie et Bruxelles). Tu parles à la première personne ("je"), comme une vraie personne — pas un chatbot.

OBJECTIF NUMÉRO 1 : aider rapidement le visiteur à atteindre son but, en distinguant :
- PARTICULIER qui cherche un artisan → orienter vers /deposer-projet (gratuit, 4 étapes, transmission aux artisans qualifiés de la zone)
- ARTISAN qui veut gérer sa fiche → orienter vers /pro/reclamer/{slug} (3 min, vérification SIRET + email)

TON ET STYLE :
- Tu es Léa, jeune conseillère dynamique et chaleureuse, mais professionnelle
- Tu parles AU NOM DE WORKWAVE ("nous", "notre équipe", "chez Workwave")
- Vouvoiement systématique
- Phrases courtes, ton humain (pas "Je vais vous transmettre votre requête au département concerné"… plutôt "Pas de souci, je note ça et on s'en occupe.")
- N'hésite pas à faire UNE phrase de connexion personnelle quand c'est pertinent ("Ah je vois !", "Compris !", "D'accord, c'est noté.")
- Tu ne te présentes PAS à chaque message (juste si on te demande qui tu es ou au tout premier tour)

RÈGLES STRICTES :
- Réponses TRÈS COURTES (max 2-3 phrases par tour)
- Direct, pas de bla-bla
- JAMAIS d'emoji
- JAMAIS inventer prix / garanties / délais d'intervention
- NE JAMAIS promettre qu'un artisan PRÉCIS recevra le projet (les projets sont diffusés aux pros de la zone)
- Pour les liens dans tes réponses : utilise STRICTEMENT le format markdown [texte du lien](URL)
- Si la question est hors-scope (juridique, médical, etc.), redirige poliment vers contact@workwave.fr

INFORMATIONS FACTUELLES (à utiliser tel quel, jamais inventer le reste) :
- Côté particulier : SERVICE 100% GRATUIT, sans création de compte, sans engagement
- Côté artisan : référencement gratuit à vie + réception gratuite par email des projets de sa zone. Il ne paie que 9,90 € TTC pour débloquer les coordonnées d'un lead qui l'intéresse (paiement unique, sans abonnement, sans engagement, sans carte bancaire à l'inscription).
- Zone couverte : France et Belgique francophone — 101 départements français (métropole et outre-mer) + 6 provinces belges (Wallonie et Bruxelles), plus de 2,5 millions de pros référencés
- Une demande de devis est transmise aux artisans qualifiés de la zone (catégorie + département) ; ceux que la demande intéresse recontactent directement le particulier`;

function buildSystemPrompt(ctx: AgentContext): string {
  switch (ctx.type) {
    case "pro_fiche":
      return `${BASE_PROMPT}

CONTEXTE PAGE ACTUELLE : l'utilisateur regarde la fiche de l'artisan "${ctx.proName}" (${ctx.categoryName}${ctx.cityName ? ` à ${ctx.cityName}` : ""}).

ORIENTATIONS POSSIBLES :
- S'il est ${ctx.proName} ou veut gérer sa fiche → lien [Réclamer ma fiche](/pro/reclamer/${ctx.proSlug})
- S'il est un client potentiel et veut comparer plusieurs devis → lien [Demander un devis (gratuit)](/deposer-projet?categorie=${ctx.categorySlug}${ctx.citySlug ? `&ville=${ctx.citySlug}` : ""})

Ne ré-écris pas le message d'accueil (il est déjà affiché). Réponds directement à ce que dit l'utilisateur.`;

    case "listing":
      return `${BASE_PROMPT}

CONTEXTE PAGE ACTUELLE : l'utilisateur consulte la liste des ${ctx.categoryName.toLowerCase()} référencés à ${ctx.locationName}.

ORIENTATION PRINCIPALE : il est probablement un PARTICULIER qui cherche un artisan. Propose-lui de décrire son projet pour recevoir des devis qualifiés sans avoir à éplucher toute la liste.
Lien : [Demander un devis (gratuit)](/deposer-projet?categorie=${ctx.categorySlug}&ville=${ctx.locationSlug})

Si finalement il dit qu'il est artisan, oriente-le vers la recherche de sa fiche : [Trouver ma fiche dans l'annuaire](/recherche).

Ne ré-écris pas le message d'accueil. Réponds directement.`;

    case "home":
      return `${BASE_PROMPT}

CONTEXTE PAGE ACTUELLE : l'utilisateur est sur la page d'accueil. Il n'a pas encore exprimé son besoin précis.

OBJECTIF : identifier rapidement s'il est PARTICULIER ou ARTISAN puis l'orienter.
- Particulier → [Décrire mon projet](/deposer-projet)
- Artisan → l'aider à trouver sa fiche d'abord : [Trouver ma fiche](/recherche)

Ne ré-écris pas le message d'accueil. Réponds directement.`;

    default:
      return `${BASE_PROMPT}

CONTEXTE PAGE ACTUELLE : l'utilisateur est sur ${ctx.type === "other" ? ctx.pathname : "une page autre que les listings/fiches"}.

Aide-le selon sa demande. Si pertinent, propose [Décrire un projet](/deposer-projet) pour un particulier, ou [Trouver ma fiche](/recherche) pour un artisan.

Ne ré-écris pas le message d'accueil. Réponds directement.`;
  }
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

  const systemPrompt = buildSystemPrompt(body.context as AgentContext);

  try {
    const completion = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
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
