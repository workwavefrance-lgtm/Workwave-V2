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
 * Avatar circulaire de Léa : dégradé coral + initiale en blanc.
 * Taille parametrable via la prop size (rem).
 */
function AgentAvatar({ size = 32, showStatus = false }: { size?: number; showStatus?: boolean }) {
  const px = `${size}px`;
  const fontSize = `${Math.round(size * 0.45)}px`;
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold select-none"
        style={{
          background: "linear-gradient(135deg, #FF7A5C 0%, #FF5A36 60%, #E63E1A 100%)",
          fontSize,
          letterSpacing: "-0.02em",
        }}
        aria-hidden="true"
      >
        {AGENT_INITIAL}
      </div>
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-[#22C55E] border-2 border-white"
          style={{ width: `${Math.max(8, size * 0.28)}px`, height: `${Math.max(8, size * 0.28)}px` }}
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
        className="underline font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
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
    const text = input.trim();
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
        className="fixed right-4 sm:right-5 z-50 flex items-center gap-2.5 bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] text-[#0A0A0A] dark:text-[#FAFAFA] hover:border-[var(--accent)] rounded-full pl-1.5 pr-4 py-1.5 shadow-lg transition-all duration-250 hover:scale-105"
        style={{
          // Respect safe-area iOS (encoche, barre URL Safari du bas)
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)",
        }}
      >
        <AgentAvatar size={32} showStatus />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold">Discuter avec {AGENT_NAME}</span>
          <span className="text-[11px] text-[#22C55E] font-medium">En ligne</span>
        </span>
      </button>
    );
  }

  // Panel chat ouvert
  return (
    <div
      className="fixed right-4 sm:right-5 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-2.5rem)] flex flex-col bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl overflow-hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.22)",
      }}
      role="dialog"
      aria-label="Assistant Workwave"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--accent)] text-white shrink-0">
        <AgentAvatar size={36} showStatus />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{AGENT_NAME}</p>
          <p className="text-[11px] text-white/85 leading-tight">{AGENT_ROLE} · En ligne</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Réduire l'assistant"
          className="text-white/80 hover:text-white p-1 rounded transition-colors duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer l'assistant pour cette session"
          className="text-white/80 hover:text-white p-1 rounded transition-colors duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--bg-secondary)]"
        style={{ minHeight: "240px", maxHeight: "420px" }}
      >
        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          // On affiche l'avatar uniquement sur le DERNIER message d'un
          // groupe consecutif de l'assistant (evite la repetition).
          const isLastOfAssistantGroup =
            isAssistant && (i === messages.length - 1 || messages[i + 1]?.role !== "assistant");
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {isAssistant && (
                <div className="shrink-0 w-7">
                  {isLastOfAssistantGroup && <AgentAvatar size={28} />}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--accent)] text-white rounded-br-sm"
                    : "bg-[var(--bg-primary)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-bl-sm"
                }`}
              >
                {renderMarkdownLite(m.content)}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="shrink-0 w-7">
              <AgentAvatar size={28} />
            </div>
            <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl rounded-bl-sm px-3.5 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-3 py-3 border-t border-[var(--card-border)] bg-[var(--bg-primary)] shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Écrivez à ${AGENT_NAME}...`}
          maxLength={500}
          disabled={loading}
          className="flex-1 h-10 px-3 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-200"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Envoyer"
          className="w-10 h-10 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
