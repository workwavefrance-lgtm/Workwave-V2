import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { AI_CATEGORY_IDS } from "../lib/ai/helpers";

const sb = getServiceClient();
const AI = (AI_CATEGORY_IDS as unknown as number[]).join(",");

async function c(label: string, build: () => any) {
  const t = Date.now();
  const { count, error } = await build();
  console.log(label.padEnd(46), error ? "ERREUR " + error.message : count, `(${Date.now() - t} ms)`);
  return count as number | null;
}

(async () => {
  const total = await c("TOTAL actives", () =>
    sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null));
  const fermes = await c("dont etat_admin = F", () =>
    sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "F"));
  const nulls = await c("dont etat_admin NULL (non classees)", () =>
    sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).is("etat_admin", null));
  const btpTot = await c("BTP (hors cat tech) total", () =>
    sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${AI})`));
  const btpF = await c("BTP fermees", () =>
    sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${AI})`).eq("etat_admin", "F"));
  if (total && fermes) console.log("\npart fermees globale :", ((fermes / total) * 100).toFixed(1), "%");
  if (btpTot && btpF) console.log("part fermees BTP     :", ((btpF / btpTot) * 100).toFixed(1), "%");
})();
