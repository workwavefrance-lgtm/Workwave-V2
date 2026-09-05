import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
/* eslint-disable @typescript-eslint/no-explicit-any */

function km(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371,
    r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(bLat - aLat),
    dLng = r(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

const CLUSTERS = [["plombier", "chauffagiste", "climaticien"]];
const RADIUS = 70;
const TECH = [
  "intelligence-artificielle", "developpement-web", "cloud-devops",
  "no-code-automation", "data-analytics", "design-produit",
  "marketing-communication", "strategie-management", "finance-comptabilite",
  "juridique-conseil", "rh-recrutement", "redaction-copywriting",
  "audiovisuel-medias", "design-creation",
];

(async () => {
  const { data: cats } = await sb.from("categories").select("id,slug,name");
  const slugById = new Map<number, string>();
  const nameById = new Map<number, string>();
  const idBySlug = new Map<string, number>();
  for (const c of (cats || []) as any[]) {
    slugById.set(c.id, c.slug);
    nameById.set(c.id, c.name);
    idBySlug.set(c.slug, c.id);
  }

  const { data: pros } = await sb
    .from("pros")
    .select("id,name,phone,email,category_id,cities(name,latitude,longitude)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null);
  const claimed = ((pros || []) as any[]).filter((p) => {
    const s = slugById.get(p.category_id);
    return s && !TECH.includes(s);
  });
  console.log(`Pros claimed BTP chargés : ${claimed.length}`);

  const since = new Date(Date.now() - 16 * 864e5).toISOString();
  const { data: projects } = await sb
    .from("projects")
    .select(
      "id,first_name,email,phone,description,budget,urgency,status,ai_qualification,category_id,cities(name,latitude,longitude,departments(code))"
    )
    .eq("vertical", "btp")
    .gte("created_at", since)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  const gaps: string[] = [];
  for (const p of (projects || []) as any[]) {
    const susp = p.ai_qualification?.suspicion_score ?? 0;
    if (susp > 70) continue;
    const city = p.cities;
    if (!city?.latitude) continue;
    const catSlug = slugById.get(p.category_id) || "?";
    const cluster = CLUSTERS.find((c) => c.includes(catSlug)) || [catSlug];
    const clusterIds = cluster.map((s) => idBySlug.get(s)).filter(Boolean);
    const matches = claimed
      .filter(
        (pr) =>
          clusterIds.includes(pr.category_id) &&
          pr.cities?.latitude &&
          km(city.latitude, city.longitude, pr.cities.latitude, pr.cities.longitude) <= RADIUS
      )
      .map((pr) => ({
        ...pr,
        dist: km(city.latitude, city.longitude, pr.cities.latitude, pr.cities.longitude),
      }))
      .sort((a, b) => a.dist - b.dist);
    const dept = city.departments?.code || "";
    const desc = (p.description || "").split(/\n\n+/)[0].slice(0, 75);
    if (matches.length === 0) {
      gaps.push(`#${p.id} ${nameById.get(p.category_id)} @ ${city.name} (${dept}) · client ${p.first_name} · ${p.phone || p.email || "-"}`);
      continue;
    }
    console.log(`\n━━━ #${p.id} ${nameById.get(p.category_id)} @ ${city.name} (${dept}) ${susp >= 30 ? "⚠️susp" + susp : ""} ━━━`);
    console.log(`  CLIENT ${p.first_name} · ${p.phone || "-"} · ${p.email || "-"}`);
    console.log(`  « ${desc} »`);
    console.log(`  → PROS À CONTACTER (livre-leur le client, 1er offert) :`);
    for (const m of matches)
      console.log(`     • ${m.name} · ${m.phone || "-"} · ${m.email || "-"} · ${m.cities.name} (${m.dist}km)`);
  }

  console.log(`\n\n═══ ZONES SANS PRO CLAIMED (recruter avec le lead en main) ═══`);
  gaps.forEach((g) => console.log("  " + g));
})().catch((e) => console.error("ERR", e.message));
