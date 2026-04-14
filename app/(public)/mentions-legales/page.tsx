import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { getOrganizationSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mentions legales",
  description: "Mentions legales du site Workwave.fr. Editeur, hebergeur, RGPD.",
  alternates: { canonical: "https://workwave.fr/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <JsonLd data={getOrganizationSchema(BASE_URL)} />
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
            Données personnelles et RGPD
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-3">
            <p>
              Les informations affichées sur les fiches professionnelles
              proviennent de sources publiques (registre Sirene de l&apos;INSEE).
              Conformément au RGPD, tout professionnel peut demander la
              suppression de sa fiche via le lien prévu à cet effet en bas de
              chaque fiche.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Responsable du traitement :</strong>{" "}
              Workwave SAS, 3 rue des Rosiers, 86110 Craon. Contact DPO :{" "}
              <a href="mailto:contact@workwave.fr" className="text-[var(--accent)] hover:underline">
                contact@workwave.fr
              </a>
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Bases légales :</strong>{" "}
              Intérêt légitime (article 6.1.f du RGPD) pour le référencement
              des professionnels à partir de données publiques.
              Consentement pour les particuliers déposant un projet.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Durée de conservation :</strong>{" "}
              Les données des professionnels sont conservées pendant 3 ans
              à compter du dernier contact. Les données des projets déposés
              par les particuliers sont conservées 2 ans après la clôture du
              projet. Toute personne peut demander la suppression anticipée
              de ses données.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Vos droits :</strong>{" "}
              Conformément au RGPD, vous disposez des droits d&apos;accès,
              de rectification, de suppression, d&apos;opposition, de
              limitation du traitement et de portabilité de vos données.
              Pour exercer ces droits, contactez{" "}
              <a href="mailto:contact@workwave.fr" className="text-[var(--accent)] hover:underline">
                contact@workwave.fr
              </a>.
              En cas de litige, vous pouvez saisir la CNIL (cnil.fr).
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Prospection commerciale B2B
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-3">
            <p>
              Workwave peut adresser des communications commerciales par
              email aux professionnels dont les coordonnées sont accessibles
              publiquement (registre Sirene, sites web). Ces communications
              sont envoyées dans le cadre du régime de prospection B2B
              (article L34-5 du Code des postes et des communications
              électroniques), qui autorise la prospection par email auprès
              de professionnels sans consentement préalable, dès lors que le
              message est en rapport avec leur activité professionnelle.
            </p>
            <p>
              Chaque email contient un lien de désinscription permettant de
              ne plus recevoir de communications de la campagne en cours,
              ainsi qu&apos;un lien de désinscription globale permettant de ne
              plus jamais recevoir d&apos;emails de Workwave.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Sous-traitant email :</strong>{" "}
              Les emails transactionnels et de prospection sont envoyés via
              Brevo (Sendinblue SAS), 106 boulevard Haussmann, 75008 Paris.
              Brevo agit en tant que sous-traitant au sens du RGPD.
              Politique de confidentialité Brevo :{" "}
              <a
                href="https://www.brevo.com/fr/legal/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                brevo.com/fr/legal/privacypolicy
              </a>.
            </p>
          </div>
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
