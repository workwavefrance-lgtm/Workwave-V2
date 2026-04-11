export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="h-7 w-48 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />

      {/* 5 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-6 space-y-3" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
            <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
            <div className="h-8 w-28 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
            <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
        <div className="h-5 w-40 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
        <div className="h-64 w-full rounded-xl animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
      </div>
    </div>
  );
}
