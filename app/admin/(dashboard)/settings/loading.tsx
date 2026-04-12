export default function Loading() {
  const field = (labelW: string, inputW = "w-full") => (
    <div className="space-y-2">
      <div className={`h-3 ${labelW} rounded animate-pulse`} style={{ backgroundColor: "var(--admin-hover)" }} />
      <div className={`h-10 ${inputW} rounded-xl animate-pulse`} style={{ backgroundColor: "var(--admin-hover)" }} />
    </div>
  );

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* Title */}
      <div className="h-7 w-40 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />

      {/* Form card */}
      <div className="rounded-2xl border p-6 space-y-5" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
        <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
        {field("w-28")}
        {field("w-36")}
        {field("w-24")}
      </div>

      <div className="rounded-2xl border p-6 space-y-5" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
        <div className="h-5 w-40 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
        {field("w-32")}
        {field("w-28")}
        {/* Save button */}
        <div className="h-10 w-28 rounded-xl animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
      </div>
    </div>
  );
}
