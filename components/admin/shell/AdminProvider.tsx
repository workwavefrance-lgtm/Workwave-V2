"use client";

import { createContext, useContext, useState } from "react";
import type { Admin } from "@/lib/types/admin";

type AdminContextType = {
  admin: Admin;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export default function AdminProvider({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AdminContext.Provider
      value={{ admin, sidebarCollapsed, setSidebarCollapsed }}
    >
      {children}
    </AdminContext.Provider>
  );
}
