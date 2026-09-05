import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { AI_CATEGORY_IDS } from "../lib/ai/helpers";

// Compare le SELECT actuel du sitemap au SELECT elargi qu'exigerait l'action proposee
// (etat_admin pour la graduation ouverte/fermee, description pour "enrichie").
async function page(sb: any, ai: string, lastId: number, cols: string) {
  const t0 = Date.now();
  const { data: ids, error: e1 } = await sb.from("pros").select("id")
    .eq("is_active", true).is("deleted_at", null).gt("id", lastId)
    .not("category_id", "in", `(${ai})`).order("id", { ascending: true }).limit(1000);
  if (e1) throw new Error("ids: " + e1.message);
  const liste = (ids || []).map((r: any) => r.id);
  if (!liste.length) return { ms: -1, n: 0 };
  const { error: e2 } = await sb.from("pros").select(cols)
    .in("id", liste).order("id", { ascending: true });
  if (e2) throw new Error("lignes: " + e2.message);
  return { ms: Date.now() - t0, n: liste.length, last: liste[liste.length - 1] };
}

async function main() {
  const sb = getServiceClient();
  const ai = (AI_CATEGORY_IDS as unknown as number[]).join(",");
  const ACTUEL = "slug, updated_at, claimed_by_user_id, id";
  const ELARGI = "slug, updated_at, claimed_by_user_id, id, etat_admin, description";
  for (const [nom, cols] of [["ACTUEL ", ACTUEL], ["ELARGI ", ELARGI]] as const) {
    let lastId = -1; const temps: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = await page(sb, ai, lastId, cols);
      if (r.ms < 0) break;
      temps.push(r.ms); lastId = r.last as number;
    }
    const tot = temps.reduce((a, b) => a + b, 0);
    console.log(nom, `10 pages x1000 : total ${tot} ms, moyenne ${Math.round(tot / temps.length)} ms/page, max ${Math.max(...temps)} ms`);
    console.log("       extrapolation 45 pages (1 sous-sitemap) :", Math.round((tot / temps.length) * 45 / 1000), "s");
  }
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
