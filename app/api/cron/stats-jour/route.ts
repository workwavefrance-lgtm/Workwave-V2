/**
 * POST /api/cron/stats-jour : LE point d'ecriture de la table `stats_jour`.
 *
 * Pourquoi (09/09/2026) : les mesures d'audience de Workwave.fr vivaient dans
 * trois outils qui ne se parlent pas (Umami et le journal Traefik sur le VPS,
 * Search Console sur le Mac de Willy). Chaque comparaison demandait de tout
 * recalculer a la main, et chaque recalcul apportait sa chance de se tromper.
 * Desormais, chaque producteur POSTe ses colonnes ici, une ligne par jour.
 *
 * Contrat (cf. migrations/2026-09-09_stats_jour.sql) :
 *   - corps JSON : { jour: "AAAA-MM-JJ", puis n'importe quel sous-ensemble des
 *     colonnes entieres de stats_jour } ; toute cle inconnue = 400 ;
 *   - UPSERT PARTIEL sur `jour` : seules les cles presentes sont ecrites, les
 *     colonnes des autres producteurs ne sont jamais touchees. NULL en base
 *     signifie « pas encore mesure », donc on n'accepte pas de null ici : un
 *     producteur ne peut pas effacer une mesure, seulement la remplacer ;
 *   - un corps sans aucune colonne (juste `jour`) est refuse : c'est le signe
 *     qu'un producteur n'a rien su calculer, et une ligne vide ne dit rien.
 *
 * Producteurs connus : ops/stats-jour.py (VPS : Umami + robots, toutes les
 * heures pour le jour courant, 00:12 UTC pour la veille) et le script Search
 * Console du Mac (colonnes *_gsc, 2 jours de retard).
 *
 * Auth : Bearer CRON_SECRET, meme controle que les autres routes de app/api/cron.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/service-client";

const JOUR_RE = /^\d{4}-\d{2}-\d{2}$/;

// "2026-02-30" passe la regex mais n'existe pas : Date le normaliserait en
// 2026-03-02 et on ecrirait sur le mauvais jour sans s'en apercevoir.
function jourExiste(s: string): boolean {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Un compteur : entier, jamais negatif, absent si non mesure.
const compteur = z.number().int().min(0).optional();

// strictObject : toute cle hors de cette liste est refusee (400). La liste
// reproduit colonne par colonne le contrat SQL ; ajouter une colonne = l'ajouter
// dans la migration ET ici, dans le meme commit.
const corpsSchema = z.strictObject({
  jour: z
    .string()
    .regex(JOUR_RE, "jour attendu au format AAAA-MM-JJ")
    .refine(jourExiste, "jour inexistant dans le calendrier"),

  // visiteurs reels, JS execute (Umami)
  sessions: compteur,
  vues: compteur,
  sessions_depot: compteur,
  sessions_listing: compteur,
  sessions_fiche: compteur,
  sessions_accueil: compteur,
  src_google: compteur,
  src_bing: compteur,
  src_instagram: compteur,
  src_direct: compteur,
  src_autre: compteur,

  // robots, journal du proxy Traefik
  robots_declares: compteur,
  google_passages: compteur,
  google_5xx: compteur,
  aspirateur_pages: compteur,
  aspirateur_adresses: compteur,
  err_5xx_total: compteur,

  // Search Console (script Mac, decalage de 2 jours)
  clics_gsc: compteur,
  impressions_gsc: compteur,
  clics_listing_gsc: compteur,
  clics_fiche_gsc: compteur,
});

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let brut: unknown;
  try {
    brut = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const resultat = corpsSchema.safeParse(brut);
  if (!resultat.success) {
    return NextResponse.json(
      {
        error: "Corps invalide",
        problemes: resultat.error.issues.map((i) => ({
          chemin: i.path.join(".") || "(racine)",
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const { jour, ...mesures } = resultat.data;

  // Zod garde les cles explicitement `undefined` ; on ne veut envoyer a
  // PostgREST QUE les colonnes reellement fournies, sinon l'upsert ecrirait
  // NULL par-dessus la mesure d'un autre producteur.
  const colonnes = Object.keys(mesures).filter(
    (k) => mesures[k as keyof typeof mesures] !== undefined
  );
  if (colonnes.length === 0) {
    return NextResponse.json(
      { error: "Aucune colonne a ecrire : le corps ne contient que `jour`" },
      { status: 400 }
    );
  }

  const ligne: Record<string, string | number> = { jour, maj_at: new Date().toISOString() };
  for (const c of colonnes) ligne[c] = mesures[c as keyof typeof mesures] as number;

  // PostgREST (resolution=merge-duplicates) ne met a jour QUE les colonnes
  // presentes dans le corps : c'est ce qui rend l'upsert partiel.
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("stats_jour")
    .upsert(ligne, { onConflict: "jour" });

  if (error) {
    console.error("[stats-jour] upsert refuse", { jour, colonnes, message: error.message });
    return NextResponse.json(
      { error: `Ecriture refusee par la base : ${error.message}`, jour, colonnes },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, jour, colonnes });
}
