import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data } = await sb.from("projects")
    .select("id, first_name, email, phone, description, cleaned_description, has_contact_in_description, urgency, budget, status, suspicion_score, ai_qualification, broadcast_count, broadcasted_at, admin_notified_at, admin_notification_error, deletion_token, created_at, categories(name), cities(name, postal_code)")
    .order("created_at", { ascending: false }).limit(1);
  const p = (data || [])[0] as any;
  if (!p) { console.log("Aucun projet trouve"); process.exit(1); }
  console.log("=== DERNIER PROJET (le test) ===");
  console.log("id                    :", p.id);
  console.log("prenom / email / tel  :", p.first_name, "/", p.email, "/", p.phone);
  console.log("metier / ville        :", p.categories?.name, "/", p.cities?.name, `(${p.cities?.postal_code})`);
  console.log("urgence / budget      :", p.urgency, "/", p.budget);
  console.log("statut                :", p.status);
  console.log("cree le               :", p.created_at);
  console.log("");
  console.log("--- Traitements automatiques ---");
  console.log("qualification IA      :", p.ai_qualification ? "OUI" : "NON ❌");
  if (p.ai_qualification) {
    const q = p.ai_qualification;
    console.log("   resume             :", q.summary);
    console.log("   categorie suggeree :", q.suggested_category, "| match:", q.category_match);
    console.log("   urgence reelle     :", q.real_urgency);
    console.log("   budget realiste    :", q.budget_realistic, "|", q.budget_comment);
    console.log("   mots-cles          :", (q.keywords||[]).join(", "));
    console.log("   score suspicion    :", q.suspicion_score);
  }
  console.log("PII nettoyee (desc)   :", p.has_contact_in_description ? "contact detecte -> masque" : "aucun contact dans la description");
  console.log("broadcast_count       :", p.broadcast_count, p.broadcast_count === 0 ? "✅ (0 artisan touche, comme prevu)" : "⚠️ DES PROS ONT ETE EMAILES");
  console.log("broadcasted_at        :", p.broadcasted_at);
  console.log("notif admin envoyee   :", p.admin_notified_at ? "OUI ✅ " + p.admin_notified_at : "NON ❌");
  console.log("erreur notif          :", p.admin_notification_error ?? "aucune");
  console.log("token suppression RGPD:", p.deletion_token ? "present ✅" : "absent ❌");
  const { data: leads } = await sb.from("project_leads").select("id").eq("project_id", p.id);
  const { data: unlocks } = await sb.from("lead_unlocks").select("id").eq("project_id", p.id);
  const { data: evts } = await sb.from("events").select("id").eq("project_id", p.id);
  console.log("");
  console.log("--- Enfants (a supprimer avec) ---");
  console.log("project_leads :", (leads||[]).length, "| lead_unlocks :", (unlocks||[]).length, "| events :", (evts||[]).length);
})();
