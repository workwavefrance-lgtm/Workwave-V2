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
  if (!ctx) return "Bonjour ! Comment puis-je vous aider ?";
  switch (ctx.type) {
    case "pro_fiche": {
      const art = getCategoryArticle(ctx.categoryName);
      return `Bonjour ! Vous regardez la fiche de **${ctx.proName}**. Vous êtes ${ctx.proName} (pour gérer votre fiche), ou un client potentiel qui cherche ${art} ${ctx.categoryName.toLowerCase()} ?`;
    }
    case "listing": {
      const art = getCategoryArticle(ctx.categoryName);
      return `Bonjour ! Vous cherchez ${art} ${ctx.categoryName.toLowerCase()} à **${ctx.locationName}** ? Au lieu d'éplucher toute la liste, décrivez votre projet en 30 secondes — on vous trouve 3 artisans qualifiés. C'est gratuit, sans engagement.`;
    }
    case "home":
      return "Bonjour ! Vous cherchez un artisan pour un projet, ou vous êtes vous-même artisan et voulez gérer votre fiche ?";
    default:
      return "Bonjour ! Comment puis-je vous aider ?";
  }
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
  if (shouldHide(pathname || "/")) return null;

  // Bouton flottant minimisé
  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Ouvrir l'assistant Workwave"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full pl-3 pr-4 py-2.5 shadow-lg transition-all duration-250 hover:scale-105"
        style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)" }}
      >
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </span>
        <span className="text-sm font-semibold">Besoin d&apos;aide ?</span>
      </button>
    );
  }

  // Panel chat ouvert
  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[calc(100vh-2.5rem)] flex flex-col bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.22)" }}
      role="dialog"
      aria-label="Assistant Workwave"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--accent)] text-white shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Assistant Workwave</p>
          <p className="text-[11px] text-white/80 leading-tight">Réponse en quelques secondes</p>
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
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--accent)] text-white rounded-br-sm"
                  : "bg-[var(--bg-primary)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-bl-sm"
              }`}
            >
              {renderMarkdownLite(m.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl rounded-bl-sm px-3.5 py-3">
              <div className="flex gap-1">
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
          placeholder="Tapez votre message..."
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
