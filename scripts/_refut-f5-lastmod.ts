import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { AI_CATEGORY_IDS } from "../lib/ai/helpers";

async function main() {
  const sb = getServiceClient();
  const ai = (AI_CATEGORY_IDS as unknown as number[]).join(",");
  // Reproduit exactement la requete du sitemap batch 0 (= /sitemap/100.xml)
  const rows: { updated_at: string; claimed_by_user_id: string | null; etat_admin: string | null }[] = [];
  let lastId = -1;
  while (rows.length < 45000) {
    const { data: ids, error: e1 } = await sb
      .from("pros").select("id")
      .eq("is_active", true).is("deleted_at", null)
      .gt("id", lastId)
      .not("category_id", "in", `(${ai})`)
      .order("id", { ascending: true }).limit(1000);
    if (e1) throw e1;
    if (!ids || ids.length === 0) break;
    const liste = ids.map((r: any) => r.id);
    const { data, error: e2 } = await sb
      .from("pros").select("id, updated_at, claimed_by_user_id, etat_admin")
      .in("id", liste).order("id", { ascending: true });
    if (e2) throw e2;
    rows.push(...((data || []) as any[]));
    lastId = liste[liste.length - 1];
  }
  const parJour = new Map<string, number>();
  let claimed = 0, fermes = 0;
  for (const r of rows) {
    const j = (r.updated_at || "").slice(0, 10);
    parJour.set(j, (parJour.get(j) || 0) + 1);
    if (r.claimed_by_user_id) claimed++;
    if (r.etat_admin === "F") fermes++;
  }
  console.log("fiches lues (batch 0 non-tech) :", rows.length);
  console.log("updated_at distincts (jour) :", parJour.size);
  console.log("top jours :");
  [...parJour.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    .forEach(([j, n]) => console.log("  ", j, n, `(${((n / rows.length) * 100).toFixed(2)}%)`));
  console.log("reclamees dans ce lot :", claimed);
  console.log("fermees (etat_admin=F) dans ce lot :", fermes, `(${((fermes / rows.length) * 100).toFixed(1)}%)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
