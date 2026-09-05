import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const sb = getServiceClient();

async function main() {
  const { data: cats } = await sb.from("categories").select("id,slug").in("slug", ["plombier", "electricien", "menuisier", "macon", "peintre"]);
  console.log("cats", cats);
  const { data: depts } = await sb.from("departments").select("id,code,name").in("code", ["75", "69", "13", "59", "33", "31", "06", "44", "23", "86"]);
  console.log("depts", depts);
}
main();
