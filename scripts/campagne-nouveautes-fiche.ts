/**
 * Campagne du 21/08/2026 : annonce aux artisans ayant reclame leur fiche de
 * ce qui a change sur leur page, et demande d'ajouter une photo de couverture.
 *
 * Usage :
 *   npx tsx scripts/campagne-nouveautes-fiche.ts --test     (un seul mail a l'admin)
 *   npx tsx scripts/campagne-nouveautes-fiche.ts --envoyer  (la vraie campagne)
 *
 * Regles appliquees, chacune pour une raison :
 *   - UN envoi par destinataire, jamais de liste en copie : une adresse
 *     visible par les autres est une fuite de donnees personnelles.
 *   - Lien de desinscription porteur du JETON du pro : sans lui la page
 *     affiche "lien invalide" et le pro ne peut pas se desinscrire, ce qui
 *     est un risque juridique (RGPD art. 21, L34-5 CPCE).
 *   - Freelances tech EXCLUS : leur fiche vit sur une autre page, qui n'a pas
 *     recu cette refonte. Leur annoncer la couverture serait faux.
 *   - Exclusions respectees : do_not_contact, email_bounced, email_blacklist.
 *   - Journal idempotent : un pro deja servi n'est jamais relance, meme si
 *     le script est rejoue.
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { generateGlobalUnsubscribeToken } from "../lib/utils/unsubscribe-token";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TEST = process.argv.includes("--test");
const ENVOYER = process.argv.includes("--envoyer");
const BASE = "https://workwave.fr";
const EXPEDITEUR = "Workwave.fr <contact@workwave.fr>";
const OBJET = "Votre page Workwave.fr a changé";
const JOURNAL = "marketing/campagnes/2026-08-21-envoyes.json";
const VERTICAUX_VISES = new Set(["btp", "domicile", "personne"]);

const HTML = fs.readFileSync("marketing/campagnes/2026-08-21-nouveautes-fiche.html", "utf8");
const TEXTE = fs.readFileSync("marketing/campagnes/2026-08-21-nouveautes-fiche.txt", "utf8");

// Sans ce garde, un gabarit dont le marqueur a ete renomme part quand meme :
// split().join() ne leve rien, ne remplace rien, et les destinataires
// recoivent un mail commercial SANS moyen de se desinscrire. C'est un risque
// juridique (RGPD art. 21, L34-5 CPCE), pas une coquille.
for (const [nom, gabarit] of [["html", HTML], ["texte", TEXTE]] as const) {
  if (!gabarit.includes("{{LIEN_DESINSCRIPTION}}")) {
    console.error(`Marqueur de desinscription absent du gabarit ${nom}. Envoi refuse.`);
    process.exit(1);
  }
}

type Cible = { id: number; nom: string; email: string };

function lienDesinscription(proId: number): string {
  return `${BASE}/unsubscribe-all?token=${generateGlobalUnsubscribeToken(proId)}&id=${proId}`;
}

function personnaliser(gabarit: string, proId: number): string {
  const sortie = gabarit.split("{{LIEN_DESINSCRIPTION}}").join(lienDesinscription(proId));
  if (!sortie.includes("/unsubscribe-all?token=")) {
    throw new Error("Lien de desinscription absent apres substitution");
  }
  return sortie;
}

async function envoyerUn(dest: string, proId: number): Promise<{ ok: boolean; erreur?: string }> {
  try {
    return await tenterEnvoi(dest, proId);
  } catch (e) {
    // fetch REJETTE en cas de coupure reseau ou d'echec TLS : sans ce filet,
    // une simple perte de connexion au douzieme mail tue le processus et les
    // vingt-neuf artisans restants ne recoivent rien, sans bilan.
    return { ok: false, erreur: String(e) };
  }
}

async function tenterEnvoi(dest: string, proId: number): Promise<{ ok: boolean; erreur?: string }> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      to: [dest],
      reply_to: "contact@workwave.fr",
      subject: OBJET,
      html: personnaliser(HTML, proId),
      text: personnaliser(TEXTE, proId),
      headers: {
        // X-Entity-Ref-ID empeche Gmail de replier les 41 mails en une seule
        // conversation. Il ne desactive AUCUN suivi de clics, contrairement a
        // ce que disait le commentaire precedent : les en-tetes de la lecon du
        // 30/04 (X-Mailin-Track-*) sont propres a Brevo et n'ont aucun sens
        // chez Resend, ou le suivi est un reglage de domaine dans leur
        // tableau de bord. Etat de ce reglage NON verifie : la cle d'API du
        // poste est restreinte a l'envoi et ne peut pas lire les domaines.
        "X-Entity-Ref-ID": `campagne-2026-08-21-${proId}`,
        // Bouton natif "Se desabonner" du client mail. Sans lui, celui qui
        // veut sortir prend le chemin le plus court : le bouton Spam, dont
        // les plaintes abiment la reputation de contact@workwave.fr, la meme
        // adresse qui porte les codes de reclamation et les diffusions de
        // projets. PAS de List-Unsubscribe-Post : /unsubscribe-all ne repond
        // qu'en GET, un POST repartirait en 405 sous les yeux du destinataire.
        "List-Unsubscribe": `<${lienDesinscription(proId)}>`,
      },
      // Rejouer la campagne apres une coupure ne doit pas ecrire deux fois a
      // la meme personne : Resend absorbe une cle deja vue.
      idempotency_key: `campagne-2026-08-21-${proId}`,
    }),
  });
  if (r.ok) return { ok: true };
  return { ok: false, erreur: `${r.status} ${(await r.text()).slice(0, 160)}` };
}

(async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY absente.");
    process.exit(1);
  }
  if (!TEST && !ENVOYER) {
    console.log("Rien fait. Utiliser --test puis --envoyer.");
    process.exit(0);
  }

  // ── Le mode test n'utilise AUCUN vrai pro comme cobaye ────────────────
  // Le --test des anciens scripts prenait le premier pro eligible pour
  // fabriquer le jeton : cliquer le lien de desinscription du mail de test
  // desinscrivait alors un vrai pro de production (lecon du 30/04/2026).
  if (TEST) {
    const destinataire = process.env.ADMIN_EMAIL || "workwave.france@gmail.com";
    const r = await envoyerUn(destinataire, 0);
    console.log(r.ok ? `Mail de test envoye a ${destinataire} (proId factice 0).` : `ECHEC : ${r.erreur}`);
    process.exit(r.ok ? 0 : 1);
  }

  // ── Liste noire ───────────────────────────────────────────────────────
  // Lecture PAGINEE et erreur BLOQUANTE. Une erreur ignoree donnerait un Set
  // vide, et les 124 personnes qui ont demande a ne plus rien recevoir
  // seraient toutes recontactees. Un comptage nul est une erreur a signaler,
  // jamais un zero a comparer (lecon du 20/08). Et un select nu est plafonne
  // a 1000 lignes par PostgREST : cinquieme fois que ce plafond mord ce
  // depot, il ne mordra pas ici.
  const noire: Array<{ email: string }> = [];
  for (let off = 0; ; off += 1000) {
    const { data, error } = await sb.from("email_blacklist").select("email").range(off, off + 999);
    if (error) {
      console.error("Liste d'exclusion illisible, envoi annule :", error.message);
      process.exit(1);
    }
    const lot = (data || []) as Array<{ email: string }>;
    if (lot.length === 0) break;
    noire.push(...lot);
  }
  const exclus = new Set(noire.map((x) => x.email.trim().toLowerCase()));
  console.log(`Liste d'exclusion : ${exclus.size} adresses.`);

  const { data, error } = await sb
    .from("pros")
    .select("id, name, email, do_not_contact, email_bounced, category:categories(vertical)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null);
  if (error) {
    console.error("Lecture impossible :", error.message);
    process.exit(1);
  }

  const cibles: Cible[] = [];
  const vus = new Set<string>();
  for (const p of (data || []) as Array<Record<string, unknown>>) {
    const email = typeof p.email === "string" ? p.email.trim() : "";
    const vertical = (p.category as { vertical?: string } | null)?.vertical;
    if (!email) continue;
    if (p.do_not_contact || p.email_bounced) continue;
    if (exclus.has(email.toLowerCase())) continue;
    // Liste BLANCHE, comme l'impose CLAUDE.md. Un `vertical === "tech"` en
    // liste noire laisserait passer une fiche sans categorie, et tout futur
    // vertical ajoute au schema.
    if (!vertical || !VERTICAUX_VISES.has(vertical)) continue;
    // Une meme adresse peut porter plusieurs fiches : on n'ecrit qu'une fois.
    if (vus.has(email.toLowerCase())) continue;
    vus.add(email.toLowerCase());
    cibles.push({ id: Number(p.id), nom: String(p.name), email });
  }

  // ── Journal idempotent ────────────────────────────────────────────────
  const deja: Record<string, string> = fs.existsSync(JOURNAL)
    ? JSON.parse(fs.readFileSync(JOURNAL, "utf8"))
    : {};
  const restants = cibles.filter((c) => !deja[c.email.toLowerCase()]);

  console.log(`Cibles : ${cibles.length}   deja servis : ${cibles.length - restants.length}   a envoyer : ${restants.length}\n`);

  let ok = 0;
  let ko = 0;
  for (const c of restants) {
    const r = await envoyerUn(c.email, c.id);
    if (r.ok) {
      ok++;
      deja[c.email.toLowerCase()] = new Date().toISOString();
      // Ecriture atomique : writeFileSync tronque d'abord puis ecrit, et une
      // interruption dans cette fenetre laisse un JSON illisible. Au rejeu le
      // script mourrait au demarrage, et le reflexe de supprimer le fichier
      // renverrait le mail a tout le monde.
      fs.writeFileSync(`${JOURNAL}.tmp`, JSON.stringify(deja, null, 2));
      fs.renameSync(`${JOURNAL}.tmp`, JOURNAL);
      console.log(`  ok   ${c.email.padEnd(38)} ${c.nom.slice(0, 30)}`);
    } else {
      ko++;
      console.log(`  ECHEC ${c.email.padEnd(37)} ${r.erreur}`);
    }
    // Resend accepte 2 requetes par seconde : on reste sous la limite.
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\nEnvoyes : ${ok}   echecs : ${ko}`);
  if (ko > 0) {
    // Sans ce code de sortie, un lancement automatise conclurait que tout est
    // parti alors que des artisans manquent.
    process.exitCode = 1;
  }
})();
