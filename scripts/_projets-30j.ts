/**
 * Projets des 30 derniers jours, SANS aucune donnee personnelle, pour les reels
 * de motivation des pros. Sortie : marketing/projets/projets-30j.json
 */
import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const URGENCES: Record<string, string> = { today: "Aujourd'hui", this_week: "Cette semaine", this_month: "Ce mois-ci", flexible: "Pas pressé" };
(async () => {
  const depuis = new Date(Date.now() - 30 * 86400e3).toISOString();
  const { data, error } = await sb.from("projects")
    .select("id, created_at, urgency, budget, description, cleaned_description, has_contact_in_description, status, vertical, categories(name, slug), cities(name, departments(name, code))")
    .gte("created_at", depuis).not("status", "in", "(deleted,suspicious)").order("created_at", { ascending: false });
  if (error) { console.error(error.message); process.exit(1); }
  const rows = (data || []).map((p: any) => ({
    id: p.id, date: p.created_at.slice(0, 10), vertical: p.vertical,
    metier: p.categories?.name, metier_slug: p.categories?.slug,
    ville: p.cities?.name, dept: p.cities?.departments ? `${p.cities.departments.name} (${p.cities.departments.code})` : null,
    urgence: URGENCES[p.urgency] || p.urgency, budget: p.budget || null,
    description: (p.has_contact_in_description && p.cleaned_description ? p.cleaned_description : p.description || "").replace(/\s+/g, " ").trim(),
  }));
  fs.writeFileSync("marketing/projets/projets-30j.json", JSON.stringify(rows, null, 2));
  const parVertical: Record<string, number> = {}; for (const r of rows) parVertical[r.vertical] = (parVertical[r.vertical] || 0) + 1;
  console.log(`${rows.length} projets sur 30 jours`, parVertical); for (const r of rows.slice(0, 5)) console.log(`  ${r.date} ${r.metier} · ${r.ville} · ${r.urgence} · ${r.description.slice(0, 70)}`);
})();
