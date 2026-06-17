import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  description:
    "Conditions Générales de Vente de la plateforme Workwave : service de mise en relation et de déblocage de leads pour les professionnels.",
  alternates: { canonical: "https://workwave.fr/cgv" },
};

const LAST_UPDATED = "17 juin 2026";

export default function CGVPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
        Conditions Générales de Vente
      </h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">
        Dernière mise à jour : {LAST_UPDATED}
      </p>

      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 space-y-8 text-[var(--text-secondary)] leading-relaxed">
        {/* 1. Objet */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            1. Objet et champ d&apos;application
          </h2>
          <p>
            Les présentes Conditions Générales de Vente (les «&nbsp;CGV&nbsp;»)
            régissent les services payants proposés par la plateforme Workwave
            (la «&nbsp;Plateforme&nbsp;»), éditée par l&apos;éditeur identifié dans
            les{" "}
            <a
              href="/mentions-legales"
              className="text-[var(--accent)] hover:underline"
            >
              Mentions légales
            </a>{" "}
            (ci-après «&nbsp;Workwave&nbsp;»), aux professionnels qui les
            utilisent (le «&nbsp;Professionnel&nbsp;»).
          </p>
          <p>
            Workwave est une plateforme de mise en relation entre des particuliers
            ayant un besoin de travaux ou de services (le «&nbsp;Particulier&nbsp;»)
            et des professionnels susceptibles d&apos;y répondre. Toute utilisation
            d&apos;un service payant implique l&apos;acceptation pleine et entière des
            présentes CGV. Le Professionnel reconnaît agir dans le cadre de son
            activité professionnelle.
          </p>
        </section>

        {/* 2. Définitions */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            2. Définitions
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Projet</strong> : une demande déposée par un Particulier sur
              la Plateforme, décrivant un besoin de travaux ou de services.
            </li>
            <li>
              <strong>Lead</strong> : un Projet d&apos;un Particulier, accompagné de
              ses coordonnées de contact, mis à disposition d&apos;un Professionnel.
            </li>
            <li>
              <strong>Déblocage</strong> : l&apos;action par laquelle un Professionnel
              accède, contre paiement, aux coordonnées du Particulier liées à un
              Lead.
            </li>
          </ul>
        </section>

        {/* 3. Service de déblocage */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            3. Service de déblocage de Lead (paiement à l&apos;unité)
          </h2>
          <p>
            Le Professionnel peut, à son initiative, débloquer un Lead afin
            d&apos;obtenir les coordonnées du Particulier (nom, téléphone, e-mail et,
            le cas échéant, précisions sur le Projet) telles que déclarées par ce
            dernier lors du dépôt de sa demande.
          </p>
          <p>
            Le service vendu consiste <strong>exclusivement</strong> en la mise à
            disposition de ces coordonnées et en la mise en relation qui en
            résulte. Il ne comprend ni la réalisation des travaux, ni
            l&apos;établissement d&apos;un devis, ni aucune garantie quant à la suite
            donnée par le Particulier.
          </p>
        </section>

        {/* 4. Prix et paiement */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            4. Prix et paiement
          </h2>
          <p>
            Le prix de chaque Déblocage est de <strong>9,90&nbsp;€</strong> par Lead
            (le cas échéant TVA incluse selon le régime fiscal applicable à
            l&apos;éditeur). Le prix applicable est celui affiché au moment du
            Déblocage. Le paiement est exigible immédiatement et s&apos;effectue par
            carte bancaire via notre prestataire de paiement sécurisé Stripe.
            L&apos;accès aux coordonnées est délivré dès la confirmation du paiement.
          </p>
        </section>

        {/* 5. Absence de garantie — CLAUSE CLÉ */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            5. Nature de la prestation et absence de garantie de résultat
          </h2>
          <p>
            Le Déblocage constitue une prestation de{" "}
            <strong>mise en relation</strong>, soumise à une{" "}
            <strong>obligation de moyens</strong> et non de résultat. Workwave
            fournit au Professionnel des coordonnées déclarées par le Particulier ;
            elle n&apos;intervient pas dans les échanges ultérieurs entre eux.
          </p>
          <p>
            Workwave <strong>ne garantit en aucune manière</strong> que le
            Particulier&nbsp;:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>répondra aux appels, e-mails, SMS ou messages du Professionnel&nbsp;;</li>
            <li>décrochera son téléphone ou rappellera&nbsp;;</li>
            <li>sera joignable ou disponible&nbsp;;</li>
            <li>maintiendra sa demande ou son intérêt&nbsp;;</li>
            <li>
              n&apos;aura pas déjà retenu un autre professionnel&nbsp;;
            </li>
            <li>
              acceptera un devis, signera un contrat ou donnera suite au Projet.
            </li>
          </ul>
          <p>
            Le Particulier demeure entièrement <strong>libre</strong> de répondre
            ou non au Professionnel. Workwave n&apos;a aucun moyen de le contraindre
            à décrocher, à répondre ou à donner suite, et ne saurait être tenue
            responsable de son comportement, de son inertie ou de son absence de
            réponse.
          </p>
        </section>

        {/* 6. Non remboursable — CLAUSE CLÉ */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            6. Caractère définitif du Déblocage — absence de remboursement
          </h2>
          <p>
            Chaque Déblocage est <strong>ferme et définitif</strong>. Le
            Professionnel agit dans le cadre de son activité professionnelle :
            l&apos;achat d&apos;un Lead de travaux relevant de son activité principale, le
            droit de rétractation prévu par le Code de la consommation ne lui est
            en principe pas applicable (article L.&nbsp;221-3 du Code de la
            consommation). En tout état de cause, en validant le Déblocage, le
            Professionnel <strong>demande expressément l&apos;exécution immédiate</strong>{" "}
            de la fourniture des coordonnées et reconnaît, dans la mesure où
            l&apos;article L.&nbsp;221-28 du Code de la consommation serait applicable,
            perdre son droit de rétractation dès le début de cette exécution.{" "}
            <strong>Aucun remboursement</strong> ne pourra être exigé une fois le
            Lead débloqué.
          </p>
          <p>
            En particulier, et sans que cette liste soit limitative,{" "}
            <strong>
              ne constituent pas un motif de remboursement
            </strong>{" "}
            :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              l&apos;absence de réponse, de prise d&apos;appel, de rappel ou de
              joignabilité du Particulier&nbsp;;
            </li>
            <li>le changement d&apos;avis ou l&apos;abandon du Projet par le Particulier&nbsp;;</li>
            <li>
              le fait que le Particulier ait déjà confié son Projet à un autre
              professionnel&nbsp;;
            </li>
            <li>
              l&apos;absence de devis, de rendez-vous, de signature ou de conclusion
              d&apos;un contrat&nbsp;;
            </li>
            <li>
              un délai de prise de contact du Professionnel jugé trop tardif par le
              Particulier&nbsp;;
            </li>
            <li>
              une divergence d&apos;appréciation sur le budget, la nature ou
              l&apos;ampleur du Projet par rapport à ce qui a été déclaré.
            </li>
          </ul>
          <p>
            <strong>Garantie «&nbsp;coordonnée inexploitable&nbsp;».</strong>{" "}
            Si la coordonnée téléphonique principale d&apos;un Lead s&apos;avère manifestement
            inexploitable (numéro inexistant ou non attribué), Workwave procède,
            sur demande adressée à contact@workwave.fr dans les 7 jours suivant le
            Déblocage et après vérification, au <strong>remplacement du Lead</strong>{" "}
            par un Lead équivalent ou, à défaut de Lead disponible, à
            l&apos;octroi d&apos;un <strong>avoir d&apos;un montant équivalent</strong>. Cette
            garantie couvre exclusivement l&apos;inexploitabilité technique de la
            coordonnée ; elle ne s&apos;applique pas à l&apos;absence de réponse, à
            l&apos;injoignabilité ou au comportement du Particulier, qui relèvent du
            risque normal du service et ne donnent lieu à aucun remboursement,
            remplacement ou avoir.
          </p>
        </section>

        {/* 7. Responsabilité */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            7. Limitation de responsabilité
          </h2>
          <p>
            Workwave agit exclusivement en qualité d&apos;<strong>intermédiaire
            technique</strong> de mise en relation. Elle n&apos;est partie à aucune
            relation, négociation, devis, contrat, prestation ou paiement conclu
            entre le Professionnel et le Particulier, et n&apos;exerce aucun contrôle
            sur leur déroulement.
          </p>
          <p>
            Workwave ne saurait être tenue responsable des litiges, retards,
            inexécutions, défauts de paiement, malfaçons ou de tout différend
            survenant entre le Professionnel et le Particulier. En cas de litige,
            les parties s&apos;adressent aux voies de recours habituelles (médiation,
            juridictions compétentes).
          </p>
          <p>
            En toute hypothèse, et dans la mesure permise par la loi, la
            responsabilité de Workwave au titre d&apos;un Déblocage, si elle était
            engagée, est limitée au montant effectivement payé pour ce Déblocage,
            soit 9,90&nbsp;€. Cette limitation ne s&apos;applique pas en cas de faute
            lourde ou dolosive de Workwave, ni dans les cas où la loi en interdit
            la limitation.
          </p>
        </section>

        {/* 8. Obligations du professionnel */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            8. Obligations du Professionnel
          </h2>
          <p>Le Professionnel s&apos;engage à&nbsp;:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              contacter le Particulier dans un délai raisonnable et de manière
              professionnelle&nbsp;;
            </li>
            <li>
              utiliser les coordonnées du Particulier <strong>uniquement</strong>{" "}
              pour répondre au Projet concerné, à l&apos;exclusion de toute autre
              prospection, cession ou réutilisation&nbsp;;
            </li>
            <li>
              fournir des informations exactes sur son entreprise et ses
              qualifications, et respecter la réglementation applicable à son
              activité.
            </li>
          </ul>
        </section>

        {/* 9. Données personnelles */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            9. Données personnelles
          </h2>
          <p>
            Les coordonnées du Particulier transmises lors d&apos;un Déblocage sont
            confiées au Professionnel pour la seule finalité de répondre à la
            demande du Particulier. Le Professionnel en devient responsable de
            traitement et s&apos;engage à les traiter conformément au RGPD, notamment à
            ne pas les conserver au-delà du nécessaire ni les utiliser à d&apos;autres
            fins.
          </p>
        </section>

        {/* 10. Divers */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            10. Modification, droit applicable et litiges
          </h2>
          <p>
            Workwave se réserve le droit de modifier les présentes CGV à tout
            moment. La version applicable est celle en vigueur au jour du
            Déblocage. Toute réclamation relative à un Déblocage doit être adressée
            à contact@workwave.fr ; Workwave s&apos;engage à y répondre dans un délai
            raisonnable. Les présentes CGV sont soumises au droit français. À
            défaut de résolution amiable, tout litige relève de la compétence des
            juridictions françaises compétentes.
          </p>
        </section>

        <p className="text-sm text-[var(--text-tertiary)] pt-2 border-t border-[var(--card-border)]">
          Pour toute question, contactez-nous à{" "}
          <a
            href="mailto:contact@workwave.fr"
            className="text-[var(--accent)] hover:underline"
          >
            contact@workwave.fr
          </a>
        </p>
      </div>
    </main>
  );
}
