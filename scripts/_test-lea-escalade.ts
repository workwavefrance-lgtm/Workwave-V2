/**
 * ESCALADE DE LÉA — test du lot 2.
 *
 * Deux moitiés :
 *   A. la DÉCISION — appelle-t-elle l'outil au bon moment, et seulement là ?
 *      (exerce le vrai prompt et la vraie définition d'outil de production)
 *   B. l'EXÉCUTION — le ticket créé est-il exploitable et sans fuite ?
 *
 * N'envoie aucun email : la notification admin n'est pas déclenchée ici (elle
 * l'est par la route). Les tickets créés sont nettoyés à la fin.
 *
 *   npx tsx scripts/_test-lea-escalade.ts
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  buildSystemPrompt,
  sanitizeContext,
  OUVRIR_TICKET,
} from "../lib/support/lea-prompt";
import { createTicketFromChat } from "../lib/support/create-chat-ticket";
import { generateDraftReply } from "../lib/support/draft-reply";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_EMAIL = "visiteur-test-lea@workwave.fr";
let ko = 0;

function check(nom: string, ok: boolean, detail: string) {
  if (!ok) ko++;
  console.log(`  ${ok ? "✅" : "❌"} ${nom}\n     ${detail}`);
}

type Tour = { role: "user" | "assistant"; content: string };

/** Rejoue un échange et dit si Léa a décidé d'ouvrir un ticket. */
async function decide(tours: Tour[], contexte?: unknown) {
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: buildSystemPrompt(sanitizeContext(contexte ?? { type: "home" })),
    tools: [OUVRIR_TICKET],
    messages: tours,
  });
  const tool = res.content.find((c) => c.type === "tool_use");
  const texte = res.content.find((c) => c.type === "text");
  return {
    aOuvert: Boolean(tool),
    args: tool && tool.type === "tool_use" ? (tool.input as Record<string, unknown>) : null,
    texte: texte && texte.type === "text" ? texte.text : "",
  };
}

