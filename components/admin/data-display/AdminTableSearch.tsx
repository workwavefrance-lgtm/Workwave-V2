"use client";

import { useRef, useEffect } from "react";

export default function AdminTableSearch({
  value,
  onChange,
  placeholder = "Rechercher...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
        style={{ color: "var(--admin-text-tertiary)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-lg text-xs outline-none transition-colors duration-150"
        style={{
          backgroundColor: "var(--admin-bg)",
          border: "1px solid var(--admin-border)",
          color: "var(--admin-text)",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor = "var(--admin-accent)")
        }
        onBlur={(e) =>
          (e.target.style.borderColor = "var(--admin-border)")
        }
      />
      {!value && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--admin-hover)",
            color: "var(--admin-text-tertiary)",
          }}
        >
          /
        </span>
      )}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{ color: "var(--admin-text-tertiary)" }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
