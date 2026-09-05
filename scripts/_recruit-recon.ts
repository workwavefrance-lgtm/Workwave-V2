import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
/* eslint-disable @typescript-eslint/no-explicit-any */

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function countExact(build: (q: any) => any): Promise<number> {
  const q = build(sb.from("pros").select("id", { count: "exact", head: true }));
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count || 0;
}

(async () => {
  // 1. Catégories + verticaux
  const { data: cats } = await sb
    .from("categories")
    .select("id,slug,name,vertical");
  const catList = (cats || []) as any[];
  const slugById = new Map<number, string>(catList.map((c) => [c.id, c.slug]));
  const nameById = new Map<number, string>(catList.map((c) => [c.id, c.name]));
  const idBySlug = new Map<string, number>(catList.map((c) => [c.slug, c.id]));
  const verticals = [...new Set(catList.map((c) => c.vertical || "?"))];

  // 2. Compteurs globaux
  const totalActive = await countExact((q) =>
    q.eq("is_active", true).is("deleted_at", null)
  );
  const claimedActive = await countExact((q) =>
    q.eq("is_active", true).is("deleted_at", null).not("claimed_by_user_id", "is", null)
  );
  const foundedNull = await countExact((q) =>
    q.eq("is_active", true).is("deleted_at", null).is("founded_year", null)
  );
  const rgeNull = await countExact((q) =>
    q.eq("is_active", true).is("deleted_at", null).is("rge_number", null)
  );

  // 3. Compteurs par vertical
  const byVertical: Record<string, { catCount: number; pros: number }> = {};
  for (const v of verticals) {
    const ids = catList.filter((c) => (c.vertical || "?") === v).map((c) => c.id);
    const pros = await countExact((q) =>
      q.eq("is_active", true).is("deleted_at", null).in("category_id", ids)
    );
    byVertical[v] = { catCount: ids.length, pros };
  }

  // 4. Pros réclamés (peu nombreux → pull complet)
  const { data: claimedRows } = await sb
    .from("pros")
    .select("id,name,slug,phone,email,instagram,website,category_id,cities(name,latitude,longitude)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null);
  const claimed = (claimedRows || []) as any[];

  // 5. Projets récents (60j) = signal de demande
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data: projRows } = await sb
    .from("projects")
    .select("id,category_id,vertical,status,created_at,cities(name,latitude,longitude,departments(code,name))")
    .gte("created_at", since)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  const projects = (projRows || []) as any[];

  // 6. Demande par catégorie + par département, et reachability
  const demandByCat: Record<string, { leads: number; unreachable: number }> = {};
  const demandByDept: Record<string, number> = {};
  const gaps: any[] = [];
  for (const p of projects) {
    const catSlug = slugById.get(p.category_id) || "?";
    const catName = nameById.get(p.category_id) || catSlug;
    demandByCat[catName] = demandByCat[catName] || { leads: 0, unreachable: 0 };
    demandByCat[catName].leads++;
    const dept = p.cities?.departments?.code || "?";
    demandByDept[dept] = (demandByDept[dept] || 0) + 1;

    // reachable = un pro réclamé même catégorie/cluster à <=70km
    const cluster = CLUSTERS.find((c) => c.includes(catSlug)) || [catSlug];
    const clusterIds = cluster.map((s) => idBySlug.get(s)).filter(Boolean);
    let reachable = false;
    if (p.cities?.latitude) {
      reachable = claimed.some(
        (pr) =>
          clusterIds.includes(pr.category_id) &&
          pr.cities?.latitude &&
          km(p.cities.latitude, p.cities.longitude, pr.cities.latitude, pr.cities.longitude) <= RADIUS
      );
    }
    if (!reachable) {
      demandByCat[catName].unreachable++;
      gaps.push({
        id: p.id,
        cat: catName,
        catSlug,
        ville: p.cities?.name,
        dept,
        deptName: p.cities?.departments?.name,
        vertical: p.vertical,
      });
    }
  }

  // 7. Couverture réclamée par catégorie (combien de pros réclamés par métier)
  const claimedByCat: Record<string, number> = {};
  for (const pr of claimed) {
    const n = nameById.get(pr.category_id) || "?";
    claimedByCat[n] = (claimedByCat[n] || 0) + 1;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    totals: { totalActive, claimedActive, foundedNull, rgeNull },
    verticals: byVertical,
    catCountTotal: catList.length,
    recentProjects: projects.length,
    demandByCat: Object.fromEntries(
      Object.entries(demandByCat).sort((a, b) => b[1].leads - a[1].leads)
    ),
    demandByDept: Object.fromEntries(
      Object.entries(demandByDept).sort((a, b) => b[1] - a[1])
    ),
    claimedByCat,
    unreachableGaps: gaps,
    claimedPros: claimed.map((p) => ({
      name: p.name,
      cat: nameById.get(p.category_id),
      ville: p.cities?.name,
      hasInsta: !!p.instagram,
      hasWebsite: !!p.website,
      phone: p.phone || null,
    })),
  };

  const dir = process.env.SCRATCH || "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/1ffed803-73e1-4ceb-a29b-627a619b7230/scratchpad";
  fs.writeFileSync(path.join(dir, "recon.json"), JSON.stringify(out, null, 2));

  // ── Résumé humain ──
  console.log("\n════════ RECON RECRUTEMENT (toutes catégories) ════════");
  console.log(`Pros actifs total     : ${totalActive.toLocaleString("fr-FR")}`);
  console.log(`Pros RÉCLAMÉS actifs   : ${claimedActive}  (${((claimedActive / totalActive) * 100).toFixed(4)}%)`);
  console.log(`Fiches SANS founded_year : ${foundedNull.toLocaleString("fr-FR")}  (opportunité enrichissement)`);
  console.log(`Fiches SANS RGE (rge_number null) : ${rgeNull.toLocaleString("fr-FR")}`);
  console.log(`Catégories en base : ${catList.length}  ·  verticaux : ${verticals.join(", ")}`);
  console.log(`\n── Pros par vertical ──`);
  for (const [v, d] of Object.entries(byVertical))
    console.log(`  ${v.padEnd(14)} : ${d.pros.toLocaleString("fr-FR").padStart(10)} pros · ${d.catCount} cat.`);

  console.log(`\n── DEMANDE : ${projects.length} projets sur 60j, par métier ──`);
  for (const [cat, d] of Object.entries(out.demandByCat))
    console.log(`  ${cat.padEnd(22)} : ${String(d.leads).padStart(3)} leads · ${d.unreachable} SANS pro réclamé joignable · ${claimedByCat[cat] || 0} pro(s) réclamé(s)`);

  console.log(`\n── DEMANDE par département (top 12) ──`);
  Object.entries(out.demandByDept).slice(0, 12).forEach(([d, n]) => console.log(`  ${d} : ${n} leads`));

  console.log(`\n── LEADS SANS PRO RÉCLAMÉ JOIGNABLE (à recruter, lead en main) : ${gaps.length} ──`);
  gaps.slice(0, 30).forEach((g) => console.log(`  #${g.id} ${g.cat} @ ${g.ville} (${g.dept} ${g.deptName || ""})`));
  if (gaps.length > 30) console.log(`  … +${gaps.length - 30} autres`);

  console.log(`\n── PROS RÉCLAMÉS (${claimed.length}) ──`);
  out.claimedPros.forEach((p) => console.log(`  ${p.name} · ${p.cat} · ${p.ville} · insta:${p.hasInsta ? "oui" : "non"} · site:${p.hasWebsite ? "oui" : "non"}`));

  console.log(`\n✅ JSON complet → scratchpad/recon.json`);
})().catch((e) => console.error("ERR", e.message));
