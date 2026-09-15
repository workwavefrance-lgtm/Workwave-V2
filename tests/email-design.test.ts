import assert from "node:assert/strict";
import test from "node:test";
import { load } from "cheerio";
import { Resend } from "resend";
import { emailContent, renderEmail, emailButton, emailParagraph } from "../lib/email/design";
import { buildEmailHtml } from "../lib/email/broadcast-btp-project";
import { buildVerificationCodeEmail } from "../lib/email/send-verification-code";
import { sendClaimWelcomeEmail } from "../lib/email/send-claim-welcome";
import { sendProjectConfirmation } from "../lib/email/send-project-confirmation";
import { sendReviewRequest } from "../lib/email/send-review-request";
import { sendReviewThanks } from "../lib/email/send-review-thanks";
import { sendSupportReply } from "../lib/email/send-support-reply";

const origin = "https://workwave.fr";
const project = { projectId: 42, projectTitle: "SECRET CONTACT", projectDescription: "PRIVATE 0600000000 person@example.test", projectBudget: "unknown", projectTimeline: "this_month", projectCategoryName: "Plomberie", projectCityName: "Lyon", projectCategoryId: 18, projectDepartmentId: 69, projectCityId: 1, isSuspicious: false };

test("les six variantes de diffusion gardent le solde réel et ne révèlent aucun texte libre", () => {
  for (const kind of [undefined, "j1", "j3"] as const) {
    for (const free of [0, 1, 2]) {
      const html = buildEmailHtml({ ...project, relanceKind: kind }, origin, "69001", free);
      const $ = load(html);
      assert.equal($("h1").length, 1);
      assert.equal($("a").filter((_, a) => $(a).attr("href") === origin + "/pro/dashboard/leads").length, 1);
      assert.match(html, /preferences/);
      assert.doesNotMatch(html, /PRIVATE|SECRET CONTACT|0600000000|person@example/);
      assert.doesNotMatch(html, /parmi les premiers|rien ne se perd/);
      assert.ok(!html.includes("Budget"));
      if (free) assert.match(emailContent(html).text, new RegExp(`Il vous reste ${free} déblocage`));
      else assert.match(emailContent(html).text, /9,90 € TTC/);
    }
  }
});

test("les alternatives texte préservent les liens signés sans entités HTML", () => {
  const url = origin + "/avis/test?token=a%2Bb&email=alex%40example.test";
  const rendered = emailContent(renderEmail({ title: "A & B", body: emailParagraph('<img src="x">') + emailButton("Continuer", url) }));
  assert.match(rendered.html, /&lt;img/);
  assert.ok(rendered.text.includes(url));
  assert.doesNotMatch(rendered.text, /&amp;|<table/);
  assert.equal(load(rendered.html)("h1").length, 1);
});

test("rattachement : le code reste une vérification d’email, la bienvenue annonce la validation", async (t) => {
  process.env.RESEND_API_KEY = "re_local_test";
  const sent: Array<Record<string, unknown>> = [];
  t.mock.method(Resend.prototype, "post", async (_path: string, body: Record<string, unknown>) => { sent.push(body); return { data: { id: "test" }, error: null }; });
  const code = buildVerificationCodeEmail("123456", '<img src="x">');
  assert.match(code.html, /reste soumis/);
  assert.doesNotMatch(code.html, /<img src="x">/);
  await sendClaimWelcomeEmail({ email: "alex@example.test", proName: "Atelier A & B" });
  const welcome = sent[0];
  assert.equal(welcome.to, "alex@example.test");
  assert.match(String(welcome.html), /Votre fiche est validée/);
  assert.match(String(welcome.html), /\/pro\/dashboard\/fiche/);
  assert.doesNotMatch(String(welcome.html), /déjà connecté|Vous venez de réclamer/);
  assert.match(String(welcome.text), /Compléter ma fiche/);
});

test("dépôt, avis et support : destinataires, jetons privés et préférences préservés", async (t) => {
  process.env.RESEND_API_KEY = "re_local_test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-secret";
  const sent: Array<Record<string, unknown>> = [];
  t.mock.method(Resend.prototype, "post", async (_path: string, body: Record<string, unknown>) => { sent.push(body); return { data: { id: "test" }, error: null }; });
  await sendProjectConfirmation({ firstName: '<img src="x">', email: "client@example.test", categoryName: "Plomberie", cityName: "Lyon", description: "A & B", urgency: "this_month", budget: "unknown", deletionToken: "private-token" });
  const confirm = sent.at(-1)!;
  assert.equal(confirm.to, "client@example.test");
  assert.match(String(confirm.text), /token=private-token/);
  assert.doesNotMatch(String(confirm.html), /très prochainement|<img src="x">/);
  await sendReviewRequest({ particulierEmail: "client@example.test", particulierName: "Alex", proName: "Atelier", proSlug: "atelier", proCity: "Lyon", token: "review-token" });
  const review = sent.at(-1)!;
  assert.match(String(review.text), /1 à 5 étoiles/);
  assert.match(String(review.text), /unsubscribe-review\?token=/);
  assert.ok((review.headers as Record<string,string>)["List-Unsubscribe"]);
  for (const published of [true, false]) {
    await sendReviewThanks({ particulierEmail: "client@example.test", particulierName: "Alex", proName: "Atelier", proSlug: "atelier", rating: 2, published });
    assert.doesNotMatch(String(sent.at(-1)!.text), /sous 24h|Confidentiel/);
  }
  await sendSupportReply({ to: "client@example.test", subject: "Mon projet", body: 'Bonjour,\n<img src="x">' });
  assert.equal(sent.at(-1)!.subject, "Re: Mon projet");
  assert.equal(sent.at(-1)!.reply_to, "contact@workwave.fr");
  assert.doesNotMatch(String(sent.at(-1)!.html), /<img src="x">/);
});

test("une bienvenue refusée par Resend remonte une erreur", async (t) => {
  process.env.RESEND_API_KEY = "re_local_test";
  t.mock.method(Resend.prototype, "post", async () => ({ data: null, error: { message: "test refusal" } }));
  await assert.rejects(sendClaimWelcomeEmail({ email: "test@example.test", proName: "Atelier" }), /claim_welcome_send_failed/);
});
