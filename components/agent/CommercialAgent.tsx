"use client";

/**
 * Agent commercial conversationnel global.
 *
 * Bulle flottante bottom-right, persistante sur toutes les pages
 * publiques. Détecte le type de page (fiche pro / listing / home /
 * autre) via /api/agent-context et adapte son message d'accueil +
 * son comportement.
 *
 * Architecture :
 * - Message d'accueil scripté côté client (zéro appel API au mount)
 * - Tours suivants : POST /api/agent-chat (Claude Sonnet)
 * - sessionStorage : si l'utilisateur ferme, on reste fermé pour la
 *   session (ne pas le harceler)
 * - Markdown léger : seuls les liens [texte](url) sont parsés et
 *   rendus comme <Link> Next.js
 *
 * Volontairement NON streamé en v1 : POST simple, plus robuste,
 * latence acceptable (1-3s par tour).
 */

import { useState, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { AgentContext } from "@/app/api/agent-context/route";
import { getCategoryArticle } from "@/lib/utils/category-grammar";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_DISMISSED = "workwave_agent_dismissed";
const STORAGE_MESSAGES = "workwave_agent_messages";
const STORAGE_AUTO_OPENED = "workwave_agent_auto_opened";
const COOKIE_CONSENT_NAME = "consent_analytics";

// Identite de l'agent. Donner un prenom + role humanise et augmente
// la confiance. Le system prompt cote API utilise le meme prenom.
const AGENT_NAME = "Léa";
const AGENT_INITIAL = "L";
const AGENT_ROLE = "Conseillère Workwave";

/**
 * Delai d'auto-open du panel selon le contexte de page. L'idee est
 * d'etre proactif (pousser la conversion sans attendre le clic) mais
 * pas annoying : on laisse l'user voir la page d'abord. Les pages a
 * intent fort (listing, fiche pro) declenchent plus vite.
 * Retourne null si on ne doit PAS auto-ouvrir sur cette page.
 */
function getAutoOpenDelayMs(ctx: AgentContext | null): number | null {
  if (!ctx) return null;
  switch (ctx.type) {
    case "listing":
      return 10_000; // user a tape un metier+ville -> intent fort
    case "pro_fiche":
      return 14_000; // user regarde une fiche -> laisser le temps de lire
    case "home":
      return 16_000; // user en exploration -> un peu plus de patience
    default:
      return null; // blog, legal, autre -> pas d'auto-open
  }
}

/**
 * Détecte si l'utilisateur a déjà géré le bandeau cookies (accepté ou
 * refusé). Tant que ce n'est pas le cas, on N'AFFICHE PAS la bulle de
 * l'agent : sur mobile, le bandeau cookies est full-width au bas de
 * l'écran et masquerait la bulle. Mieux : un popup à la fois.
 */
function hasCookieConsentHandled(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${COOKIE_CONSENT_NAME}=`));
}

// Pages où on N'AFFICHE PAS l'agent (admin, dashboard pro, flow claim, etc.)
const HIDDEN_PATTERNS: RegExp[] = [
  /^\/admin(\/|$)/,
  /^\/pro\/dashboard(\/|$)/,
  /^\/pro\/connexion/,
  /^\/pro\/mot-de-passe-oublie/,
  /^\/pro\/reinitialiser-mot-de-passe/,
  /^\/pro\/reclamer\//,
  /^\/auth\//,
  /^\/deposer-projet/,
  /^\/artisan\/[^/]+\/supprimer/,
  /^\/unsubscribe/,
];

function shouldHide(pathname: string): boolean {
  return HIDDEN_PATTERNS.some((re) => re.test(pathname));
}

function buildWelcomeMessage(ctx: AgentContext | null): string {
  if (!ctx) return `Bonjour, je suis ${AGENT_NAME} de Workwave. Comment puis-je vous aider ?`;
  switch (ctx.type) {
    case "pro_fiche": {
      const art = getCategoryArticle(ctx.categoryName);
      return `Bonjour, je suis ${AGENT_NAME} de Workwave. Vous regardez la fiche de **${ctx.proName}** : vous êtes ${ctx.proName} (pour gérer votre fiche), ou un client potentiel qui cherche ${art} ${ctx.categoryName.toLowerCase()} ?`;
    }
    case "listing": {
      const art = getCategoryArticle(ctx.categoryName);
      return `Bonjour, je suis ${AGENT_NAME} de Workwave. Vous cherchez ${art} ${ctx.categoryName.toLowerCase()} à **${ctx.locationName}** ? Au lieu d'éplucher toute la liste, décrivez-moi votre projet en 30 secondes — je vous trouve 3 artisans qualifiés, gratuitement et sans engagement.`;
    }
    case "home":
      return `Bonjour, je suis ${AGENT_NAME} de Workwave. Vous cherchez un artisan pour un projet, ou vous êtes vous-même artisan et voulez gérer votre fiche ?`;
    default:
      return `Bonjour, je suis ${AGENT_NAME} de Workwave. Comment puis-je vous aider ?`;
  }
}

