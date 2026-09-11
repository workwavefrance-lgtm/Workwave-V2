import Link from "next/link";

/**
 * Section « Déposez votre projet » de l'accueil.
 *
 * 11/09/2026, decision Willy sur maquette : le bouton « Deposer mon projet »
 * vivait entasse sous la barre de recherche du hero, et la barre elle-meme
 * envoyait au depot. Les deux se genaient : on ne savait plus si on cherchait
 * un artisan ou si on deposait un projet. Desormais la recherche mene aux
 * listes d'artisans, et le depot a SA section, juste apres le hero, avec un
 * titre qui dit ce qui se passe et trois etapes.
 *
 * Textes valides mot pour mot par Willy. Rien de promis qui ne soit vrai :
 * pas de « 3 devis garantis » (le nombre depend des artisans reclames dans la
 * zone, cf. lecon L61), pas de « comparer les devis » (mesure GSC du 11/09 :
 * 25 impressions, 0 clic sur « comparer » en 90 jours, ce mot se travaille
 * sur les pages metier x ville, pas ici).
 *
 * Les titres d'etapes sont des H3 sous le H2 de la section : ils entrent dans
 * le plan de la page pour Google, volontairement.
 */
const ETAPES = [
  {
    titre: "Déposez votre projet",
    texte: "Le métier, votre ville, ce qu'il y a à faire, pour quand. Deux minutes.",
  },
  {
    titre: "Les artisans de votre secteur vous contactent",
    texte: "Ceux qui interviennent près de chez vous vous appellent ou vous écrivent pour parler du projet.",
  },
  {
    titre: "Vous voyez directement avec eux",
    texte: "Rendez-vous, devis, comparaison : en direct avec chaque artisan, sans obligation.",
  },
];

export default function DepotSection() {
  return (
    <section className="py-16 px-4 border-t border-[var(--border-color)]">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-[color-mix(in_srgb,var(--accent)_7%,var(--bg-secondary))] p-6 sm:p-10 lg:p-12 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] text-[var(--text-primary)] mb-4">
              Déposez votre projet, les artisans de votre secteur vous contactent.
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-primary)] max-w-xl mb-7">
              Vous décrivez ce que vous voulez faire. Les artisans qui interviennent
              dans votre secteur le reçoivent et vous appellent pour voir le projet
              directement avec vous. Gratuit, sans engagement.
            </p>
            <Link
              prefetch={false}
              href="/deposer-projet"
              className="inline-flex w-full sm:w-auto items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white text-lg font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Déposer mon projet (gratuit)
            </Link>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              2 minutes · vos coordonnées vont uniquement aux artisans qui traitent
              votre demande, jamais affichées publiquement, jamais revendues.
            </p>
          </div>

          <ol className="space-y-3">
            {ETAPES.map((etape, i) => (
              <li
                key={etape.titre}
                className="flex gap-4 items-start rounded-2xl bg-[var(--bg-primary)] border border-[var(--card-border)] p-4 sm:p-5"
              >
                <span
                  className="shrink-0 w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-sm flex items-center justify-center"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] leading-snug">
                    {etape.titre}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{etape.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
