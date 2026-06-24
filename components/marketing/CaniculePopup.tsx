"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ──────────────────────────────────────────────────────────────────────────
   POPUP « ALERTE CANICULE » — pousse le dépôt de projet de climatisation.

   ▸ POUR L'ÉTEINDRE (après la canicule) : passer ENABLED à false ci-dessous,
     puis commit + push. C'est tout — rien d'autre à toucher.
   ▸ POUR LE RÉ-AFFICHER à tous plus tard : changer le suffixe de STORAGE_KEY
     (ex. _2026_07) → tout le monde le reverra une fois.

   Comportement : s'ouvre 1 fois par visiteur (mémorisé en localStorage),
   1,2 s après l'arrivée, sur toutes les pages publiques SAUF /deposer-projet
   (l'utilisateur y est déjà) et /pro* (pages artisans). Fermable par ✕, Échap,
   clic en dehors, ou « Plus tard ». Mobile + dark mode via les tokens du site.
   ────────────────────────────────────────────────────────────────────────── */
const ENABLED = true;
const STORAGE_KEY = "ww_canicule_popup_2026_06";
const SHOW_DELAY_MS = 1200;
const CORAL = "#FF5A36";

export default function CaniculePopup() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ENABLED) return;
    if (
      pathname.startsWith("/deposer-projet") ||
      pathname === "/pro" ||
      pathname.startsWith("/pro/")
    )
      return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function remember() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

  function dismiss() {
    remember();
    setOpen(false);
  }

  if (!ENABLED || !open) return null;

  return (
    <div
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Alerte canicule"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(10,10,10,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "wwCanicFade .25s ease-out",
      }}
    >
      <style>{`
        @keyframes wwCanicSpin{to{transform:rotate(360deg)}}
        @keyframes wwCanicGlow{0%{transform:scale(.85);opacity:.7}100%{transform:scale(2);opacity:0}}
        @keyframes wwCanicPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes wwCanicFade{from{opacity:0}to{opacity:1}}
        @keyframes wwCanicPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
        .ww-canic-spin{animation:wwCanicSpin 16s linear infinite}
        .ww-canic-glow{animation:wwCanicGlow 2.4s ease-out infinite}
        .ww-canic-cta{animation:wwCanicPulse 1.8s ease-in-out infinite;transition:background .2s ease}
        .ww-canic-cta:hover{background:#E63E1A !important}
        @media (prefers-reduced-motion: reduce){
          .ww-canic-spin,.ww-canic-glow,.ww-canic-cta{animation:none !important}
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: 360,
          width: "100%",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 18,
          padding: "30px 28px 26px",
          textAlign: "center",
          animation: "wwCanicPop .3s ease-out",
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Fermer"
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            fontSize: 22,
            lineHeight: 1,
            padding: 6,
          }}
        >
          &times;
        </button>

        <div style={{ position: "relative", width: 74, height: 74, margin: "2px auto 16px" }}>
          <span
            className="ww-canic-glow"
            style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#F5C4B3" }}
            aria-hidden="true"
          />
          <span
            className="ww-canic-glow"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "#F5C4B3",
              animationDelay: "1.2s",
            }}
            aria-hidden="true"
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              className="ww-canic-spin"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={CORAL}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </span>
        </div>

        <div
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.14em",
            color: CORAL,
            marginBottom: 10,
          }}
        >
          CANICULE EN COURS
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            lineHeight: 1.22,
            margin: "0 0 10px",
          }}
        >
          On vous trouve un installateur. Vite.
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 22px",
          }}
        >
          Votre demande part{" "}
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>tout de suite</strong>{" "}
          aux installateurs de votre secteur. Recevez plusieurs devis et choisissez.{" "}
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            Workwave est 100&nbsp;% gratuit
          </strong>{" "}
          &mdash; vous ne payez que votre artisan.
        </p>

        <Link
          href="/deposer-projet?categorie=climaticien"
          onClick={remember}
          className="ww-canic-cta"
          style={{
            display: "block",
            background: CORAL,
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            textAlign: "center",
            padding: "14px",
            borderRadius: 11,
            textDecoration: "none",
          }}
        >
          Déposer mon projet &rarr;
        </Link>

        <button
          onClick={dismiss}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            fontSize: 13,
            marginTop: 12,
            padding: 4,
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
