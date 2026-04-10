import ProCardSkeleton from "@/components/pro/ProCardSkeleton";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Breadcrumb skeleton */}
      <div className="h-4 skeleton rounded-lg w-48 mb-8" />
      {/* Title skeleton */}
      <div className="mb-10">
        <div className="h-9 skeleton rounded-lg w-80 mb-3" />
        <div className="h-5 skeleton rounded-lg w-40" />
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <ProCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
