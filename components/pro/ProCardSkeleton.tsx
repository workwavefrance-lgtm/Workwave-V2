export default function ProCardSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 skeleton rounded-lg w-3/4" />
          <div className="h-5 skeleton rounded-full w-20" />
          <div className="h-4 skeleton rounded-lg w-1/2" />
          <div className="h-4 skeleton rounded-lg w-2/3" />
        </div>
      </div>
    </div>
  );
}
