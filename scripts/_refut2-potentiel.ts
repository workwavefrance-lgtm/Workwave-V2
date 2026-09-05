import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data } = await sb.from("projects").select("id,status,created_at,email,broadcast_count");
  const rows = (data || []) as any[];
  const il7 = new Date(Date.now() - 7*864e5).toISOString();
  const closed = rows.filter(r => r.status === "closed" && r.email && r.created_at < il7);
  const newOld = rows.filter(r => r.status === "new" && r.email && r.created_at < il7);
  const diffuses = rows.filter(r => (r.broadcast_count ?? 0) > 0 && r.email && r.created_at < il7 && r.status !== "deleted");
  console.log("projets 'closed' >7j avec email :", closed.length);
  console.log("projets 'new' >7j avec email :", newOld.length);
  console.log("projets REELLEMENT diffuses (broadcast_count>0) >7j, non supprimes :", diffuses.length);
  console.log("=> plafond ABSOLU de demandes d'avis envoyables aujourd'hui :", diffuses.length);
})();
