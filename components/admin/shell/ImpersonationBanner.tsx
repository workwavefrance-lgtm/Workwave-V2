"use client";

import { useState, useEffect } from "react";

type ImpersonationData = {
  adminId: number;
  adminEmail: string;
  proId: number;
  proName: string;
  startedAt: string;
};

export default function ImpersonationBanner({
  data,
}: {
  data: ImpersonationData;
}) {
  const [elapsed, setElapsed] = useState("00:00");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const startTime = new Date(data.startedAt).getTime();
    const maxDuration = 30 * 60 * 1000; // 30 min

    function update() {
      const diff = Date.now() - startTime;
      if (diff >= maxDuration) {
        setExpired(true);
        // Redirect auto vers /admin
        window.location.href = `/admin/pros/${data.proId}`;
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [data.startedAt, data.proId]);

  async function handleExit() {
    try {
      await fetch("/api/admin/impersonate/exit", { method: "POST" });
      window.location.href = `/admin/pros/${data.proId}`;
    } catch {
      window.location.href = "/admin";
    }
  }

  if (expired) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2"
      style={{
        background: "linear-gradient(90deg, #DC2626, #EF4444)",
        color: "#FFFFFF",
      }}
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <span className="text-xs font-semibold">
          Mode admin — Connecté en tant que {data.proName}
        </span>
        <span className="text-xs font-mono opacity-80 tabular-nums">
          {elapsed}
        </span>
      </div>
      <button
        onClick={handleExit}
        className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-150 cursor-pointer"
      >
        Quitter
      </button>
    </div>
  );
}
