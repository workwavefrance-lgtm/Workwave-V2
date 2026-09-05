import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* eslint-disable @typescript-eslint/no-explicit-any */
(async () => {
  const since = new Date(Date.now() - 14 * 864e5).toISOString();

  const { data: projects } = await sb
    .from("projects")
    .select(
      "id, created_at, status, broadcast_count, broadcasted_at, category_id, cities(name, departments(code)), categories(name)"
    )
    .eq("vertical", "btp")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const P = (projects || []) as any[];
  console.log(`\n=== ${P.length} projets BTP sur 14 jours ===`);
  let reachedSome = 0,
    reached0 = 0,
    notBroadcast = 0;
  for (const p of P) {
    const bc = p.broadcast_count;
    const city = p.cities?.name || "?";
    const dept = p.cities?.departments?.code || "";
    const cat = p.categories?.name || "?";
    if (bc == null && !p.broadcasted_at) notBroadcast++;
    else if (!bc || bc === 0) reached0++;
    else reachedSome++;
    console.log(
      `  #${p.id} ${String(p.created_at).slice(0, 10)}  ${cat} @ ${city} (${dept})  → touché ${bc ?? "?"} pro(s)  [${p.status}]`
    );
  }
  console.log(
    `\nREACH : ${reachedSome} projets ont touché ≥1 pro réclamé · ${reached0} ont touché 0 pro · ${notBroadcast} jamais broadcastés`
  );

  const { count: unlocksTotal } = await sb
    .from("lead_unlocks")
    .select("*", { count: "exact", head: true });
  const { count: unlocks14 } = await sb
    .from("lead_unlocks")
    .select("*", { count: "exact", head: true })
    .gte("paid_at", since);
  console.log(
    `\n=== DÉBLOCAGES PAYÉS : ${unlocksTotal} au total · ${unlocks14} sur 14j ===`
  );

  const { count: claimedBtp } = await sb
    .from("pros")
    .select("*", { count: "exact", head: true })
    .not("category_id", "in", `(${AI_CATEGORY_IDS.join(",")})`)
    .not("claimed_by_user_id", "is", null)
    .eq("is_active", true)
    .is("deleted_at", null);
  console.log(`\nPros BTP RÉCLAMÉS (les seuls qui peuvent payer) : ${claimedBtp}`);
})().catch((e) => console.error("ERR", e.message));
