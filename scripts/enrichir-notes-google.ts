/**
 * Enrichit les fiches pros avec leur NOTE GOOGLE, leur NOMBRE D'AVIS et leurs
 * HORAIRES — uniquement quand l'identite de l'entreprise est CERTAINE.
 *
 * ------------------------------------------------------------------------
 * POURQUOI CE SCRIPT PLUTOT QUE `enrich-pros-google-places.ts`
 * ------------------------------------------------------------------------
 * L'ancien script rapproche par NOM + VILLE. Mesure faite le 11/08/2026 sur
 * 22 fiches reelles : ce rapprochement se trompe la moitie du temps.
 *
 *     MARTINE ABRAHAMSE   -> "Martine Pressing"        (un pressing)
 *     THIERRY MALAURENT   -> "Martaud Thierry"         (autre personne)
 *     ADELF'SERVICES      -> "Centre Services Vif"     (mot commun : "services")
 *     ELIOR SERVICES      -> "DERICHEBOURG Facility"   (meme zone d'activite)
 *
 * Un prenom ne distingue personne, "services" non plus, et deux entreprises
 * concurrentes partagent souvent une adresse en zone d'activite. C'est le meme
 * mecanisme qui, via Apify en mai 2026, avait colle le telephone d'une personne
 * sur l'entreprise d'une autre — 857 fiches touchees, une plainte RGPD.
 *
 * ------------------------------------------------------------------------
 * LA CLE FIABLE
 * ------------------------------------------------------------------------
 * On n'accepte un rapprochement QUE si Google renvoie EXACTEMENT le meme
 * telephone ou le meme nom de domaine que celui deja en base. Ces deux
 * elements ne se partagent pas entre deux entreprises : la correspondance est
 * binaire, pas approximative. Aucun faux positif possible.
 *
 * Consequence : on ne traite que les 34 774 fiches qui ont deja un telephone
 * ou un site web. Ce ne sont PAS de nouvelles coordonnees qu'on cherche — ce
 * sont des notes et des horaires sur des fiches qu'on sait identifier.
 *
 * ------------------------------------------------------------------------
 * GARDE-FOU FACTURATION
 * ------------------------------------------------------------------------
 * Google facture des le 5 001e appel du mois (17 $ les 1 000). Le compteur est
 * persiste sur disque et remis a zero au changement de mois. Le script REFUSE
 * de depasser, meme si on le relance dix fois. Willy n'a pas de budget : il ne
 * doit pas pouvoir se reveiller avec une facture.
 *
 * ------------------------------------------------------------------------
 * USAGE
 *   npx tsx scripts/enrichir-notes-google.ts                  # simulation, 20 fiches
 *   npx tsx scripts/enrichir-notes-google.ts --appliquer      # ecrit, 20 fiches
 *   npx tsx scripts/enrichir-notes-google.ts --appliquer --nb 500
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const CLE = process.env.GOOGLE_PLACES_API_KEY;
if (!CLE) {
  console.error("GOOGLE_PLACES_API_KEY absente de .env.local");
  process.exit(1);
}

const APPLIQUER = process.argv.includes("--appliquer");
const NB = Number(process.argv[process.argv.indexOf("--nb") + 1]) || 20;

// Palier gratuit "Place Details Pro" : 5 000 appels par mois. On s'arrete a
// 4 800 pour garder une marge (un appel de test, un retry...).
const QUOTA_MENSUEL = 4800;
const COMPTEUR = path.resolve(process.cwd(), ".google-places-quota.json");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// --- compteur d'appels, persiste, remis a zero chaque mois ---
function lireCompteur(mois: string): number {
  try {
    const j = JSON.parse(fs.readFileSync(COMPTEUR, "utf8"));
    return j.mois === mois ? j.appels : 0;
  } catch {
    return 0;
  }
}
function ecrireCompteur(mois: string, appels: number) {
  fs.writeFileSync(COMPTEUR, JSON.stringify({ mois, appels }, null, 2));
}

// --- normalisations pour la comparaison EXACTE ---
function chiffresTel(t: string | null): string {
  if (!t) return "";
  const d = t.replace(/[^\d]/g, "");
  // +33 6 12... et 06 12... doivent se comparer : on ramene au format national.
  if (d.startsWith("33") && d.length > 10) return "0" + d.slice(2);
  if (d.startsWith("32") && d.length > 9) return "0" + d.slice(2); // Belgique
  return d;
}
function domaine(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

type Pro = {
  id: number;
  name: string;
  phone: string | null;
  website: string | null;
  cities: { name: string; postal_code: string | null } | null;
};

(async () => {
  const mois = new Date().toISOString().slice(0, 7);
  let appels = lireCompteur(mois);
  const restants = QUOTA_MENSUEL - appels;

  console.log(`Mois ${mois} : ${appels} appels deja consommes, ${restants} restants sur ${QUOTA_MENSUEL} gratuits`);
  if (restants <= 0) {
    console.log("Quota gratuit du mois epuise. On s'arrete — aucun appel facture.");
    return;
  }
  const aTraiter = Math.min(NB, restants);
  console.log(`${APPLIQUER ? "ECRITURE EN BASE" : "SIMULATION (aucune ecriture)"} — ${aTraiter} fiches\n`);

  // Fiches identifiables (tel ou site) et pas encore enrichies.
  const { data, error } = await sb
    .from("pros")
    .select("id, name, phone, website, cities(name, postal_code)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("google_enriched_at", null)
    .or("phone.not.is.null,website.not.is.null")
    .limit(aTraiter);
  if (error) {
    console.error("ERREUR lecture :", error.message);
    process.exit(1);
  }

  let trouves = 0, ecrits = 0, refuses = 0, sansResultat = 0;

  for (const p of (data || []) as unknown as Pro[]) {
    const ville = p.cities?.name || "";
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": CLE,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.nationalPhoneNumber,places.websiteUri," +
          "places.rating,places.userRatingCount,places.regularOpeningHours,places.primaryType",
      },
      // ON CHERCHE PAR LE NUMERO, PAS PAR LE NOM.
      // Mesure du 11/08/2026 sur deux echantillons de 20 fiches :
      //   recherche par nom      1 identifie, 11 rejetes  (et des faux
      //                          positifs quand on relache le controle)
      //   recherche par numero   3 identifies, 0 faux positif
      // Google identifie l'etablissement directement a partir du numero : la
      // reponse est binaire, il le trouve ou il ne le trouve pas. C'est ce qui
      // supprime toute possibilite de rapprochement approximatif.
      // Faute de telephone, on cherche par le domaine du site web.
      body: JSON.stringify({
        // JAMAIS de repli sur le nom. Le 11/08 j'avais laisse
        // `|| \`${p.name} ${ville}\`` : "Kevin VACHE" a matche le restaurant
        // "O'la vache". La recherche par nom est justement celle qu'on a
        // rejetee — la reintroduire en secours revient a la reintroduire tout
        // court. Une fiche sans telephone ni site n'est pas traitee, point.
        textQuery: p.phone || domaine(p.website),
        languageCode: "fr",
        maxResultCount: 3,
      }),
    });
    appels++;
    ecrireCompteur(mois, appels);

    if (!r.ok) {
      console.log(`  ! ${p.name.slice(0, 34).padEnd(36)} HTTP ${r.status}`);
      continue;
    }
    const j = await r.json();
    const candidats = j.places || [];
    if (candidats.length === 0) {
      sansResultat++;
      continue;
    }

    // LE CONTROLE : meme telephone OU meme domaine. Rien d'autre n'est accepte.
    const telBase = chiffresTel(p.phone);
    const domBase = domaine(p.website);
    const g = candidats.find((c: Record<string, string>) => {
      const memeTel = telBase && chiffresTel(c.nationalPhoneNumber) === telBase;
      const memeDom = domBase && domaine(c.websiteUri) === domBase;
      return memeTel || memeDom;
    });

    if (!g) {
      refuses++;
      continue;
    }

    // GARDE-FOU DE VRAISEMBLANCE.
    // Meme avec un numero identique, la donnee de DEPART peut etre fausse :
    // l'enrichissement Apify de mai a colle le telephone de Brico Depot sur la
    // fiche "BRICODAB" et celui d'un E.Leclerc sur "ESTELLE LECLERC". Le
    // rapprochement est alors techniquement juste et le resultat absurde.
    // Un artisan n'est ni un hypermarche, ni un restaurant, ni une enseigne de
    // bricolage — et il n'a pas 8 000 avis.
    const TYPES_INTERDITS = /supermarket|hypermarket|grocery|store|restaurant|cafe|bar|hotel|bank|pharmacy|gas_station|school|hospital|shopping/i;
    const typeSuspect = TYPES_INTERDITS.test(g.primaryType || "");
    const tropDAvis = (g.userRatingCount ?? 0) > 300;
    if (typeSuspect || tropDAvis) {
      refuses++;
      console.log(
        `  ✗ ${p.name.slice(0, 32).padEnd(34)} REFUSE — ${
          typeSuspect ? `type "${g.primaryType}"` : `${g.userRatingCount} avis, invraisemblable pour un artisan`
        } (donnee de depart probablement fausse)`
      );
      continue;
    }
    trouves++;
    const parQuoi = telBase && chiffresTel(g.nationalPhoneNumber) === telBase ? "telephone" : "domaine";
    const note = g.rating ?? null;
    const nbAvis = g.userRatingCount ?? null;
    const horaires = g.regularOpeningHours?.weekdayDescriptions ?? null;

    console.log(
      `  ✓ ${p.name.slice(0, 32).padEnd(34)} ${String(note ?? "—").padStart(4)}/5` +
      ` ${String(nbAvis ?? 0).padStart(5)} avis  ${horaires ? "horaires" : "        "}  (${parQuoi})`
    );

    if (APPLIQUER) {
      const maj: Record<string, unknown> = {
        google_place_id: g.id,
        google_enriched_at: new Date().toISOString(),
      };
      if (note !== null) maj.google_rating = note;
      if (nbAvis !== null) maj.google_reviews_count = nbAvis;
      // On n'ecrase JAMAIS des horaires deja saisis par le pro lui-meme.
      if (horaires) maj.opening_hours = horaires;
      const { error: e } = await sb.from("pros").update(maj).eq("id", p.id);
      if (e) console.log(`      ECRITURE REFUSEE : ${e.message}`);
      else ecrits++;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n  identifies avec certitude : ${trouves}`);
  console.log(`  refuses (ni tel ni domaine identique) : ${refuses}`);
  console.log(`  absents de Google : ${sansResultat}`);
  if (APPLIQUER) console.log(`  ecrits en base : ${ecrits}`);
  console.log(`\n  appels consommes ce mois : ${appels} / ${QUOTA_MENSUEL} gratuits`);
})();
