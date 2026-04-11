export default function AdminTableSkeleton({
  rows = 8,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div
        className="flex gap-3 px-3 py-2.5"
        style={{ borderBottom: "1px solid var(--admin-border)" }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded"
            style={{
              backgroundColor: "var(--admin-hover)",
              width: i === 0 ? "20%" : `${60 / (cols - 1)}%`,
            }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-3 px-3 py-3"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3.5 rounded"
              style={{
                backgroundColor: "var(--admin-hover)",
                width: c === 0 ? "20%" : `${60 / (cols - 1)}%`,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
