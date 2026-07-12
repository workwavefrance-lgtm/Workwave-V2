"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProRgpd } from "./actions";

/**
 * Suppression RGPD en 2 clics depuis la fiche pro admin (remplace les scripts
 * _rgpd-*.ts). Soft-delete + blacklist email du plaignant. Cf. deleteProRgpd.
 */
export default function ProRgpdDelete({
  proId,
  proName,
  proEmail,
}: {
  proId: number;
  proName: string;
  proEmail: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(proEmail || "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setError(null);
    start(async () => {
      const res = await deleteProRgpd({
        proId,
        blacklistEmail: email.trim() || undefined,
        reason: "rgpd_deletion_admin",
      });
      if (!res.ok) {
        setError(res.error || "Erreur");
        return;
      }
      router.push("/admin/pros");
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left text-[12px] font-medium px-3 py-2 rounded-lg transition-colors hover:brightness-125"
        style={{ color: "var(--admin-danger)", background: "rgba(251,110,91,.1)", border: "1px solid rgba(251,110,91,.25)" }}
      >
        🗑️ Supprimer cette fiche (RGPD)
      </button>

      {open && (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-3" onClick={() => !pending && setOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)" }} />
          <div
            className="relative w-full sm:max-w-sm rounded-2xl p-5"
            style={{ background: "var(--admin-card)", border: "1px solid var(--admin-border-strong)", boxShadow: "0 30px 60px -15px rgba(0,0,0,.8)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--admin-text)" }}>Suppression RGPD</h3>
            <p className="text-[12.5px] mt-2 leading-relaxed" style={{ color: "var(--admin-text-secondary)" }}>
              La fiche <b style={{ color: "var(--admin-text)" }}>{proName}</b> sera retirée du site (404 + désindexation),
              ses coordonnées effacées, et elle ne sera plus jamais contactée. Action pour une demande d&apos;effacement (art. 17).
            </p>

            <label className="block text-[11px] font-semibold mt-4 mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>
              Email du plaignant à blacklister <span style={{ color: "var(--admin-text-tertiary)" }}>(optionnel)</span>
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.fr"
              className="w-full h-10 px-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--admin-hover)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            />

            {error && <p className="text-[12px] mt-3" style={{ color: "var(--admin-danger)" }}>{error}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} disabled={pending}
                className="flex-1 h-10 rounded-lg text-sm font-semibold transition-colors hover:brightness-125"
                style={{ color: "var(--admin-text-secondary)", background: "var(--admin-hover)", border: "1px solid var(--admin-border)" }}>
                Annuler
              </button>
              <button onClick={confirm} disabled={pending}
                className="flex-1 h-10 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-60"
                style={{ background: "var(--admin-danger)" }}>
                {pending ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
