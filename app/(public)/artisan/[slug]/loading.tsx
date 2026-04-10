export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="h-4 skeleton rounded-lg w-64 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-8">
          {/* En-tete */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full skeleton shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-8 skeleton rounded-lg w-64" />
              <div className="h-6 skeleton rounded-full w-28" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 skeleton rounded-lg w-24" />
            <div className="h-4 skeleton rounded-lg w-full" />
            <div className="h-4 skeleton rounded-lg w-full" />
            <div className="h-4 skeleton rounded-lg w-3/4" />
          </div>

          {/* Cards info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 space-y-2"
              >
                <div className="h-3 skeleton rounded-lg w-16" />
                <div className="h-4 skeleton rounded-lg w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 space-y-3">
            <div className="h-5 skeleton rounded-lg w-40 mx-auto" />
            <div className="h-11 skeleton rounded-full w-full" />
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 space-y-4">
            <div className="h-3 skeleton rounded-lg w-12" />
            <div className="h-4 skeleton rounded-lg w-36" />
            <div className="h-3 skeleton rounded-lg w-20" />
            <div className="h-4 skeleton rounded-lg w-28" />
          </div>
        </div>
      </div>
    </main>
  );
}
