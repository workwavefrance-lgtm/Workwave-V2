export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="h-7 w-40 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />

      {/* Timeline */}
      <div className="relative space-y-0 pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px" style={{ backgroundColor: "var(--admin-border)" }} />

        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="relative pb-6">
            {/* Dot */}
            <div className="absolute -left-5 top-1 h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
            <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
              <div className="flex items-center gap-3">
                <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
                <div className="h-5 w-16 rounded-full animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
              </div>
              <div className="h-4 w-2/3 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
