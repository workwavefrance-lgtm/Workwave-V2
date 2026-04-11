"use client";

import AdminModal from "./AdminModal";
import AdminButton from "./AdminButton";

export default function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  variant = "danger",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}) {
  return (
    <AdminModal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p
        className="text-xs mb-5 leading-relaxed"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        {message}
      </p>
      <div className="flex items-center justify-end gap-2">
        <AdminButton variant="ghost" onClick={onClose} size="sm">
          Annuler
        </AdminButton>
        <AdminButton
          variant={variant}
          onClick={onConfirm}
          loading={loading}
          size="sm"
        >
          {confirmLabel}
        </AdminButton>
      </div>
    </AdminModal>
  );
}
