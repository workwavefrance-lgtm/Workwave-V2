"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "devBannerDismissed";

export default function DevBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-[320px] animate-fade-in"
      style={{ animation: "fadeIn 0.3s ease-out" }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="bg-[#1a1a1a]/95 dark:bg-[#111]/95 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg">
        {/* Fermer */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenu */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-[var(--accent)] text-lg leading-none mt-0.5">&#9888;</span>
          <p className="text-white text-sm font-semibold leading-tight">
            Workwave est en phase de lancement
          </p>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mb-4">
          Vous pourriez rencontrer quelques bugs. Si c&apos;est le cas, contactez-nous, on corrige rapidement !
        </p>

        {/* Boutons */}
        <div className="flex gap-2">
          <a
            href="https://wa.me/33759721252"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors"
          >
            WhatsApp
          </a>
          <a
            href="mailto:contact@workwave.fr"
            className="flex-1 text-center text-xs font-semibold px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </div>
  );
}
