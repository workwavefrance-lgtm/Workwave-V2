import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data } = await sb.from("projects").select("status,review_requested_at,created_at,email");
  const rows = (data || []) as any[];
  const parStatut: Record<string, number> = {};
  for (const r of rows) parStatut[r.status ?? "null"] = (parStatut[r.status ?? "null"] ?? 0) + 1;
  console.log("projets par statut :", parStatut);
  const il7 = new Date(Date.now() - 7*864e5).toISOString();
  const elig = rows.filter(r => r.status === "routed" && !r.review_requested_at && r.email && r.created_at < il7);
  console.log("projets ELIGIBLES au cron review-requests (routed, >7j, non sollicites, email) :", elig.length);
  console.log("projets deja sollicites (review_requested_at non nul) :", rows.filter(r=>r.review_requested_at).length);
})();
