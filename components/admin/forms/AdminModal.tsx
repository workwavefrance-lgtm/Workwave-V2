"use client";

import { useEffect, useRef } from "react";

export default function AdminModal({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`${width} w-full rounded-xl p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm`}
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        color: "var(--admin-text)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--admin-text-tertiary)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--admin-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
