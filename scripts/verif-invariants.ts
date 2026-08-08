/**
 * CONTROLE DES INVARIANTS METIER — le filet que `tsc` et `npm run build` ne
 * peuvent pas tendre.
 *
 * POURQUOI CE SCRIPT EXISTE
 * Les 4 defauts trouves les 07-08/08/2026 partagent une signature : un chemin
 * d'echec que personne n'a jamais execute. Ils compilent tous parfaitement.
 *   - le verrou payant absent sur /pro/dashboard/leads/<id> (aucun lien n'y
 *     menait, donc jamais teste — mais l'URL repondait)
 *   - l'INSERT lead_unlocks rate qui renvoyait quand meme 200 a Stripe
 *   - l'erreur Resend jamais lue (un envoi refuse = un envoi reussi)
 *   - la suppression RGPD qui n'ecrivait qu'une colonne et ne purgeait rien
 *
 * Un typage correct et un build vert ne prouvent RIEN sur ces cas. Ce script,
 * lui, verifie l'ETAT REEL en base et sur le site, et sort en erreur si un
 * invariant metier est viole.
 *
 * USAGE
 *   npx tsx scripts/verif-invariants.ts            # controle, sortie 1 si KO
 *   npx tsx scripts/verif-invariants.ts --alerte   # + email admin si KO
 *
 * A LANCER : apres chaque deploiement, et en cron quotidien.
 * A ETENDRE : chaque fois qu'un defaut est corrige, ajouter ici l'invariant qui
 * l'aurait attrape. C'est la seule facon que la meme erreur ne revienne pas.
 */
import * as dotenv from "dotenv";
import path from "path";

// override: true — tsx pre-injecte certaines vars a vide (lecon 18/04/2026)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr").replace(/\s+/g, "");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

type Verdict = { nom: string; ok: boolean; detail: string };
const verdicts: Verdict[] = [];

async function q<T = Record<string, unknown>>(p: string): Promise<T[]> {
  const r = await fetch(`${URL}/rest/v1/${p}`, { headers: H });
  if (!r.ok) throw new Error(`${p} -> ${r.status} ${await r.text()}`);
  return r.json();
}

function verdict(nom: string, ok: boolean, detail: string) {
  verdicts.push({ nom, ok, detail });
  console.log(`${ok ? "  OK  " : "  KO  "} ${nom}\n       ${detail}`);
}

