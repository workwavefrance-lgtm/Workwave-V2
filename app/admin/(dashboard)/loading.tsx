export default function AdminOverviewLoading() {
  return (
    <div className="animate-pulse">
      {/* Title */}
      <div
        className="h-5 w-32 rounded mb-6"
        style={{ backgroundColor: "var(--admin-hover)" }}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4 h-28"
            style={{
              backgroundColor: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div
              className="h-3 w-24 rounded mb-4"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
            <div
              className="h-8 w-20 rounded"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
          </div>
        ))}
      </div>

      {/* Activity */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div
          className="h-4 w-40 rounded mb-4"
          style={{ backgroundColor: "var(--admin-hover)" }}
        />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-3"
            style={{ borderBottom: "1px solid var(--admin-border)" }}
          >
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: "var(--admin-hover)" }}
            />
            <div className="flex-1">
              <div
                className="h-3 w-48 rounded mb-2"
                style={{ backgroundColor: "var(--admin-hover)" }}
              />
              <div
                className="h-2.5 w-24 rounded"
                style={{ backgroundColor: "var(--admin-hover)", opacity: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
