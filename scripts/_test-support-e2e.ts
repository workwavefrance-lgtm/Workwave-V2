/**
 * TEST BOUT EN BOUT DU SUPPORT (prod) — envoie un VRAI email vers contact@workwave.fr
 * et vérifie que toute la chaîne se déclenche :
 *
 *   email → MX Resend Receiving → webhook /api/resend/inbound → ticket
 *          → tri IA → notif admin tracée → contexte client résolu
 *
 * Ce script n'écrit RIEN en base lui-même : il observe seulement. Le nettoyage
 * est fait par _cleanup-support-test.ts.
 *
 *   npx tsx scripts/_test-support-e2e.ts send    # envoie l'email de test
 *   npx tsx scripts/_test-support-e2e.ts watch   # attend et inspecte le ticket
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Expéditeur de test : local-part dédié sur le domaine vérifié. Une réponse
// éventuelle partirait de contact@workwave.fr, que le garde-fou anti-boucle de
// la route inbound ignore → aucun risque de boucle.
const TEST_FROM = "client-test-support@workwave.fr";
const TEST_TO = "contact@workwave.fr";
const SUBJECT = "[TEST SUPPORT] Je n'arrive pas a debloquer un contact";

const BODY = `Bonjour,

Je suis macon dans la Vienne et j'ai recu un projet par mail hier soir.
Quand je clique sur "Debloquer le contact" depuis mon espace pro, la page
tourne et rien ne se passe. J'ai reessaye deux fois avec ma carte.

Est-ce que j'ai ete debite plusieurs fois ? Et comment je recupere les
coordonnees du client ?

Merci d'avance,
Un artisan de test`;

async function send() {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Artisan Test <${TEST_FROM}>`,
      to: TEST_TO,
      subject: SUBJECT,
      text: BODY,
    }),
  });
  const j = (await r.json()) as { id?: string; message?: string };
  if (!r.ok) {
    console.log(`❌ Envoi refuse (HTTP ${r.status}) : ${j.message}`);
    process.exit(1);
  }
  console.log(`✅ Email de test envoye — id Resend ${j.id}`);
  console.log(`   ${TEST_FROM} → ${TEST_TO}`);
  console.log(`   Sujet : ${SUBJECT}`);
}

async function watch() {
  console.log("En attente du ticket (la reception Resend prend 5 a 60 s)...\n");
  const deadline = Date.now() + 180_000;
  let ticket: Record<string, unknown> | null = null;

  while (Date.now() < deadline) {
    const { data } = await sb
      .from("support_tickets")
      .select("*")
      .eq("requester_email", TEST_FROM)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      ticket = data as Record<string, unknown>;
      break;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 5000));
  }

  if (!ticket) {
    console.log("\n\n❌ AUCUN TICKET apres 3 minutes.");
    console.log("   → la chaine email entrante ne fonctionne pas.");
    console.log("   Points a verifier : regle Receiving Resend vers");
    console.log("   https://workwave.fr/api/resend/inbound, et les logs Vercel.");
    process.exit(1);
  }

  const t = ticket as Record<string, string | number | null>;
  console.log("\n\n✅ TICKET CREE\n");
  console.log(`  id                    : #${t.id}`);
  console.log(`  sujet                 : ${t.subject}`);
  console.log(`  demandeur             : ${t.requester_name ?? "-"} <${t.requester_email}>`);
  console.log(`  statut                : ${t.status}`);
  console.log(`  --- tri automatique (IA) ---`);
  console.log(`  categorie             : ${t.category ?? "❌ non classe"}`);
  console.log(`  priorite              : ${t.priority ?? "❌ non definie"}`);
  console.log(`  juridique             : ${t.is_legal}`);
  console.log(`  --- contexte client resolu ---`);
  console.log(`  pro_id                : ${t.pro_id ?? "aucun (normal : adresse de test)"}`);
  console.log(`  project_id            : ${t.project_id ?? "aucun"}`);
  console.log(`  --- notification admin ---`);
  console.log(`  admin_notified_at     : ${t.admin_notified_at ?? "❌ JAMAIS NOTIFIE"}`);
  console.log(`  admin_notification_error : ${t.admin_notification_error ?? "aucune"}`);

  // Le ticket et son 1er message sont insérés en DEUX écritures successives
  // (~150 ms d'écart). Sans cette petite attente, on peut lire le ticket entre
  // les deux et croire à tort que le message n'a pas été stocké.
  await new Promise((r) => setTimeout(r, 2000));

  const { data: msgs } = await sb
    .from("support_messages")
    .select("id, author_role, is_internal, body, email_message_id, created_at")
    .eq("ticket_id", t.id as number)
    .order("created_at", { ascending: true });

  console.log(`\n  --- fil (${(msgs || []).length} message(s)) ---`);
  for (const m of (msgs || []) as Record<string, string>[]) {
    console.log(`   [${m.author_role}] ${String(m.body).slice(0, 70).replace(/\n/g, " ")}...`);
    console.log(`        email_message_id: ${m.email_message_id ?? "null"}`);
  }

  console.log("\n=== VERDICT ===");
  const ok = {
    "ticket cree": true,
    "message stocke": (msgs || []).length > 0,
    "id email trace (idempotence)": (msgs || []).some((m: Record<string, unknown>) => m.email_message_id),
    "tri IA effectue": Boolean(t.category),
    "priorite definie": Boolean(t.priority),
    "admin notifie": Boolean(t.admin_notified_at),
  };
  for (const [k, v] of Object.entries(ok)) console.log(`  ${v ? "✅" : "❌"} ${k}`);
  if (!Object.values(ok).every(Boolean)) process.exit(1);
}

const cmd = process.argv[2];
if (cmd === "send") send();
else if (cmd === "watch") watch();
else {
  console.log("Usage: npx tsx scripts/_test-support-e2e.ts send|watch");
  process.exit(1);
}
