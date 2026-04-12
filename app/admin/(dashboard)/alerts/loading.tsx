export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="h-7 w-40 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />

      {/* Alert cards list */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-5 flex items-start gap-4" style={{ borderColor: "var(--admin-border)", backgroundColor: "var(--admin-card)" }}>
            {/* Icon placeholder */}
            <div className="h-10 w-10 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
              <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
            </div>
            {/* Badge placeholder */}
            <div className="h-6 w-16 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: "var(--admin-hover)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
