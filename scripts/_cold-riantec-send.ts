/**
 * Envoi cold email "humain" : projet #71 plaquiste Riantec (template validé
 * par Willy le 12/06 via _cold-riantec-test.ts).
 *
 * Cibles : emails harvested Google Maps (cache tracking/harvest-riantec-plaquiste-raw.json).
 *  - email rattaché à une fiche pros (enrichie par _harvest-riantec-plaquiste.ts --execute)
 *    → lien de réclamation direct /pro/reclamer/[slug] + unsubscribe token.
 *  - sinon → lien /pro/retrouver-fiche + opt-out par réponse STOP.
 * Exclusions : email_blacklist, pros.do_not_contact, emails partagés (déjà filtrés
 * junk SoLocal à l'extraction). Idempotent : tracking/cold-riantec-p71.json.
 *
 *   npx tsx scripts/_cold-riantec-send.ts            # DRY-RUN
 *   npx tsx scripts/_cold-riantec-send.ts --execute
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { generateGlobalUnsubscribeToken } from "../lib/utils/unsubscribe-token";

const BASE_URL = "https://workwave.fr";
const EXECUTE = process.argv.includes("--execute");
const CACHE = "tracking/harvest-riantec-plaquiste-raw.json";
const TRACK = "tracking/cold-riantec-p71.json";
const RIANTEC = { lat: 47.7208, lng: -3.3029 };
const MAX_KM = 35;
const SUBJECT = "Un projet plaquiste à Riantec (+15 000 €) · personne sur le secteur pour l'instant";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function isJunkEmail(e: string): boolean {
  const dom = e.split("@")[1] || "";
  return dom === "local.fr" || dom.endsWith(".local.fr") || dom.includes("solocal") || dom.includes("pagesjaunes");
}

function buildHtml(opts: { ctaUrl: string; ctaLabel: string; ficheKnown: boolean; unsubHtml: string }): string {
  const ficheLine = opts.ficheKnown
    ? `Votre entreprise est d&eacute;j&agrave; r&eacute;f&eacute;renc&eacute;e sur le site (donn&eacute;es publiques Sirene). Votre fiche est ici&nbsp;:`
    : `Votre entreprise est tr&egrave;s probablement d&eacute;j&agrave; r&eacute;f&eacute;renc&eacute;e sur le site (donn&eacute;es publiques Sirene, on a 980 plaquistes du Morbihan en base). Retrouvez votre fiche ici&nbsp;:`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Je me pr&eacute;sente&nbsp;: Willy Gauvrit, j'ai cr&eacute;&eacute; <a href="${BASE_URL}" style="color:#1a1a1a;">Workwave</a>. C'est le m&ecirc;me principe qu'Habitatpresto ou Travaux.com (des particuliers d&eacute;posent leurs projets de travaux, des artisans les prennent), sauf que chez nous il n'y a <strong>pas d'abonnement</strong>&nbsp;: voir les projets est gratuit, et si un projet vous int&eacute;resse, les coordonn&eacute;es du client co&ucirc;tent 9,90&nbsp;&euro;. C'est tout.</p>
    <p style="margin:0 0 16px;">Si je vous &eacute;cris, c'est parce que j'ai re&ccedil;u cet apr&egrave;s-midi un projet dans votre secteur&nbsp;:</p>
    <div style="border:1px solid #e2e2e2;border-left:3px solid #FF5A36;border-radius:8px;padding:16px 18px;margin:0 0 16px;background:#fafafa;">
      <p style="margin:0 0 6px;font-weight:700;">Plaquiste &middot; Riantec (Morbihan)</p>
      <p style="margin:0 0 4px;font-size:14px;">Budget&nbsp;: <strong>plus de 15&nbsp;000&nbsp;&euro;</strong></p>
      <p style="margin:0 0 10px;font-size:14px;">D&eacute;lai&nbsp;: pas press&eacute;</p>
      <p style="margin:0;font-size:13px;color:#555;font-style:italic;">&laquo;&nbsp;Un particulier &agrave; Riantec souhaite faire appel &agrave; un plaquiste pour un projet de grande envergure.&nbsp;&raquo;</p>
    </div>
    <p style="margin:0 0 16px;">Le probl&egrave;me&nbsp;: je n'ai encore <strong>aucun plaquiste inscrit autour de Riantec</strong>, donc ce projet attend.</p>
    <p style="margin:0 0 16px;">${ficheLine}</p>
    <p style="margin:0 0 16px;"><a href="${opts.ctaUrl}" style="color:#FF5A36;font-weight:700;">${opts.ctaLabel} &rarr;</a></p>
    <p style="margin:0 0 16px;">Si vous la r&eacute;cup&eacute;rez (&ccedil;a prend 2 minutes), vous verrez le projet directement dans votre espace, avec le d&eacute;tail. Apr&egrave;s, c'est vous qui voyez si vous voulez le prendre ou pas&nbsp;: z&eacute;ro engagement, et &ccedil;a ne vous co&ucirc;te rien d'&ecirc;tre inscrit.</p>
    <p style="margin:0 0 4px;">Bonne journ&eacute;e,</p>
    <p style="margin:0 0 24px;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a> &middot; <a href="${BASE_URL}" style="color:#666;">workwave.fr</a></span></p>
    <p style="margin:0;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#999;line-height:1.5;">Vous recevez cet email car votre entreprise est r&eacute;f&eacute;renc&eacute;e sur Workwave (sources publiques). ${opts.unsubHtml}</p>
  </div>
</body></html>`;
}

async function main() {
  console.log(`\n=== COLD EMAIL Riantec #71 · ${EXECUTE ? "EXECUTE" : "DRY-RUN"} ===\n`);
  const items: any[] = JSON.parse(fs.readFileSync(CACHE, "utf-8"));
  const seen = new Set<string>();
  const targets = items
    .map((it: any) => {
      const lat = it.location?.lat ?? null, lng = it.location?.lng ?? null;
      const emails: string[] = (Array.isArray(it.emails) ? it.emails : it.email ? [it.email] : [])
        .filter((e: string) => e && !isJunkEmail(String(e).toLowerCase()));
      return {
        name: String(it.title || "").trim(),
        email: (emails[0] || "").toLowerCase().trim() || null,
        postal: String(it.postalCode || "").trim(),
        km: lat != null && lng != null ? Math.round(haversineKm(RIANTEC, { lat, lng })) : null,
      };
    })
    .filter((r) => r.name && r.email)
    .filter((r) => (r.km != null ? r.km <= MAX_KM : r.postal.startsWith("56")))
    .filter((r) => { if (seen.has(r.email!)) return false; seen.add(r.email!); return true; });

  // fiches matchées = pros plaquiste dont l'email vient d'être enrichi avec ces valeurs
  const emailList = targets.map((t) => t.email!) as string[];
  const { data: matched } = await sb.from("pros")
    .select("id, slug, name, email, do_not_contact")
    .in("email", emailList).eq("is_active", true).is("deleted_at", null);
  const bySlugEmail = new Map((matched || []).map((p: any) => [String(p.email).toLowerCase(), p]));

  // blacklist
  const { data: bl } = await sb.from("email_blacklist").select("email").in("email", emailList);
  const blacklisted = new Set((bl || []).map((b: any) => b.email));

  const track: { sent: string[] } = fs.existsSync(TRACK) ? JSON.parse(fs.readFileSync(TRACK, "utf-8")) : { sent: [] };

  // hors-cible manuel : showroom de coopérative (pas une entreprise de plaquisterie)
  const SKIP = new Set(["coop@orcab.coop"]);
  const pool = targets.filter((t) => {
    if (SKIP.has(t.email!)) return false;
    if (blacklisted.has(t.email!)) return false;
    const pro = bySlugEmail.get(t.email!);
    if (pro?.do_not_contact) return false;
    if (track.sent.includes(t.email!)) return false;
    return true;
  });

  console.log(`${targets.length} emails harvested · ${pool.length} à envoyer (exclus : ${targets.length - pool.length})`);
  console.log(`dont fiche matchée (lien direct) : ${pool.filter((t) => bySlugEmail.has(t.email!)).length}\n`);

  for (const t of pool) {
    const pro = bySlugEmail.get(t.email!);
    const ctaUrl = pro ? `${BASE_URL}/pro/reclamer/${pro.slug}` : `${BASE_URL}/pro/retrouver-fiche`;
    const ctaLabel = pro ? "Récupérer ma fiche (gratuit)" : "Retrouver ma fiche (gratuit)";
    const unsubHtml = pro
      ? `<a href="${BASE_URL}/unsubscribe-all?token=${generateGlobalUnsubscribeToken(pro.id)}&id=${pro.id}" style="color:#999;">Se d&eacute;sinscrire</a>`
      : `Pour ne plus recevoir nos emails, r&eacute;pondez simplement STOP.`;
    if (!EXECUTE) {
      console.log(`[DRY] ${t.email!.padEnd(40)} ${t.name.slice(0, 30).padEnd(30)} ${String(t.km ?? "?").padStart(3)} km  → ${ctaUrl}`);
      continue;
    }
    try {
      const { error } = await resend.emails.send({
        from: "Willy de Workwave <contact@workwave.fr>",
        to: t.email!,
        replyTo: "contact@workwave.fr",
        subject: SUBJECT,
        html: buildHtml({ ctaUrl, ctaLabel, ficheKnown: !!pro, unsubHtml }),
      });
      if (error) { console.log(`  ❌ ${t.email} : ${JSON.stringify(error).slice(0, 120)}`); continue; }
      track.sent.push(t.email!);
      fs.writeFileSync(TRACK, JSON.stringify(track, null, 2));
      console.log(`  ✓ ${t.email} (${t.name.slice(0, 30)})${pro ? " → fiche " + pro.slug : ""}`);
      await sleep(600);
    } catch (e) {
      console.log(`  ❌ ${t.email} : ${(e as Error).message.slice(0, 120)}`);
    }
  }
  console.log(`\n${EXECUTE ? "=== Envoi terminé ===" : "[DRY-RUN] --execute pour envoyer."}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