async function main() {
  console.log("\n=== A. LA DÉCISION D'ESCALADER ===\n");

  // 1. Hors périmètre + email déjà donné -> doit ouvrir
  {
    const r = await decide([
      { role: "user", content: "J'ai payé 9,90 € hier pour un contact et je ne vois toujours aucune coordonnée dans mon espace. Mon email est artisan.test@exemple.fr" },
    ]);
    check(
      "dossier précis (paiement sans coordonnées) -> ouvre un ticket",
      r.aOuvert,
      r.aOuvert ? `email=${r.args?.email} sujet="${r.args?.sujet}"` : `pas d'outil. Texte : ${r.texte.slice(0, 110)}`
    );
    check(
      "elle reformule la demande pour l'équipe",
      typeof r.args?.resume === "string" && (r.args.resume as string).length > 20,
      `resume = "${String(r.args?.resume ?? "").slice(0, 100)}"`
    );
  }

  // 2. Hors périmètre SANS email -> ne doit PAS ouvrir, mais demander l'email
  {
    const r = await decide([
      { role: "user", content: "J'ai payé et je n'ai rien reçu, c'est du vol." },
    ]);
    check(
      "sans email : n'ouvre PAS de ticket (il serait une impasse)",
      !r.aOuvert,
      r.aOuvert ? `⚠️ outil appelé avec email=${r.args?.email}` : "aucun appel d'outil"
    );
    check(
      "sans email : elle demande l'adresse",
      /email|adresse|mail/i.test(r.texte),
      `« ${r.texte.replace(/\n+/g, " ").slice(0, 120)} »`
    );
  }

  // 2 bis. LE CAS RÉEL : conversation en DEUX tours.
  //
  // Ajouté après un échec en production que les tests en un seul tour ne
  // pouvaient pas voir : Léa disait « je transmets » puis renvoyait vers
  // contact@workwave.fr, sans jamais appeler l'outil. Sa propre réponse du
  // tour 1 restait dans l'historique et l'ancrait dans ce comportement.
  {
    const r = await decide([
      { role: "user", content: "J'ai payé 9,90 € hier pour débloquer un contact et je ne vois aucune coordonnée dans mon espace." },
      { role: "assistant", content: "Je passe la main à l'équipe. À quelle adresse email peut-on vous répondre ?" },
      { role: "user", content: "mon adresse c'est artisan.test@exemple.fr" },
    ]);
    check(
      "2 tours : elle a demandé l'email, il arrive -> elle APPELLE l'outil",
      r.aOuvert,
      r.aOuvert
        ? `email=${r.args?.email}`
        : `⚠️ dit sans faire. Texte : « ${r.texte.replace(/\n+/g, " ").slice(0, 130)} »`
    );
    check(
      "2 tours : elle ne renvoie pas la personne vers contact@workwave.fr",
      !/contact@workwave\.fr/i.test(r.texte),
      r.texte ? `« ${r.texte.replace(/\n+/g, " ").slice(0, 110)} »` : "(pas de texte, uniquement l'appel d'outil)"
    );
    // Observé en production : elle réclamait le nom avant de transmettre, soit
    // un tour de plus pour un champ facultatif. Chaque question supplémentaire
    // fait abandonner des gens.
    check(
      "2 tours : elle ne réclame aucune info en plus (le nom est facultatif)",
      !/(votre|un) nom|comment vous appelez/i.test(r.texte),
      r.texte ? `« ${r.texte.replace(/\n+/g, " ").slice(0, 110)} »` : "(appel d'outil direct)"
    );
  }

  // 3. Menace juridique -> ouvre immédiatement
  {
    const r = await decide([
      { role: "user", content: "Je vais saisir la CNIL et mon avocat. Mon email : plaignant.test@exemple.fr" },
    ]);
    check("menace juridique -> ouvre un ticket", r.aOuvert, r.aOuvert ? `sujet="${r.args?.sujet}"` : r.texte.slice(0, 110));
  }

  // 4-6. Dans le périmètre -> ne doit PAS ouvrir (sinon le N1 ne sert à rien)
  const legitimes: [string, string][] = [
    ["code non reçu", "Je n'ai pas reçu le code de vérification pour réclamer ma fiche."],
    ["question tarif", "C'est un abonnement mensuel ou je paie à l'unité ?"],
    ["aucun projet reçu", "Je ne reçois aucun projet depuis mon inscription, pourquoi ?"],
  ];
  for (const [nom, q] of legitimes) {
    const r = await decide([{ role: "user", content: q }]);
    check(
      `${nom} -> répond elle-même, sans escalader`,
      !r.aOuvert,
      r.aOuvert ? "⚠️ a ouvert un ticket inutilement" : `« ${r.texte.replace(/\n+/g, " ").slice(0, 100)} »`
    );
  }

  console.log("\n=== B. LE TICKET PRODUIT ===\n");

  const conv = "test-conv-lea-0001";
  const resume = "J'ai payé 9,90 € pour débloquer un contact hier et je ne vois aucune coordonnée dans mon espace pro.";
  const transcript =
    "VISITEUR : j'ai payé et je ne vois rien\n\nLÉA : je vais transmettre, quelle est votre adresse email ?\n\nVISITEUR : " +
    TEST_EMAIL;

  const t1 = await createTicketFromChat({
    email: TEST_EMAIL,
    name: "Artisan Test",
    subject: "Paiement sans coordonnées",
    resume,
    transcript,
    pathname: "/artisan/test",
    conversationId: conv,
  });
  check("ticket créé", Boolean(t1?.created), `ticketId=${t1?.ticketId} created=${t1?.created}`);

  // Idempotence : même conversation + même demande = doublon
  const t2 = await createTicketFromChat({
    email: TEST_EMAIL,
    name: "Artisan Test",
    subject: "Paiement sans coordonnées",
    resume,
    transcript,
    pathname: "/artisan/test",
    conversationId: conv,
  });
  check(
    "rejeu de la même demande -> doublon, pas de 2e ticket",
    t2?.duplicate === true && t2?.ticketId === t1?.ticketId,
    `duplicate=${t2?.duplicate} ticketId=${t2?.ticketId}`
  );

  // Deuxième sujet DANS la même conversation : doit passer (pas un doublon)
  const t3 = await createTicketFromChat({
    email: TEST_EMAIL,
    subject: "Autre question",
    resume: "Par ailleurs, je voudrais aussi modifier l'adresse affichée sur ma fiche.",
    transcript,
    conversationId: conv,
  });
  check(
    "2e demande différente dans la même conversation -> enregistrée",
    t3?.duplicate === false,
    `duplicate=${t3?.duplicate} ticketId=${t3?.ticketId} (rattachée au même ticket : ${t3?.ticketId === t1?.ticketId})`
  );

  // Email invalide -> refus net
  const t4 = await createTicketFromChat({
    email: "pas-un-email",
    subject: "x",
    resume: "y",
    transcript: "z",
    conversationId: "test-conv-lea-invalide",
  });
  check("email invalide -> aucun ticket créé", t4 === null, `retour = ${t4}`);

  // Contenu du ticket
  const { data: tk } = await sb
    .from("support_tickets")
    .select("id, source, status, requester_email, subject")
    .eq("id", t1?.ticketId ?? 0)
    .maybeSingle();
  const ticket = tk as Record<string, string> | null;
  check(
    "source=chat et email du demandeur renseigné (sinon l'admin ne peut pas répondre)",
    ticket?.source === "chat" && ticket?.requester_email === TEST_EMAIL,
    `source=${ticket?.source} requester_email=${ticket?.requester_email}`
  );

  const { data: msgs } = await sb
    .from("support_messages")
    .select("author_role, is_internal, body")
    .eq("ticket_id", t1?.ticketId ?? 0)
    .order("id");
  const messages = (msgs || []) as { author_role: string; is_internal: boolean; body: string }[];
  const publics = messages.filter((m) => !m.is_internal);
  const internes = messages.filter((m) => m.is_internal);
  check(
    "chaque demande = 1 message VISIBLE, et UNE SEULE note interne (pas de fil dupliqué)",
    publics.length === 2 && internes.length === 1 && internes[0].author_role === "ai",
    `${publics.length} visible(s) pour 2 demandes, ${internes.length} note(s) interne(s)`
  );

  // Le brouillon IA ne doit PAS voir le transcript (note interne exclue)
  const draft = await generateDraftReply({
    subject: "Paiement sans coordonnées",
    requesterName: "Artisan Test",
    category: "unlock",
    messages: messages.map((m) => ({
      author_role: m.author_role,
      body: m.body,
      is_internal: m.is_internal,
    })),
  });
  check(
    "le brouillon admin n'aspire pas la note interne",
    !(draft || "").includes("LÉA :"),
    `brouillon : « ${(draft || "").replace(/\n+/g, " ").slice(0, 110)} »`
  );

  // ── nettoyage ───────────────────────────────────────────────────────────
  console.log("\n=== NETTOYAGE ===\n");
  const { data: aSupprimer } = await sb
    .from("support_tickets")
    .select("id")
    .eq("requester_email", TEST_EMAIL);
  for (const t of (aSupprimer || []) as { id: number }[]) {
    const { error: em } = await sb.from("support_messages").delete().eq("ticket_id", t.id);
    const { error: et } = await sb.from("support_tickets").delete().eq("id", t.id);
    if (em || et) {
      console.log(`  ❌ suppression ticket #${t.id} : ${em?.message ?? et?.message}`);
      ko++;
    } else {
      console.log(`  ticket #${t.id} supprimé`);
    }
  }
  const { count } = await sb
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .eq("requester_email", TEST_EMAIL);
  check("base nettoyée", count === 0, `tickets de test restants : ${count}`);

  console.log("\n=== BILAN ===");
  console.log(ko === 0 ? "  tout est vert" : `  ${ko} échec(s)`);
  if (ko > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
