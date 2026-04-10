"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProWithRelations } from "@/lib/types/database";

type DashboardUser = {
  id: string;
  email: string;
};

type DashboardContextValue = {
  pro: ProWithRelations;
  user: DashboardUser;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}

export default function DashboardProvider({
  pro,
  user,
  children,
}: {
  pro: ProWithRelations;
  user: DashboardUser;
  children: ReactNode;
}) {
  return (
    <DashboardContext.Provider value={{ pro, user }}>
      {children}
    </DashboardContext.Provider>
  );
}
