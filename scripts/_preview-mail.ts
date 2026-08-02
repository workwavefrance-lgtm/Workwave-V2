/**
 * Genere le HTML d'un email de broadcast/relance a partir d'un VRAI projet, et
 * l'ecrit dans un fichier a ouvrir dans le navigateur. N'ENVOIE RIEN.
 *
 *   npx tsx scripts/_preview-mail.ts 157 j1
 */
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { buildEmailHtml } from "@/lib/email/broadcast-btp-project";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const id = Number(process.argv[2] || 157);
const kind = (process.argv[3] as "j1" | "j3" | undefined) ?? "j1";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  const { data: p } = await sb
    .from("projects")
    .select("id, description, budget, urgency, suspicion_score, category_id, city_id")
    .eq("id", id)
    .single();
  if (!p) throw new Error("projet introuvable");
  const [{ data: cat }, { data: cit }] = await Promise.all([
    sb.from("categories").select("id,name").eq("id", p.category_id).single(),
    sb.from("cities").select("id,name,postal_code,department_id").eq("id", p.city_id).single(),
  ]);
  const html = buildEmailHtml(
    {
      projectId: p.id,
      projectTitle: (p.description || "").split("\n")[0].slice(0, 100) || "Projet",
      projectDescription: p.description || "",
      projectBudget: p.budget,
      projectTimeline: p.urgency,
      projectCategoryName: cat!.name,
      projectCategoryId: cat!.id,
      projectCityName: cit!.name,
      projectCityId: cit!.id,
      projectDepartmentId: cit!.department_id,
      isSuspicious: (p.suspicion_score ?? 0) >= 50,
      relanceKind: kind,
    },
    "https://workwave.fr",
    cit!.postal_code
  );
  const out = path.resolve(process.env.HOME || ".", `Desktop/apercu-mail-${kind}-projet-${id}.html`);
  fs.writeFileSync(out, html);
  console.log(`\n  Apercu ecrit : ${out}`);
  console.log(`  Projet #${id} · ${cat!.name} a ${cit!.name} · relance ${kind}\n`);
}
main().catch((e) => { console.error("ERREUR", e.message); process.exit(1); });
