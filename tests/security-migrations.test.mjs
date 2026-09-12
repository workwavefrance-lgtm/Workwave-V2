import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

// PostgreSQL WASM isolé, aucune connexion réseau ou base existante.
// Installer PGlite hors du dépôt, puis exécuter :
// WORKWAVE_PGLITE_PATH=/private/tmp/workwave-sql-tests/node_modules/@electric-sql/pglite/dist/index.js \
//   node --test tests/security-migrations.test.mjs
// Testé avec @electric-sql/pglite 0.5.8 ; aucune dépendance production ajoutée.
if (!process.env.WORKWAVE_PGLITE_PATH) {
  throw new Error("Définir WORKWAVE_PGLITE_PATH vers le module local PGlite dist/index.js (voir commentaire du test).");
}
const { PGlite } = await import(pathToFileURL(process.env.WORKWAVE_PGLITE_PATH).href);

const root = fileURLToPath(new URL("../", import.meta.url));
const db = new PGlite();
const USER = "00000000-0000-0000-0000-000000000001";
const OTHER = "00000000-0000-0000-0000-000000000002";
const UNCONFIRMED = "00000000-0000-0000-0000-000000000003";
const ADMIN = "00000000-0000-0000-0000-000000000004";
const note = "Identité professionnelle vérifiée sur justificatif fictif";

async function scalar(sql, params = []) { return Object.values((await db.query(sql, params)).rows[0])[0]; }
async function role(name, fn) {
  await db.exec(`set role ${name}`);
  try { return await fn(); } finally { await db.exec("reset role"); }
}
async function attempt(overrides = {}) {
  const values = {
    siret: "11111111111111", email: "pro@example.test", ip: "unknown", type: "claim", status: "pending",
    verification_code_hash: "hash-ok", code_expires_at: new Date(Date.now() + 900000).toISOString(),
    temp_password: "fixture-only", attempts_count: 0, target_pro_id: 1, ...overrides,
  };
  const columns = Object.keys(values);
  return scalar(`insert into claim_attempts(${columns.join(",")}) values (${columns.map((_, i) => `$${i + 1}`).join(",")}) returning id`, Object.values(values));
}
const consume = (id, slug = "pro-one", hash = "hash-ok") => role("service_role", () => scalar("select public.consume_pro_claim_code($1,$2,$3)", [id, slug, hash]));
const enqueue = (id, pro = 1, user = USER) => role("service_role", () => scalar("select public.enqueue_pro_claim($1,$2,$3)", [id, pro, user]));
const review = (id, user = ADMIN, decision = "approved", explanation = note) => role("service_role", () => scalar("select public.review_pro_claim($1,$2,$3,$4)", [id, user, decision, explanation]));
const delivery = (project = 1, pro = 5, kind = "initial") => role("service_role", () => db.query("insert into project_email_deliveries(project_id,pro_id,kind,recipient_email,subject,html) values($1,$2,$3,'pro@example.test','Projet','<p>Fixture</p>')", [project, pro, kind]));

