/**
 * Point de controle de sante du conteneur.
 *
 * Docker interroge cette adresse toutes les 30 s (cf. HEALTHCHECK du Dockerfile).
 * Tant qu'elle ne repond pas 200, Coolify marque le conteneur "unhealthy" et
 * Traefik CESSE de lui envoyer des visiteurs.
 *
 * Sans ce point de controle (etat du 07/08/2026), Traefik routait le trafic vers
 * le conteneur meme pendant son demarrage et meme quand il mourait : chaque
 * redemarrage envoyait donc des visiteurs sur une erreur. Il y a eu 30 redemarrages.
 *
 * Volontairement le plus leger possible : aucune requete a la base, aucun rendu
 * de page. On teste que le serveur Node repond, rien d'autre. Un controle qui
 * interroge la base ferait tomber tout le site quand la base ralentit.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ok: true, at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