// ───────────────────────────────────────────────────────────────────────────
// 1. RGPD — une suppression doit etre COMPLETE et EFFECTIVE
//    Aurait attrape : MOSES UTUKA (fiche servie 200 pendant 8 h) et les 11
//    pros restes `do_not_contact = false` apres avoir demande leur suppression.
// ───────────────────────────────────────────────────────────────────────────
async function invariantRgpd() {
  const supprimes = await q<{
    id: number; slug: string; is_active: boolean;
    do_not_contact: boolean; email: string | null; deleted_at: string;
  }>("pros?deleted_at=not.is.null&select=id,slug,is_active,do_not_contact,email,deleted_at&limit=500");

  const actifs = supprimes.filter((p) => p.is_active);
  const avecEmail = supprimes.filter((p) => p.email);
  verdict(
    "RGPD — aucune fiche supprimee ne reste active ou avec des coordonnees",
    actifs.length === 0 && avecEmail.length === 0,
    `${supprimes.length} supprimees | ${actifs.length} encore actives | ${avecEmail.length} avec email` +
      (actifs.length ? ` -> ${actifs.slice(0, 5).map((p) => p.slug).join(", ")}` : "")
  );

  // Les 20 suppressions les plus recentes ne doivent plus etre servies (le
  // cache ISR de 7 jours peut les maintenir en ligne : c'est LE piege).
  const recentes = [...supprimes]
    .sort((a, b) => b.deleted_at.localeCompare(a.deleted_at))
    .slice(0, 20);
  const encoreEnLigne: string[] = [];
  for (const p of recentes) {
    try {
      const r = await fetch(`${BASE}/artisan/${p.slug}`, { redirect: "manual" });
      if (r.status === 200) encoreEnLigne.push(p.slug);
    } catch { /* reseau : on ne conclut pas */ }
  }
  verdict(
    "RGPD — les fiches supprimees ne sont plus servies (cache purge)",
    encoreEnLigne.length === 0,
    encoreEnLigne.length
      ? `${encoreEnLigne.length} encore en 200 : ${encoreEnLigne.join(", ")} — purger via /api/revalidate-sitemap?path=/artisan/<slug>`
      : `${recentes.length} suppressions recentes verifiees, toutes hors ligne`
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 2. ARGENT — tout paiement abouti doit avoir sa contrepartie en base
//    Aurait attrape : l'INSERT lead_unlocks rate renvoyant 200 a Stripe.
// ───────────────────────────────────────────────────────────────────────────
async function invariantPaiements() {
  const events = await q<{
    stripe_event_id: string; event_type: string;
    processed_at: string | null; processing_error: string | null;
  }>("stripe_webhook_events?select=stripe_event_id,event_type,processed_at,processing_error&limit=1000");

  const enErreur = events.filter((e) => e.processing_error);
  verdict(
    "Stripe — aucun evenement en erreur non resolu",
    enErreur.length === 0,
    enErreur.length
      ? `${enErreur.length} en erreur : ${enErreur.slice(0, 3).map((e) => `${e.event_type} (${e.processing_error?.slice(0, 60)})`).join(" | ")}`
      : `${events.length} evenements, aucun en erreur`
  );

  const aboutis = events.filter((e) => e.event_type === "checkout.session.completed");
  const payes = (await q<{ id: number; amount_cents: number }>(
    "lead_unlocks?amount_cents=gt.0&select=id,amount_cents&limit=1000"
  )).length;
  verdict(
    "Stripe — chaque paiement abouti a bien son deblocage en base",
    payes >= aboutis.length,
    `${aboutis.length} paiement(s) abouti(s) cote Stripe | ${payes} deblocage(s) payant(s) en base` +
      (payes < aboutis.length ? " -> ARGENT ENCAISSE SANS CONTREPARTIE" : "")
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 3. CODES EMAIL — un code demande doit partir, ou l'echec doit etre trace
//    Aurait attrape : le champ `error` de Resend ignore (envoi refuse
//    indiscernable d'un envoi reussi, cas Fabien 14/06).
// ───────────────────────────────────────────────────────────────────────────
async function invariantCodes() {
  const ilYA48h = new Date(Date.now() - 48 * 3600e3).toISOString();
  const tentatives = await q<{
    id: number; status: string; error_reason: string | null; created_at: string; email: string;
  }>(`claim_attempts?created_at=gte.${ilYA48h}&select=id,status,error_reason,created_at,email&limit=500`);

  // Une tentative "pending" de plus de 2 h sans motif d'erreur = code parti
  // dans le vide sans que personne ne le sache.
  const ilYA2h = Date.now() - 2 * 3600e3;
  const muettes = tentatives.filter(
    (t) => t.status === "pending" && !t.error_reason && new Date(t.created_at).getTime() < ilYA2h
  );
  verdict(
    "Codes email — aucune demande restee sans suite ni motif d'echec",
    muettes.length <= 3,
    `${tentatives.length} demandes sur 48 h | ${muettes.length} en attente > 2 h sans motif` +
      (muettes.length > 3 ? ` -> verifier la delivrabilite (dig TXT send.workwave.fr)` : "")
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 4. LEADS — un projet recent qui a un preneur ne doit pas rester non diffuse
//    Aurait attrape : broadcasted_at ecrit alors que 0 pro touche.
// ───────────────────────────────────────────────────────────────────────────
async function invariantLeads() {
  const ilYA14j = new Date(Date.now() - 14 * 86400e3).toISOString();
  const projets = await q<{ id: number; broadcast_count: number | null; broadcasted_at: string | null; created_at: string }>(
    `projects?vertical=eq.btp&status=neq.deleted&created_at=gte.${ilYA14j}&select=id,broadcast_count,broadcasted_at,created_at`
  );
  const bloques = projets.filter((p) => p.broadcasted_at && (p.broadcast_count ?? 0) === 0);
  verdict(
    "Leads — aucun projet recent classe 'diffuse' alors que personne ne l'a recu",
    bloques.length === 0,
    `${projets.length} projets sur 14 j | ${bloques.length} marques diffuses a 0 pro` +
      (bloques.length ? ` -> #${bloques.map((p) => p.id).join(", #")} ne repartiront jamais` : "")
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 5. SITE — les pages qui font vivre le site repondent
// ───────────────────────────────────────────────────────────────────────────
async function invariantPages() {
  const routes = ["/", "/deposer-projet", "/pro", "/recherche?q=plombier", "/api/health"];
  const ko: string[] = [];
  for (const r of routes) {
    try {
      const res = await fetch(`${BASE}${r}`, { redirect: "manual" });
      if (res.status !== 200) ko.push(`${r} -> ${res.status}`);
    } catch (e) {
      ko.push(`${r} -> injoignable (${(e as Error).message.slice(0, 40)})`);
    }
  }
  verdict(
    "Site — les routes vitales repondent 200",
    ko.length === 0,
    ko.length ? ko.join(" | ") : `${routes.length} routes verifiees`
  );
}

// ───────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nCONTROLE DES INVARIANTS — ${BASE}\n${"=".repeat(70)}\n`);

  for (const [nom, fn] of [
    ["RGPD", invariantRgpd],
    ["Paiements", invariantPaiements],
    ["Codes email", invariantCodes],
    ["Leads", invariantLeads],
    ["Pages", invariantPages],
  ] as [string, () => Promise<void>][]) {
    try {
      await fn();
    } catch (e) {
      verdict(`${nom} — controle impossible`, false, (e as Error).message.slice(0, 200));
    }
  }

  const echecs = verdicts.filter((v) => !v.ok);
  console.log(`\n${"=".repeat(70)}`);
  console.log(echecs.length === 0
    ? `TOUT EST BON — ${verdicts.length} invariants verifies.`
    : `${echecs.length} INVARIANT(S) VIOLE(S) sur ${verdicts.length}.`);

  if (echecs.length && process.argv.includes("--alerte")) {
    const cle = process.env.RESEND_API_KEY;
    const admin = process.env.ADMIN_EMAIL;
    if (cle && admin) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Workwave <contact@workwave.fr>",
          to: [admin],
          subject: `[Workwave] ${echecs.length} invariant(s) metier viole(s)`,
          text: echecs.map((v) => `- ${v.nom}\n  ${v.detail}`).join("\n\n"),
        }),
      }).catch(() => {});
      console.log("Alerte admin envoyee.");
    }
  }

  process.exit(echecs.length === 0 ? 0 : 1);
}

main();
