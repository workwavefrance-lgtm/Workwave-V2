"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Bonjour ! Je recueille les retours des utilisateurs pour améliorer Workwave — tout ce que vous me direz est transmis directement à l'équipe. Pour commencer : qu'est-ce qui vous amène ? Une idée d'amélioration, un problème rencontré, ou simplement un avis sur la plateforme ?",
};

export default function FeedbackAgent() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pending]);

  const hasUserMessage = messages.some((m) => m.role === "user");

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/feedback-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function submitFeedback() {
    if (!hasUserMessage || sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/feedback-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", messages, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="bg-[var(--bg-secondary,#FAFAFA)] border border-[var(--border-color,#E5E7EB)] rounded-2xl p-8 text-center">
        <p className="text-2xl mb-3" aria-hidden>
          ✓
        </p>
        <h2 className="text-lg font-semibold text-[var(--text-primary,#0A0A0A)] mb-2">
          Merci, votre retour est transmis à l&apos;équipe
        </h2>
        <p className="text-sm text-[var(--text-secondary,#6B7280)] leading-relaxed">
          Chaque retour compte vraiment : c&apos;est comme ça que Workwave s&apos;améliore,
          jour après jour. À bientôt !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111] border border-[var(--border-color,#E5E7EB)] dark:border-[#27272A] rounded-2xl overflow-hidden">
      {/* Messages */}
      <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed text-white"
                  : "max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed bg-[#FAFAFA] dark:bg-[#1A1A1A] text-[#0A0A0A] dark:text-[#FAFAFA] border border-[#E5E7EB] dark:border-[#27272A]"
              }
              style={m.role === "user" ? { backgroundColor: "#FF5A36" } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#27272A] text-[#6B7280] animate-pulse">
              …
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="px-5 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Input */}
      <div className="border-t border-[#E5E7EB] dark:border-[#27272A] p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Écrivez votre message…"
            className="flex-1 h-11 px-4 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] text-sm text-[#0A0A0A] dark:text-[#FAFAFA] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF5A36] transition-colors duration-200"
            disabled={pending}
          />
          <button
            onClick={send}
            disabled={pending || !input.trim()}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{ backgroundColor: "#FF5A36" }}
          >
            Envoyer
          </button>
        </div>

        {hasUserMessage && (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center pt-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email (optionnel, pour qu'on vous réponde)"
              className="flex-1 h-10 px-4 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] text-xs text-[#0A0A0A] dark:text-[#FAFAFA] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF5A36] transition-colors duration-200"
            />
            <button
              onClick={submitFeedback}
              disabled={sending}
              className="h-10 px-5 rounded-xl text-xs font-semibold border border-[#FF5A36] text-[#FF5A36] hover:bg-[#FF5A36] hover:text-white disabled:opacity-50 transition-all duration-200 cursor-pointer"
            >
              {sending ? "Envoi…" : "Envoyer mon retour à l'équipe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
