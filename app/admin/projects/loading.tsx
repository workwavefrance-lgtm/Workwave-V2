export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="h-7 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />

      {/* Search bar + filter pills */}
      <div className="flex gap-3 items-center">
        <div className="h-10 w-72 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
        <div className="h-8 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
        <div className="h-8 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
        <div className="h-8 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b" style={{ borderColor: "var(--admin-border)" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)", width: i === 0 ? "60%" : "80%" }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} className="grid grid-cols-6 gap-4 px-4 py-4 border-b last:border-0" style={{ borderColor: "var(--admin-border)" }}>
            {Array.from({ length: 6 }).map((_, col) => (
              <div key={col} className="h-4 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)", width: col === 0 ? "75%" : "60%" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
