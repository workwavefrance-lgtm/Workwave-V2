"use client";

import { Suspense, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") === "unauthorized"
      ? "Vous n'avez pas les droits administrateur."
      : ""
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Verify admin status
    const res = await fetch("/api/admin/auth/check");
    if (!res.ok) {
      await supabase.auth.signOut();
      setError("Ce compte n'a pas les droits administrateur.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0A0A0A" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-lg font-semibold tracking-tight"
            style={{ color: "#FAFAFA" }}
          >
            Workwave Admin
          </h1>
          <p className="text-xs mt-1" style={{ color: "#737373" }}>
            Connectez-vous pour accéder au dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#EF4444",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#737373" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors duration-150"
              style={{
                backgroundColor: "#111111",
                border: "1px solid #1F1F1F",
                color: "#FAFAFA",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "#10B981")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "#1F1F1F")
              }
              placeholder="admin@workwave.fr"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#737373" }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors duration-150"
              style={{
                backgroundColor: "#111111",
                border: "1px solid #1F1F1F",
                color: "#FAFAFA",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "#10B981")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "#1F1F1F")
              }
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#10B981",
              color: "#FAFAFA",
            }}
            onMouseEnter={(e) =>
              !loading &&
              ((e.target as HTMLElement).style.backgroundColor = "#059669")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = "#10B981")
            }
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