/**
 * Suggestions de reponses rapides selon le contexte de page. Apparaissent
 * sous le premier message d'accueil et disparaissent des que l'user tape
 * ou clique un quick reply. Pattern Intercom : reduit la friction de
 * demarrage de conversation.
 */
function getQuickReplies(ctx: AgentContext | null): string[] {
  if (!ctx) return [];
  switch (ctx.type) {
    case "home":
      return [
        "Je cherche un artisan",
        "Je suis artisan",
        "C'est gratuit ?",
      ];
    case "listing":
      return [
        "Décrire mon projet",
        "C'est vraiment gratuit ?",
        "Je suis artisan",
      ];
    case "pro_fiche":
      return [
        "Je suis le gérant",
        "Demander un devis",
        "Comment ça marche ?",
      ];
    default:
      return [];
  }
}

/**
 * Avatar circulaire de Léa : dégradé coral riche + initiale en blanc
 * en font semi-bold, avec un ring subtle blanc/glow pour le premium.
 * Taille parametrable via la prop size.
 */
function AgentAvatar({
  size = 32,
  showStatus = false,
  ring = false,
}: {
  size?: number;
  showStatus?: boolean;
  ring?: boolean;
}) {
  const px = `${size}px`;
  const fontSize = `${Math.round(size * 0.46)}px`;
  const statusSize = Math.max(8, Math.round(size * 0.28));
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold select-none"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, #FFA78B 0%, #FF7A5C 30%, #FF5A36 60%, #D63916 100%)",
          fontSize,
          letterSpacing: "-0.04em",
          boxShadow: ring
            ? "0 0 0 3px rgba(255, 90, 54, 0.18), 0 6px 16px -4px rgba(255, 90, 54, 0.45)"
            : "0 2px 6px -1px rgba(255, 90, 54, 0.35)",
        }}
        aria-hidden="true"
      >
        {AGENT_INITIAL}
      </div>
      {showStatus && (
        <span
          className="absolute rounded-full bg-[#22C55E]"
          style={{
            width: `${statusSize}px`,
            height: `${statusSize}px`,
            bottom: 0,
            right: 0,
            boxShadow: "0 0 0 2px var(--bg-primary, #FFFFFF)",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Parse une chaîne markdown simple : remplace [texte](url) par
 * un <Link> Next.js cliquable. Le reste reste du texte brut.
 * (Ne supporte pas d'autres formats — pas besoin pour notre cas.)
 */
function renderMarkdownLite(text: string): ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, label, url] = match;
    // Sécurité : on n'accepte que les liens internes ou https/mailto
    const safeUrl =
      url.startsWith("/") || url.startsWith("https://") || url.startsWith("mailto:")
        ? url
        : "#";
    parts.push(
      <Link
        key={`l${key++}`}
        href={safeUrl}
        className="font-medium text-[#FF5A36] hover:text-[#E63E1A] underline decoration-[#FF5A36]/40 hover:decoration-[#FF5A36] underline-offset-2 decoration-1 transition-colors duration-150"
      >
        {label}
      </Link>
    );
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  // Gère aussi les **gras** simples (1 niveau)
  return parts.map((p, i) => {
    if (typeof p !== "string") return p;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const boldParts: ReactNode[] = [];
    let bLast = 0;
    let m: RegExpExecArray | null;
    let bk = 0;
    while ((m = boldRegex.exec(p)) !== null) {
      if (m.index > bLast) boldParts.push(p.slice(bLast, m.index));
      boldParts.push(<strong key={`b${i}-${bk++}`}>{m[1]}</strong>);
      bLast = boldRegex.lastIndex;
    }
    if (bLast < p.length) boldParts.push(p.slice(bLast));
    return <span key={`s${i}`}>{boldParts}</span>;
  });
}

export default function CommercialAgent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<boolean | null>(null); // null = pas encore lu
  const [cookieHandled, setCookieHandled] = useState<boolean | null>(null); // null = pas encore lu
  const [context, setContext] = useState<AgentContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Lecture du flag "fermé pour la session" au mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(STORAGE_DISMISSED);
    setDismissed(stored === "1");
  }, []);

  // Detection du consent cookies. Tant que le bandeau cookies est
  // visible (pas de cookie consent_analytics), on ne montre PAS la
  // bulle pour eviter le chevauchement sur mobile (bandeau cookies
  // est full-width au bas de l'ecran sur mobile).
  // Polling court (1s) pendant 10 min puis arret pour ne pas pomper
  // de ressources eternellement.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Premiere check immediate
    if (hasCookieConsentHandled()) {
      setCookieHandled(true);
      return;
    }
    setCookieHandled(false);
    // Poll jusqu'a ce que l'user gere le bandeau
    const startedAt = Date.now();
    const maxDuration = 10 * 60 * 1000; // 10 min max
    const interval = window.setInterval(() => {
      if (hasCookieConsentHandled()) {
        setCookieHandled(true);
        window.clearInterval(interval);
      } else if (Date.now() - startedAt > maxDuration) {
        window.clearInterval(interval);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch contexte page (au mount + à chaque changement de route)
  useEffect(() => {
    if (dismissed !== false) return;
    if (shouldHide(pathname || "/")) return;
    let cancelled = false;
    fetch("/api/agent-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!cancelled && c) setContext(c as AgentContext);
      })
      .catch(() => {
        // Silencieux : l'agent fonctionnera en mode "other"
        if (!cancelled) setContext({ type: "other", pathname });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, dismissed]);

  // Auto-scroll en bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-open du panel apres un delai contextuel. Une seule fois par
  // session (sessionStorage). Conditions :
  // - bandeau cookies geré (cookieHandled === true)
  // - user n'a pas dismiss (dismissed === false)
  // - on est sur une page a intent (home, listing, fiche pro)
  // - on a deja le contexte (sinon le message d'accueil serait
  //   generique alors qu'on peut faire mieux)
  // - pas deja auto-ouvert dans la session
  // - user n'a pas deja ouvert/envoye un message
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cookieHandled !== true) return;
    if (dismissed !== false) return;
    if (!context) return;
    if (open) return;
    if (messages.length > 0) return; // user a deja interagi
    if (sessionStorage.getItem(STORAGE_AUTO_OPENED) === "1") return;
    if (shouldHide(pathname || "/")) return;

    const delay = getAutoOpenDelayMs(context);
    if (delay === null) return;

    const timer = window.setTimeout(() => {
      // Re-check au moment du fire : l'user a peut-etre dismiss
      // entre temps, ou ouvert manuellement
      if (sessionStorage.getItem(STORAGE_DISMISSED) === "1") return;
      if (sessionStorage.getItem(STORAGE_AUTO_OPENED) === "1") return;
      setOpen(true);
      const welcome = buildWelcomeMessage(context);
      setMessages([{ role: "assistant", content: welcome }]);
      try {
        sessionStorage.setItem(STORAGE_AUTO_OPENED, "1");
      } catch {
        // ignore quota
      }
    }, delay);

    return () => window.clearTimeout(timer);
    // On veut redéclencher si le contexte change (changement de
    // route) tant qu'on n'a pas encore auto-ouvert dans la session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookieHandled, dismissed, context, pathname]);

  // Persiste les messages dans sessionStorage pour pas perdre la conv
  // si l'utilisateur navigue puis revient
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
      } catch {
        // quota dépassé, on ignore
      }
    }
  }, [messages]);

  // Recharge les messages au mount si la session en avait
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(STORAGE_MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  function handleOpen() {
    setOpen(true);
    // Si pas encore de message, on affiche le message d'accueil scripté
    if (messages.length === 0) {
      const welcome = buildWelcomeMessage(context);
      setMessages([{ role: "assistant", content: welcome }]);
    }
  }

  function handleClose() {
    setOpen(false);
  }

  function handleDismiss() {
    setDismissed(true);
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_DISMISSED, "1");
    } catch {
      // ignore
    }
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    return sendMessage(input.trim());
  }

  async function sendMessage(text: string) {
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: context ?? { type: "other", pathname: pathname || "/" },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Erreur");
      }
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply ?? "" },
      ]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            err instanceof Error && err.message
              ? err.message
              : "Désolé, je suis momentanément indisponible. Vous pouvez écrire à contact@workwave.fr.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Conditions de non-affichage
  if (dismissed === null) return null; // pas encore initialisé
  if (dismissed) return null;
  if (cookieHandled !== true) return null; // attend la gestion du bandeau cookies
  if (shouldHide(pathname || "/")) return null;

  // Bouton flottant minimisé
  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Discuter avec ${AGENT_NAME}`}
        className="group fixed right-4 sm:right-5 z-50 flex items-center gap-3 bg-white dark:bg-[#0F0F0F] border border-[#E5E7EB] dark:border-[#27272A] text-[#0A0A0A] dark:text-[#FAFAFA] hover:border-[#D1D5DB] dark:hover:border-[#3F3F46] rounded-full pl-1.5 pr-4 py-1.5 transition-all duration-300 hover:-translate-y-0.5"
        style={{
          // Respect safe-area iOS (encoche, barre URL Safari du bas)
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
          boxShadow:
            "0 12px 28px -8px rgba(15, 23, 42, 0.18), 0 4px 12px -4px rgba(15, 23, 42, 0.08)",
        }}
      >
        <AgentAvatar size={36} showStatus ring />
        <span className="flex flex-col items-start leading-tight pr-0.5">
          <span className="text-[13px] font-semibold tracking-tight">
            Discuter avec {AGENT_NAME}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            En ligne maintenant
          </span>
        </span>
      </button>
    );
  }

  // Panel chat ouvert
  return (
    <div
      className="fixed right-4 sm:right-5 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[calc(100vh-2.5rem)] flex flex-col bg-[var(--bg-primary)] border border-[#E5E7EB] dark:border-[#27272A] rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
        boxShadow:
          "0 32px 64px -16px rgba(15, 23, 42, 0.25), 0 12px 24px -8px rgba(15, 23, 42, 0.10)",
      }}
      role="dialog"
      aria-label={`Assistant ${AGENT_NAME} — Workwave`}
    >
      {/* Liseré coral en haut pour la signature visuelle */}
      <div
        className="h-[3px] shrink-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #FF5A36 25%, #FF7A5C 50%, #FF5A36 75%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border-b border-[#F1F1F3] dark:border-[#1F1F23] shrink-0">
        <AgentAvatar size={42} showStatus />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-[#0A0A0A] dark:text-[#FAFAFA] tracking-tight">
            {AGENT_NAME}
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-[#6B7280] dark:text-[#9CA3AF] leading-tight mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            {AGENT_ROLE} · En ligne
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Réduire l'assistant"
          className="text-[#9CA3AF] hover:text-[#0A0A0A] dark:hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1F1F23] transition-all duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer l'assistant pour cette session"
          className="text-[#9CA3AF] hover:text-[#0A0A0A] dark:hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1F1F23] transition-all duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[#FAFAFA] dark:bg-[#0A0A0A]"
        style={{ minHeight: "300px", maxHeight: "440px" }}
      >
        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          // On affiche l'avatar uniquement sur le DERNIER message d'un
          // groupe consecutif de l'assistant (evite la repetition).
          const isLastOfAssistantGroup =
            isAssistant && (i === messages.length - 1 || messages[i + 1]?.role !== "assistant");
          const prevIsSameRole = i > 0 && messages[i - 1].role === m.role;
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"} ${
                prevIsSameRole ? "mt-1" : ""
              }`}
            >
              {isAssistant && (
                <div className="shrink-0 w-7 self-end">
                  {isLastOfAssistantGroup && <AgentAvatar size={28} />}
                </div>
              )}
              <div
                className={`max-w-[82%] px-4 py-2.5 text-[14px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--accent)] text-white rounded-2xl rounded-br-md"
                    : "bg-white dark:bg-[#111111] text-[#0A0A0A] dark:text-[#FAFAFA] rounded-2xl rounded-bl-md ring-1 ring-[#E5E7EB] dark:ring-[#27272A]"
                }`}
                style={
                  m.role === "user"
                    ? { boxShadow: "0 1px 3px rgba(255, 90, 54, 0.25)" }
                    : { boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 8px -2px rgba(15, 23, 42, 0.06)" }
                }
              >
                {renderMarkdownLite(m.content)}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="shrink-0 w-7 self-end">
              <AgentAvatar size={28} />
            </div>
            <div className="flex flex-col gap-1">
              <div
                className="bg-white dark:bg-[#111111] ring-1 ring-[#E5E7EB] dark:ring-[#27272A] rounded-2xl rounded-bl-md px-4 py-3"
                style={{ boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}
              >
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
              <p className="text-[11px] text-[#9CA3AF] pl-1">{AGENT_NAME} écrit…</p>
            </div>
          </div>
        )}

        {/* Quick replies sous le premier message d'accueil. Disparaissent
            des que l'user a interagi (envoye un message ou clique). */}
        {!loading &&
          messages.length === 1 &&
          messages[0].role === "assistant" &&
          (() => {
            const quickReplies = getQuickReplies(context);
            if (quickReplies.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-2 pl-9 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendMessage(reply)}
                    className="px-3.5 py-2 text-[13px] font-medium text-[#FF5A36] bg-white dark:bg-[#111111] border border-[#FF5A36]/30 hover:border-[#FF5A36] hover:bg-[#FF5A36]/5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      boxShadow:
                        "0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 6px -2px rgba(255, 90, 54, 0.12)",
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            );
          })()}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-3 py-3 border-t border-[#F1F1F3] dark:border-[#1F1F23] bg-[var(--bg-primary)] shrink-0"
      >
        <div className="flex-1 flex items-center bg-[#F3F4F6] dark:bg-[#1A1A1A] rounded-full px-4 h-11 focus-within:ring-2 focus-within:ring-[#FF5A36]/40 transition-all duration-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Écrivez à ${AGENT_NAME}…`}
            maxLength={500}
            disabled={loading}
            className="flex-1 bg-transparent text-[14px] text-[#0A0A0A] dark:text-[#FAFAFA] placeholder:text-[#9CA3AF] focus:outline-none"
          />
        </div>
        {(() => {
          const canSubmit = !loading && input.trim().length > 0;
          return (
            <button
              type="submit"
              disabled={!canSubmit}
              aria-label="Envoyer"
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                canSubmit
                  ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white hover:scale-105"
                  : "bg-[#F3F4F6] dark:bg-[#1F1F23] text-[#9CA3AF] cursor-not-allowed"
              }`}
              style={{
                boxShadow: canSubmit
                  ? "0 4px 12px -2px rgba(255, 90, 54, 0.45)"
                  : "none",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          );
        })()}
      </form>

      {/* Footer powered-by discret */}
      <div className="px-4 py-2 text-center bg-[var(--bg-primary)] border-t border-[#F1F1F3] dark:border-[#1F1F23]">
        <p className="text-[10px] text-[#9CA3AF] tracking-wide">
          Vos réponses sont confidentielles ·{" "}
          <a
            href="mailto:contact@workwave.fr"
            className="hover:text-[#FF5A36] transition-colors"
          >
            contact@workwave.fr
          </a>
        </p>
      </div>
    </div>
  );
}
