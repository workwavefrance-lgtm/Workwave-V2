export default function AdminChartSkeleton({
  height = 280,
}: {
  height?: number;
}) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full flex items-end gap-2 px-4 pb-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              backgroundColor: "var(--admin-hover)",
              height: `${20 + Math.random() * 60}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
