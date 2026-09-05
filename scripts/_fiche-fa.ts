import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
getServiceClient().from("pros").select("slug").eq("is_active", true).is("deleted_at", null).eq("etat_admin", "F").eq("entreprise_etat", "A").gte("id", 1000000).limit(2).then(({ data }) => console.log((data || []).map((p) => p.slug).join(" ")));
