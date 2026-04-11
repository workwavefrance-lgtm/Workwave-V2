"use client";

import { useState } from "react";

interface CsvExportButtonProps {
  endpoint: string;
  filename: string;
}

export default function CsvExportButton({ endpoint, filename }: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      // UTF-8 BOM for Excel compatibility
      const bom = "\uFEFF";
      const blob = new Blob([bom + text], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        backgroundColor: "transparent",
        color: "var(--admin-text-secondary)",
        border: "1px solid var(--admin-border)",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 500,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "opacity 200ms ease-out",
      }}
    >
      {loading ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2v8M8 10l-2.5-2.5M8 10l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {loading ? "Export..." : "Export CSV"}
    </button>
  );
}
