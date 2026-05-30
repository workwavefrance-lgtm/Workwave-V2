import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
// Reuse the FR Server Action (now locale-aware). Hidden name="locale" value="en"
// drives the EN redirects.
import { updateAiPreferences } from "@/app/(ai)/ai/dashboard/preferences/actions";

export const metadata: Metadata = {
  title: "Preferences — Workwave AI Dashboard",
  description: "Configure your project matching preferences.",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_date: "Invalid date.",
  paused_until_past: "The pause end date must be in the future.",
};

export default async function AiEnDashboardPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const saved = sp.saved === "1";
  const errorKey = sp.error;
  const errorMsg = errorKey ? ERROR_MESSAGES[errorKey] || "Error. Please try again." : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  const isPaused = pro.paused_until && new Date(pro.paused_until) > new Date();

  return (
    <div className="max-w-3xl">
      {saved && (
        <div
          className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/10 text-green-800"
          role="status"
        >
          <p className="text-sm font-medium">✓ Preferences saved.</p>
        </div>
      )}
      {errorMsg && (
        <div
          className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800"
          role="alert"
        >
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · PREFERENCES ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Preferences.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)]">
          Signals used by our AI to match you with relevant projects.
        </p>
      </div>

      {isPaused && (
        <div className="mb-8 p-5 bg-[var(--ai-bg-subtle)] border border-[var(--ai-border-strong)] rounded-2xl">
          <p
            className="text-[11px] uppercase font-semibold text-[var(--ai-accent)] mb-2"
            style={{ letterSpacing: "0.18em" }}
          >
            ● Paused
          </p>
          <p className="text-sm text-[var(--ai-text)]">
            Your projects are paused until{" "}
            <strong>
              {new Date(pro.paused_until!).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
            . You won&apos;t receive any new projects during this period.
          </p>
        </div>
      )}

      <form action={updateAiPreferences} className="space-y-6">
        <input type="hidden" name="locale" value="en" />
        {/* Availability */}
        <fieldset>
          <legend
            className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
            style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Remote / hybrid availability
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RadioCard
              name="available_for_remote"
              value="true"
              label="100% remote OK"
              desc="You work from anywhere across Europe and beyond"
              defaultChecked={pro.available_for_remote === true}
            />
            <RadioCard
              name="available_for_remote"
              value="false"
              label="On-site only"
              desc="You work on the client's premises only"
              defaultChecked={pro.available_for_remote === false}
            />
          </div>
        </fieldset>

        {/* Minimum budget */}
        <div>
          <label
            htmlFor="min_budget"
            className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
            style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Minimum budget accepted (€)
          </label>
          <div className="relative">
            <input
              id="min_budget"
              name="min_budget"
              type="number"
              min={0}
              max={500000}
              step={500}
              defaultValue={pro.min_budget?.toString() || ""}
              placeholder="e.g. 2000"
              className="w-full h-12 pl-4 pr-16 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[var(--ai-text-tertiary)]">
              € excl. tax
            </span>
          </div>
          <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-1.5">
            Filters out projects below this threshold. Leave empty for no
            minimum.
          </p>
        </div>

        {/* Pause */}
        <div>
          <label
            htmlFor="paused_until"
            className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
            style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Pause until
          </label>
          <input
            id="paused_until"
            name="paused_until"
            type="date"
            defaultValue={
              pro.paused_until
                ? new Date(pro.paused_until).toISOString().split("T")[0]
                : ""
            }
            className="w-full sm:w-auto h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
          />
          <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-1.5">
            While paused, you receive no projects. Leave empty to receive
            projects normally.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
        >
          Save
        </button>
      </form>
    </div>
  );
}

function RadioCard({
  name,
  value,
  label,
  desc,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl cursor-pointer has-[:checked]:border-[var(--ai-text)] has-[:checked]:bg-[var(--ai-bg-subtle)] transition-all">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only peer"
      />
      <span className="text-sm font-semibold text-[var(--ai-text)]">{label}</span>
      <span className="text-[12px] text-[var(--ai-text-secondary)]">{desc}</span>
    </label>
  );
}
