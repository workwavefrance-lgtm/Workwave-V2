import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

export type LeaConversationRow = {
  id: number;
  conversation_id: string;
  flags: string[];
  pathname: string | null;
  transcript: string;
  message_count: number;
  ticket_id: number | null;
  reviewed_at: string | null;
  created_at: string;
};

export type LeaJournalFilters = {
  /** Motif à isoler, ou "" pour tout, ou "todo" pour les non relues. */
  flag: string;
  page: number;
  pageSize: number;
};

export const getLeaConversations = cache(
  async (
    f: LeaJournalFilters
  ): Promise<{ data: LeaConversationRow[]; count: number; totalPages: number }> => {
    const db = getAdminServiceClient();
    // count "exact" assumé : cette table reste petite par construction (on ne
    // conserve que les conversations à risque plus un échantillon de 3 %), et
    // elle est purgée à 90 jours.
    let q = db
      .from("lea_conversations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (f.flag === "todo") q = q.is("reviewed_at", null);
    else if (f.flag) q = q.contains("flags", [f.flag]);

    const from = (f.page - 1) * f.pageSize;
    const { data, count, error } = await q.range(from, from + f.pageSize - 1);
    if (error) {
      console.error("[admin/lea-journal]", error.message);
      return { data: [], count: 0, totalPages: 1 };
    }
    const total = count ?? 0;
    return {
      data: (data || []) as unknown as LeaConversationRow[],
      count: total,
      totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
    };
  }
);

/** Compteurs par motif, pour les onglets. */
export const getLeaFlagCounts = cache(async (): Promise<Record<string, number>> => {
  const db = getAdminServiceClient();
  const flags = [
    "juridique",
    "remboursement",
    "colere",
    "donnees",
    "refus",
    "escalade",
    "echantillon",
  ];
  const [todo, total, ...parFlag] = await Promise.all([
    db.from("lea_conversations").select("*", { count: "exact", head: true }).is("reviewed_at", null),
    db.from("lea_conversations").select("*", { count: "exact", head: true }),
    ...flags.map((fl) =>
      db.from("lea_conversations").select("*", { count: "exact", head: true }).contains("flags", [fl])
    ),
  ]);
  const out: Record<string, number> = {
    todo: todo.count ?? 0,
    "": total.count ?? 0,
  };
  flags.forEach((fl, i) => {
    out[fl] = parFlag[i].count ?? 0;
  });
  return out;
});
