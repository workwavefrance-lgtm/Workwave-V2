export default function AdminProDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-16 rounded mb-4" style={{ backgroundColor: "var(--admin-hover)" }} />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "var(--admin-hover)" }} />
        <div>
          <div className="h-5 w-48 rounded mb-2" style={{ backgroundColor: "var(--admin-hover)" }} />
          <div className="h-4 w-20 rounded" style={{ backgroundColor: "var(--admin-hover)" }} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-4 h-64" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }} />
        <div className="space-y-4">
          <div className="rounded-xl p-4 h-32" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }} />
          <div className="rounded-xl p-4 h-28" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }} />
        </div>
      </div>
    </div>
  );
}
