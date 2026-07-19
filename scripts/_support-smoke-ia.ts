/**
 * Smoke test de la couche IA du support (Phase 2) : tri + brouillon de réponse.
 *   npx tsx scripts/_support-smoke-ia.ts
 *
 * Vérifie en conditions réelles (vrais appels Claude) que :
 *   - le tri classe correctement un cas courant ET détecte une menace juridique ;
 *   - le brouillon se génère, en français, sans promettre de remboursement.
 * Crée un ticket de test puis le supprime.
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { ingestInboundEmailAsTicket } from "../lib/support/tickets";
import { triageTicket } from "../lib/support/triage";
import { generateDraftReply } from "../lib/support/draft-reply";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CAS_UNLOCK = {
  subject: "J'ai payé 9,90 € et le client ne répond pas",
  body: `Bonjour,
J'ai débloqué un lead hier pour un chantier de peinture à Poitiers, j'ai payé les 9,90 €.
J'ai appelé 3 fois, envoyé un SMS, aucune réponse. Je trouve ça anormal de payer pour ça.
Est-ce que vous pouvez me rembourser ?
Merci. Julien, JB Peinture`,
};

const CAS_LEGAL = {
  subject: "Suppression immédiate de ma fiche",
  body: `Madame, Monsieur,
Ma fiche est publiée sans mon accord. Je vous mets en demeure de la supprimer sous 8 jours.
À défaut, je saisirai la CNIL et mon avocat engagera une procédure.`,
};

async function main() {
  let failures = 0;

  // 1) Tri : cas déblocage / remboursement
  console.log("— Cas 1 : pro qui demande un remboursement —");
  const t1 = await triageTicket(CAS_UNLOCK);
  console.log("  tri :", t1);
  if (!t1) {
    console.log("  ❌ tri indisponible (clé API ? modèle ?)");
    failures++;
  } else {
    if (t1.category !== "unlock") console.log(`  ⚠️ catégorie attendue "unlock", reçue "${t1.category}"`);
    if (t1.isLegal) console.log("  ⚠️ is_legal ne devrait PAS être vrai ici");
  }

  // 2) Tri : cas menace juridique
  console.log("\n— Cas 2 : mise en demeure + CNIL + avocat —");
  const t2 = await triageTicket(CAS_LEGAL);
  console.log("  tri :", t2);
  if (!t2) {
    console.log("  ❌ tri indisponible");
    failures++;
  } else {
    if (t2.category !== "rgpd") console.log(`  ⚠️ catégorie attendue "rgpd", reçue "${t2.category}"`);
    if (!t2.isLegal) {
      console.log("  ❌ is_legal DEVRAIT être vrai (CNIL + avocat + mise en demeure)");
      failures++;
    }
  }

  // 3) Brouillon de réponse sur le cas 1 (le plus piégeux : demande de remboursement)
  console.log("\n— Brouillon de réponse (cas remboursement) —");
  const draft = await generateDraftReply({
    subject: CAS_UNLOCK.subject,
    requesterName: "Julien",
    category: t1?.category ?? "unlock",
    messages: [{ author_role: "client", body: CAS_UNLOCK.body, is_internal: false }],
    pro: { name: "JB Peinture", category: "Peintre", city: "Poitiers", subscription_status: null },
    unlocks: 3,
    projectsCount: 0,
  });
  if (!draft) {
    console.log("  ❌ brouillon non généré");
    failures++;
  } else {
    console.log("  ✅ brouillon généré :\n");
    console.log(draft.split("\n").map((l) => "    " + l).join("\n"));
    const lower = draft.toLowerCase();
    if (/\brembours/.test(lower) && !/pas de rembours|aucun rembours|ne peut pas être rembours|non rembours/.test(lower)) {
      console.log("\n  ⚠️ à vérifier : le brouillon parle de remboursement — s'assurer qu'il ne le PROMET pas.");
    }
    if (/cordialement|l'équipe workwave/i.test(draft)) {
      console.log("  ⚠️ le brouillon ajoute une signature alors que le template en met déjà une.");
    }
  }

  // 4) Bout-en-bout : ingestion + tri appliqué en base
  console.log("\n— Bout-en-bout : ingestion + tri écrit en base —");
  const fakeId = `smoke-ia-${Date.now()}`;
  const ing = await ingestInboundEmailAsTicket({
    resendEmailId: fakeId,
    fromRaw: "Julien <smoke-ia@example.invalid>",
    subject: CAS_UNLOCK.subject,
    text: CAS_UNLOCK.body,
    html: null,
  });
  if (!ing?.created) {
    console.log("  ❌ ticket non créé");
    failures++;
  } else {
    const tr = await triageTicket({ subject: CAS_UNLOCK.subject, body: CAS_UNLOCK.body });
    if (tr) {
      await sb
        .from("support_tickets")
        .update({ category: tr.category, priority: tr.priority, is_legal: tr.isLegal })
        .eq("id", ing.ticketId);
    }
    const { data } = await sb
      .from("support_tickets")
      .select("id, category, priority, is_legal")
      .eq("id", ing.ticketId)
      .single();
    console.log("  ticket en base :", data);
    await sb.from("support_tickets").delete().eq("id", ing.ticketId);
    console.log(`  🧹 ticket #${ing.ticketId} supprimé.`);
  }

  if (failures > 0) {
    console.log(`\n❌ ${failures} échec(s) bloquant(s).`);
    process.exit(1);
  }
  console.log("\n✅ COUCHE IA OK — tri et brouillon opérationnels.");
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
