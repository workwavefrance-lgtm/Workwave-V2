export default function AdminProjectDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-16 rounded mb-4" style={{ backgroundColor: "var(--admin-hover)" }} />
      <div className="h-6 w-40 rounded mb-6" style={{ backgroundColor: "var(--admin-hover)" }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl p-4 h-48" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }} />
          <div className="rounded-xl p-4 h-32" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }} />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl p-4 h-40" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }} />
          <div className="rounded-xl p-4 h-24" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }} />
        </div>
      </div>
    </div>
  );
}
