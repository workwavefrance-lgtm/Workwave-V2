export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="h-7 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
            <div className="h-5 w-36 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
            <div className="h-48 w-full rounded-xl animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
          </div>
        ))}
      </div>

      {/* Funnel skeleton */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
        <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
        <div className="flex flex-col items-center gap-2 py-4">
          {[100, 80, 60, 40, 24].map((w, i) => (
            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--admin-hover)", width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