before(async () => {
  // Schéma isolé minimal des dépendances des migrations : ni réseau ni données réelles.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create table public.admins(user_id uuid primary key references auth.users(id), role text);
    create table public.pros(
      id bigint primary key, slug text unique, siret text, email text,
      claimed_by_user_id uuid references auth.users(id), claimed_at timestamptz,
      is_active boolean default true, do_not_contact boolean default false,
      deleted_at timestamptz, paused_until timestamptz, subscription_status text default 'none',
      trial_ends_at timestamptz, intervention_radius_km integer default 20
    );
    create table public.projects(id integer primary key, status text default 'new');
    create table public.claim_attempts(
      id bigint generated always as identity primary key,
      siret text, email text, ip text, type text, status text, verification_code_hash text,
      code_expires_at timestamptz, temp_password text, attempts_count integer default 0,
      success boolean default false, created_at timestamptz default now()
    );
  `);
  await db.exec(await readFile(`${root}/sql/08-project-email-deliveries.sql`, "utf8"));
  await db.exec(await readFile(`${root}/sql/09-pro-claim-requests.sql`, "utf8"));
});
after(() => db.close());
beforeEach(async () => {
  await db.exec("truncate project_email_deliveries, pro_claim_requests, claim_attempts, admins, pros, projects, auth.users restart identity cascade");
  await db.query("insert into auth.users values($1,'pro@example.test',now()),($2,'other@example.test',now()),($3,'pro@example.test',null),($4,'admin@example.test',now())", [USER, OTHER, UNCONFIRMED, ADMIN]);
  await db.query("insert into admins values($1,'admin')", [ADMIN]);
  await db.query(`insert into pros(id,slug,siret,email,claimed_by_user_id,deleted_at) values
    (1,'pro-one','11111111111111',null,null,null),
    (2,'same-siret','11111111111111',null,null,null),
    (3,'deleted-pro','33333333333333',null,null,now()),
    (4,'owned-pro','44444444444444','other@example.test',$1,null),
    (5,'mail-pro','55555555555555','pro@example.test',$2,null)`, [OTHER, USER]);
  await db.exec("insert into projects values(1,'new'),(2,'closed'),(3,'deleted')");
});

test("08 : PK déduplique par projet/pro/kind, payload première tentative préservé", async () => {
  await delivery();
  await role("service_role", () => db.exec("insert into project_email_deliveries(project_id,pro_id,kind,recipient_email,subject,html) values(1,5,'initial','different@example.test','Changed','Changed') on conflict(project_id,pro_id,kind) do nothing"));
  assert.equal(await scalar("select count(*) from project_email_deliveries"), 1);
  assert.equal(await scalar("select recipient_email from project_email_deliveries"), "pro@example.test");
  await delivery(1,5,"j1"); await delivery(1,5,"j3");
  assert.equal(await scalar("select count(*) from project_email_deliveries"), 3);
});
test("08 : authentifié et anonyme ne peuvent lire ou modifier le journal", async () => {
  await delivery();
  for (const actor of ["anon", "authenticated"]) {
    await assert.rejects(role(actor, () => db.query("select * from project_email_deliveries")), /permission denied/);
    await assert.rejects(role(actor, () => db.exec("delete from project_email_deliveries")), /permission denied/);
  }
  assert.equal(await role("service_role", () => scalar("select count(*) from project_email_deliveries")), 1);
});
test("08 : guard refuse projet retiré/clos, pro supprimé, nonréclamé, opposé ou enpause", async () => {
  for (const project of [2,3]) await assert.rejects(delivery(project), /Projet indisponible/);
  await assert.rejects(delivery(1,3), /Professionnel indisponible/);
  await assert.rejects(delivery(1,1), /Professionnel indisponible/);
  await db.exec("update pros set do_not_contact=true where id=5");
  await assert.rejects(delivery(), /Professionnel indisponible/);
  await db.exec("update pros set do_not_contact=false, paused_until=now()+interval '1 day' where id=5");
  await assert.rejects(delivery(), /Professionnel indisponible/);
});
test("08 : suppression douce projet et pro purge également les payloads", async () => {
  await delivery();
  await db.exec("update projects set status='deleted' where id=1");
  assert.equal(await scalar("select count(*) from project_email_deliveries"),0);
  await db.exec("update projects set status='new' where id=1");
  await delivery();
  await db.exec("update pros set deleted_at=now() where id=5");
  assert.equal(await scalar("select count(*) from project_email_deliveries"),0);
  await assert.rejects(delivery(), /Professionnel indisponible/);
});
test("09 : code consommé une fois, motdepasse et hash effacés immédiatement", async () => {
  const id = await attempt(); const result = await consume(id);
  assert.equal(result.pro_id,1); assert.equal(result.password,"fixture-only");
  const row = (await db.query("select * from claim_attempts where id=$1",[id])).rows[0];
  assert.equal(row.status,"verified"); assert.equal(row.temp_password,null); assert.equal(row.verification_code_hash,null);
  assert.equal((await consume(id)).error,"invalid");
});
test("09 : trois codes erronés bloquent la tentative et empêchent ensuite le bon", async () => {
  const id=await attempt();
  for (const remaining of [2,1,0]) assert.equal((await consume(id,"pro-one","wrong")).remaining,remaining);
  assert.equal((await consume(id)).error,"invalid");
  assert.equal(await scalar("select temp_password from claim_attempts where id=$1",[id]),null);
});
test("09 : code expiré, autre opération, mauvaise fiche et même SIRET autre fiche refusés", async () => {
  const expired=await attempt({code_expires_at:new Date(Date.now()-60000).toISOString()});
  assert.equal((await consume(expired)).error,"expired");
  const deletion=await attempt({type:"deletion"}); assert.equal((await consume(deletion)).error,"invalid");
  const id=await attempt();
  assert.equal((await consume(id,"missing")).error,"unavailable");
  assert.equal((await consume(id,"same-siret")).error,"unavailable");
  assert.equal((await consume(id)).pro_id,1);
  await assert.rejects(enqueue(id,2), /pro_unavailable/);
});
test("09 : enqueue exige utilisateur email identique ET confirmé, un seul dossier", async () => {
  const id=await attempt(); await consume(id);
  await assert.rejects(enqueue(id,1,OTHER), /verified_email_mismatch/);
  await assert.rejects(enqueue(id,1,UNCONFIRMED), /verified_email_mismatch/);
  const request=await enqueue(id); assert.ok(request);
  await assert.rejects(enqueue(id), /claim_already_queued/);
});
test("09 : décision exige vraiadmin/note puis rattache et copie email vérifié atomiquement", async () => {
  const id=await attempt({email:"  PRO@example.test  "}); await consume(id); const request=await enqueue(id);
  await assert.rejects(review(request,OTHER), /admin_required/);
  await assert.rejects(review(request,ADMIN,"approved","court"), /review_required/);
  const result=await review(request); assert.equal(result.status,"approved");
  const pro=(await db.query("select * from pros where id=1")).rows[0];
  assert.equal(pro.claimed_by_user_id,USER); assert.equal(pro.email,"pro@example.test"); assert.equal(pro.intervention_radius_km,200);
  assert.equal(await scalar("select success from claim_attempts where id=$1",[id]),true);
  await assert.rejects(review(request), /claim_already_reviewed/);
});
test("09 : décision ne remplace jamais propriétaire existant ou fiche supprimée", async () => {
  for (const mutation of ["claimed_by_user_id='"+OTHER+"'", "deleted_at=now()"]) {
    await db.exec("update pros set claimed_by_user_id=null,deleted_at=null where id=1");
    const id=await attempt(); await consume(id); const request=await enqueue(id);
    await db.exec(`update pros set ${mutation} where id=1`);
    await assert.rejects(review(request), /pro_unavailable/);
    assert.equal(await scalar("select status from pro_claim_requests where id=$1",[request]),"pending");
  }
});
test("09 : emailauth modifié, SIRET modifié ou targetpro altéré bloquent l'approbation", async () => {
  for (const mutation of [
    `update auth.users set email='changed@example.test' where id='${USER}'`,
    "update pros set siret='changed' where id=1",
    "update claim_attempts set target_pro_id=2 where id=1",
  ]) {
    await db.exec("truncate pro_claim_requests,claim_attempts restart identity");
    await db.query("update auth.users set email='pro@example.test' where id=$1",[USER]);
    await db.exec("update pros set siret='11111111111111' where id=1");
    const id=await attempt(); await consume(id); const request=await enqueue(id); await db.exec(mutation);
    await assert.rejects(review(request), /verified_email_mismatch|claim_changed/);
    assert.equal(await scalar("select claimed_by_user_id from pros where id=1"),null);
  }
});
test("09 : RPC et dossiers interdits aux rôles publics", async () => {
  const id=await attempt();
  for (const actor of ["anon","authenticated"]) {
    await assert.rejects(role(actor,()=>db.query("select public.consume_pro_claim_code($1,'pro-one','hash-ok')",[id])), /permission denied/);
    await assert.rejects(role(actor,()=>db.query("select public.enqueue_pro_claim($1,1,$2)",[id,USER])), /permission denied/);
    await assert.rejects(role(actor,()=>db.query("select public.review_pro_claim(1,$1,'approved','long enough note')",[ADMIN])), /permission denied/);
    await assert.rejects(role(actor,()=>db.query("select * from pro_claim_requests")), /permission denied/);
  }
});
test("09 : preuve supprimée libère le nettoyage mais interdit l'approbation", async () => {
  const id = await attempt(); await consume(id); const request = await enqueue(id);
  await db.query("delete from claim_attempts where id=$1", [id]);
  assert.equal(await scalar("select claim_attempt_id from pro_claim_requests where id=$1", [request]), null);
  await assert.rejects(review(request), /claim_changed/);
  assert.equal(await scalar("select claimed_by_user_id from pros where id=1"), null);
});
test("09 : suppression du compte demandeur purge sa demande sans bloquer le droit d'effacement", async () => {
  const id = await attempt(); await consume(id); await enqueue(id);
  // La fiche mail-pro de la fixture appartient aussi à cet utilisateur :
  // le détachement du propriétaire préexistant relève du flux RGPD de l'app.
  await db.query("update pros set claimed_by_user_id=null where claimed_by_user_id=$1", [USER]);
  await db.query("delete from auth.users where id=$1", [USER]);
  assert.equal(await scalar("select count(*) from pro_claim_requests"), 0);
});
test("09 : suppression définitive de fiche efface les demandes et retire la cible des codes", async () => {
  const pending = await attempt();
  const consumed = await attempt(); await consume(consumed); await enqueue(consumed);
  await db.exec("delete from pros where id=1");
  assert.equal(await scalar("select count(*) from pro_claim_requests"), 0);
  assert.equal(await scalar("select target_pro_id from claim_attempts where id=$1", [pending]), null);
  assert.equal((await consume(pending)).error, "unavailable");
});
test("09 quota : 3 émissions/email normalisé admises, quatrième bloquée même après consommation", async () => {
  const first=await attempt({email:"PRO@example.test"}); await consume(first);
  await attempt({email:" pro@example.test "}); await attempt();
  await assert.rejects(attempt(), /claim_rate_limited/);
});
test("09 quota : vieux codes, suppression et essais sans émission ne consomment pas 15minutes", async () => {
  for(let i=0;i<4;i++) await attempt({created_at:new Date(Date.now()-3600000).toISOString()});
  for(let i=0;i<4;i++) await attempt({type:"deletion"});
  for(let i=0;i<4;i++) await attempt({verification_code_hash:null,code_expires_at:null});
  for(let i=0;i<3;i++) await attempt();
  await assert.rejects(attempt(),/claim_rate_limited/);
});
test("09 quota : 20 émissions/IP normalisée parheure, unknown/null ne mutualisent pas", async () => {
  for(let i=0;i<20;i++) await attempt({email:`pro-${i}@example.test`,ip:i%2?" 2001:DB8::1 ":"2001:db8::1"});
  await assert.rejects(attempt({email:"blocked@example.test",ip:"2001:db8::1"}),/claim_rate_limited/);
  for(let i=0;i<24;i++) await attempt({email:`unknown-${i}@example.test`,ip:i%2?"unknown":null});
  await db.exec("update claim_attempts set created_at=now()-interval '2 hours' where lower(btrim(ip))='2001:db8::1'");
  await attempt({email:"allowed@example.test",ip:"2001:db8::1"});
});
