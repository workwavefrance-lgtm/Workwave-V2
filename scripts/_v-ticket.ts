import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const ID = Number(process.argv[2] || 89);
(async () => {
  const { data: t, error } = await sb.from("support_tickets").select("*").eq("id", ID).maybeSingle();
  if (error) { console.log("  echec :", error.message); return; }
  if (!t) { console.log(`  ticket ${ID} introuvable`); return; }
  const x = t as any;
  console.log(`  TICKET #${x.id} · ${x.status} · ${x.source}`);
  console.log(`  sujet      : ${x.subject}`);
  console.log(`  demandeur  : ${x.requester_name || "(sans nom)"} <${x.requester_email}>`);
  console.log(`  pro_id     : ${x.pro_id ?? "aucun"}   projet : ${x.project_id ?? "aucun"}`);
  console.log(`  categorie  : ${x.category ?? "non triee"}   priorite : ${x.priority}   juridique : ${x.is_legal}`);
  console.log(`  cree       : ${String(x.created_at).slice(0,16)}   dernier msg : ${String(x.last_message_at).slice(0,16)}`);
  console.log(`  1re reponse: ${x.first_response_at ? String(x.first_response_at).slice(0,16) : "JAMAIS REPONDU"}`);
  console.log(`  admin averti : ${x.admin_notified_at ? String(x.admin_notified_at).slice(0,16) : "NON"}${x.admin_notification_error ? " · erreur : " + x.admin_notification_error : ""}`);

  if (x.pro_id) {
    const { data: p } = await sb.from("pros").select("name, slug, email, phone, city_id, claimed_by_user_id, cover_url, logo_url, photos")
      .eq("id", x.pro_id).maybeSingle();
    const q = p as any;
    if (q) {
      console.log(`\n  LE PRO : ${q.name}  (/artisan/${q.slug})`);
      console.log(`    reclamee : ${q.claimed_by_user_id ? "OUI" : "non"}   logo : ${q.logo_url ? "oui" : "non"}   couverture : ${q.cover_url ? "oui" : "non"}   photos : ${Array.isArray(q.photos) ? q.photos.length : 0}`);
    }
  }

  const { data: m } = await sb.from("support_messages").select("*").eq("ticket_id", ID).order("created_at");
  console.log(`\n  ${(m||[]).length} MESSAGE(S)`);
  for (const msg of (m || []) as any[]) {
    console.log(`\n  ── ${msg.author_role}${msg.is_internal ? " (note interne)" : ""} · ${String(msg.created_at).slice(0,16)}`);
    console.log("  " + String(msg.body).replace(/\n/g, "\n  ").slice(0, 2600));
  }
})();
