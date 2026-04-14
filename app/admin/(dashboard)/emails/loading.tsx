export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div
        className="h-7 w-40 rounded animate-pulse"
        style={{ backgroundColor: "var(--admin-hover)" }}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-3"
            style={{
              backgroundColor: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div
              className="h-3 w-20 rounded animate-pulse"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
            <div
              className="h-8 w-16 rounded animate-pulse"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
          </div>
        ))}
      </div>

      {/* Campaign control + warm-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-4"
            style={{
              backgroundColor: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div
              className="h-5 w-36 rounded animate-pulse"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
            <div
              className="h-12 w-full rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
            <div
              className="h-10 w-32 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
          </div>
        ))}
      </div>

      {/* Logs table skeleton */}
      <div
        className="rounded-xl p-5 space-y-3"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div
          className="h-5 w-32 rounded animate-pulse"
          style={{ backgroundColor: "var(--admin-hover)" }}
        />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-full rounded-lg animate-pulse"
            style={{ backgroundColor: "var(--admin-hover)" }}
          />
        ))}
      </div>
    </div>
  );
}
