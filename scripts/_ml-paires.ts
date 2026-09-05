import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  // Nombre de couples (categorie, ville) ayant au moins 1 pro OUVERT : la page /[metier]/[ville] sert alors un 200.
  const { data, error } = await sb.rpc("exec_sql" as any, {}).select().limit(1).then(() => ({ data: null, error: "no rpc" }), () => ({ data: null, error: "no rpc" }));
  console.log("(rpc generique indisponible, on echantillonne)");
  // Echantillon : pour 400 fiches ouvertes tirees au hasard, la page ville existe-t-elle au sitemap ?
  const fs = await import("fs");
  const sm2 = new Set(fs.readFileSync("/tmp/sm2_villes.txt", "utf8").trim().split("\n"));
  const ids: number[] = []; for (let i = 0; i < 9000; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const lots: any[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await sb.from("pros").select("slug,etat_admin,categories(slug,vertical),cities(slug)")
      .in("id", ids.slice(i, i + 300)).eq("is_active", true).is("deleted_at", null).limit(300);
    lots.push(...(data || []));
  }
  const ouv = lots.filter((p: any) => p.etat_admin === "A" && p.categories?.vertical !== "tech" && p.cities?.slug);
  let dansSitemap = 0;
  for (const p of ouv as any[]) if (sm2.has(`/${p.categories.slug}/${p.cities.slug}`)) dansSitemap++;
  console.log(`fiches OUVERTES non-tech tirees : ${ouv.length}`);
  console.log(`  dont la page /[metier]/[ville] figure au sitemap : ${dansSitemap} (${(100*dansSitemap/ouv.length).toFixed(1)} %)`);
  console.log(`  dont la page ville N EST PAS au sitemap (donc invisible de Google) : ${ouv.length-dansSitemap} (${(100*(ouv.length-dansSitemap)/ouv.length).toFixed(1)} %)`);
}
main();
