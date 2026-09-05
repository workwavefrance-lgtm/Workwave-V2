import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
getServiceClient().rpc("classer_etats_lot", { lot: [], verifie_at: new Date().toISOString() }).then(({ data, error }) => console.log(error ? "RPC ABSENTE : " + error.message : "RPC presente, retour " + data));
