import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Workwave",
  description: "Mentions légales du site Workwave.fr.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
        Mentions légales
      </h1>
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Éditeur du site
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-1">
            <p>Workwave</p>
            <p>Adresse : Poitiers, France</p>
            <p>
              Email :{" "}
              <a
                href="mailto:contact@workwave.fr"
                className="text-[var(--accent)] hover:underline"
              >
                contact@workwave.fr
              </a>
            </p>
            <p>Site web : workwave.fr</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Hébergement
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-1">
            <p>Vercel Inc.</p>
            <p>440 N Baxter St, Coppell, TX 75019, États-Unis</p>
            <p>Site web : vercel.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Données personnelles
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les informations affichées sur les fiches professionnelles
            proviennent de sources publiques (registre Sirene de l&apos;INSEE).
            Conformément au RGPD, tout professionnel peut demander la
            suppression de sa fiche via le lien prévu à cet effet en bas de
            chaque fiche.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Propriété intellectuelle
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            L&apos;ensemble du contenu du site workwave.fr (textes, images,
            logos, design) est protégé par le droit de la propriété
            intellectuelle. Toute reproduction, même partielle, est interdite
            sans autorisation préalable.
          </p>
        </section>
      </div>
    </main>
  );
}
