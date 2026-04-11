"use client";

import { useState, useCallback } from "react";
import AdminButton from "@/components/admin/forms/AdminButton";
import AdminModal from "@/components/admin/forms/AdminModal";
import AdminInput from "@/components/admin/forms/AdminInput";
import AdminConfirmDialog from "@/components/admin/forms/AdminConfirmDialog";
import AdminBadge from "@/components/admin/data-display/AdminBadge";

type AdminRow = {
  id: number;
  email: string;
  role: string;
  created_at: string;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SettingsClient({
  admins: initialAdmins,
  currentAdminId,
  currentAdminRole,
}: {
  admins: AdminRow[];
  currentAdminId: number;
  currentAdminRole: string;
}) {
  const [admins, setAdmins] = useState<AdminRow[]>(initialAdmins);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isSuperadmin = currentAdminRole === "superadmin";

  const handleAdd = useCallback(async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/settings/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error || "Une erreur est survenue");
        return;
      }
      setAdmins((prev) => [...prev, json.admin as AdminRow]);
      setAddEmail("");
      setAddOpen(false);
    } catch {
      setAddError("Erreur réseau");
    } finally {
      setAddLoading(false);
    }
  }, [addEmail]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/settings/admins?id=${deleteTarget.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {
      // fail silently
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget]);

  return (
    <div className="max-w-2xl">
      <h1
        className="text-xl font-semibold mb-1"
        style={{ color: "var(--admin-text)" }}
      >
        Settings
      </h1>
      <p
        className="text-xs mb-6"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        Gestion des accès administrateur
      </p>

      {/* Admins section */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--admin-text)" }}
            >
              Administrateurs
            </h2>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--admin-text-secondary)" }}
            >
              {admins.length} membre{admins.length > 1 ? "s" : ""}
            </p>
          </div>
          {isSuperadmin && (
            <AdminButton
              size="sm"
              onClick={() => {
                setAddError("");
                setAddEmail("");
                setAddOpen(true);
              }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Ajouter un admin
            </AdminButton>
          )}
        </div>

        {/* Table */}
        {admins.length === 0 ? (
          <div
            className="px-5 py-12 text-center text-xs"
            style={{ color: "var(--admin-text-tertiary)" }}
          >
            Aucun administrateur
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                {["Email", "Rôle", "Ajouté le", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--admin-text-tertiary)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const isSelf = admin.id === currentAdminId;
                return (
                  <tr
                    key={admin.id}
                    style={{ borderBottom: "1px solid var(--admin-border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--admin-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{
                            backgroundColor: "var(--admin-accent)",
                            color: "#0A0A0A",
                            opacity: 0.8,
                          }}
                        >
                          {admin.email.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--admin-text)" }}
                        >
                          {admin.email}
                          {isSelf && (
                            <span
                              className="ml-1.5 text-[9px]"
                              style={{ color: "var(--admin-text-tertiary)" }}
                            >
                              (vous)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge
                        variant={
                          admin.role === "superadmin" ? "warning" : "default"
                        }
                      >
                        {admin.role}
                      </AdminBadge>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs tabular-nums"
                        style={{ color: "var(--admin-text-secondary)" }}
                      >
                        {formatDate(admin.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isSuperadmin && !isSelf && (
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="text-[11px] transition-colors duration-150 cursor-pointer"
                          style={{ color: "var(--admin-danger)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "0.7")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add admin modal */}
      <AdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter un administrateur"
      >
        <div className="space-y-4">
          <AdminInput
            label="Adresse email"
            type="email"
            value={addEmail}
            onChange={setAddEmail}
            placeholder="admin@workwave.fr"
            required
          />
          {addError && (
            <p className="text-xs" style={{ color: "var(--admin-danger)" }}>
              {addError}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              Annuler
            </AdminButton>
            <AdminButton
              size="sm"
              onClick={handleAdd}
              loading={addLoading}
              disabled={!addEmail.trim()}
            >
              Ajouter
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      {/* Delete confirm dialog */}
      <AdminConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Supprimer cet administrateur"
        message={`Vous allez retirer les droits d'administration à ${deleteTarget?.email}. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
