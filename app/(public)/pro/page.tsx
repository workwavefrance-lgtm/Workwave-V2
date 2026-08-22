import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { getFaqSchema } from "@/lib/utils/schema";
import HeroSiretLookup from "@/components/landing/HeroSiretLookup";
import CompteurAnime from "@/components/pro/landing/CompteurAnime";
import PileOffre, { type LigneOffre } from "@/components/pro/landing/PileOffre";
import BarresAnnee from "@/components/pro/landing/BarresAnnee";
import SimulateurCout from "@/components/pro/landing/SimulateurCout";

export const metadata: Metadata = {
  title: "9,90 € le client, sans abonnement · Workwave.fr Pro",
  description:
    "Recevez gratuitement les chantiers de votre commune par email. Vous ne payez que les clients que vous decidez d'appeler : 9,90 EUR TTC, vos 2 premiers projets offerts. Aucun abonnement, aucune commission, aucun engagement.",
  alternates: { canonical: "https://workwave.fr/pro" },
  openGraph: {
    type: "website",
    title: "9,90 € le client, sans abonnement · Workwave.fr Pro",
    description:
      "Vos 2 premiers projets sont offerts. Fiche gratuite, pas d'abonnement, zero commission, puis 9,90 EUR TTC par client que vous voulez appeler.",
    url: "https://workwave.fr/pro",
  },
};

// ============================================================
// Donnees
//
// Tous les tarifs concurrents ci-dessous sont SOURCES : releve du
// 22 aout 2026, six sources publiques par plateforme (conditions
// generales, comparatifs sectoriels, avis et forums d'artisans).
// Ne jamais y toucher sans re-sourcer : une affirmation chiffree
// fausse sur un concurrent releve de la publicite comparative
// trompeuse (L121-8 du code de la consommation).
// ============================================================

const MARCHE = [
  {
    nom: "Habitatpresto",
    montant: "186 à 372 €",
    unite: "par mois, chantier ou pas. Ce que les artisans déclarent réellement payer.",
    revers: "6 à 12 mois d'engagement, soit 1 116 € minimum",
  },
  {
    nom: "Travaux.com",
    montant: "20 à 80 €",
    unite: "le contact, selon la taille du chantier. Fourchette constatée par les artisans.",
    revers: "Plus le chantier est gros, plus le contact est cher",
  },
];

const OFFRE: LigneOffre[] = [
  {
    titre: "Vos 2 premiers projets",
    detail:
      "Offerts. Sans carte bancaire, sans engagement. Vous jugez sur pièces avant de payer.",
    valeur: "0 €",
    souligne: true,
  },
  {
    titre: "Votre page professionnelle",
    detail:
      "Photo de couverture, logo, vos chantiers en photo, vos coordonnées. Référencée sur Google.",
    valeur: "Compris",
  },
  {
    titre: "Les chantiers de votre zone, par email",
    detail: "Métier, commune, urgence, budget, description écrite par le client.",
    valeur: "Compris",
  },
  {
    titre: "Votre rayon d'intervention, au kilomètre",
    detail: "Vous fixez la distance. Un chantier hors zone ne vous est jamais envoyé.",
    valeur: "Compris",
  },
  {
    titre: "Aucun abonnement, aucune commission",
    detail:
      "Pas de prélèvement mensuel. Pas de pourcentage sur vos chantiers. Rien à résilier.",
    valeur: "0 €",
  },
];

const ETAPES = [
  {
    n: "01",
    titre: "Vous entrez votre numéro",
    texte:
      "Votre fiche existe déjà, créée à partir du registre officiel. Elle apparaît en quelques secondes.",
  },
  {
    n: "02",
    titre: "Vous la complétez",
    texte:
      "Couverture, logo, photos de chantier. Depuis votre téléphone, sur le chantier ou dans la camionnette.",
  },
  {
    n: "03",
    titre: "Vous recevez les chantiers",
    texte:
      "Par email, dès qu'un particulier de votre zone dépose un projet de votre métier.",
  },
  {
    n: "04",
    titre: "Vous appelez, ou pas",
    texte:
      "Le chantier vous intéresse, vous débloquez le numéro pour 9,90 €. Sinon vous passez, et ça ne coûte rien.",
  },
];

const SANS = [
  "Aucune application à installer",
  "Aucune formation",
  "Aucun commercial à rappeler",
  "Aucun contrat à signer",
  "Aucune carte bancaire pour commencer",
];

const faqs = [
  {
    question: "Combien ça coûte, exactement ?",
    answer:
      "Rien pour créer et garder votre fiche, rien pour recevoir les chantiers de votre zone par email. Vous payez 9,90 € TTC uniquement quand vous décidez de débloquer les coordonnées d'un client, et vos 2 premiers projets sont offerts. Aucun abonnement, aucune commission sur vos chantiers, aucun engagement.",
  },
  {
    question: "Comment réclamer ma fiche ?",
    answer:
      "Entrez votre numéro d'entreprise (SIRET à 14 chiffres en France, BCE à 10 chiffres en Belgique) dans le champ en haut de cette page. Si votre fiche existe, vous la réclamez avec un code envoyé par email. Si elle n'existe pas encore, on vous emmène directement la créer. L'opération prend moins de deux minutes.",
  },
  {
    question: "Le prix change-t-il selon le chantier ?",
    answer:
      "Non. C'est 9,90 € que le chantier fasse 300 € ou 50 000 €, quel que soit votre métier, votre département et le mois de l'année. C'est la différence principale avec les plateformes qui facturent le contact en fonction de la taille du projet.",
  },
  {
    question: "Combien de chantiers vais-je recevoir ?",
    answer:
      "Vous recevez par email tous les projets publiés dans votre métier et dans votre rayon d'intervention, sans limite et sans frais. À vous de choisir ensuite lesquels débloquer pour 9,90 €, selon ceux qui vous intéressent vraiment.",
  },
  {
    question: "Que se passe-t-il si je ne débloque aucun client ?",
    answer:
      "Rien. Votre page reste en ligne gratuitement et vous continuez à recevoir les chantiers de votre zone. Un mois sans projet intéressant est un mois à zéro euro, contrairement à un abonnement qui est prélevé que le téléphone sonne ou non.",
  },
  {
    question: "Mes coordonnées sont-elles partagées ?",
    answer:
      "Vos coordonnées professionnelles (téléphone, email) sont visibles sur votre fiche publique une fois que vous l'avez réclamée. Les coordonnées des particuliers ne vous sont communiquées qu'au moment où vous débloquez un projet.",
  },
];

// ============================================================
// Petits composants de page
// ============================================================

function Sourcil({ children, clair = false }: { children: React.ReactNode; clair?: boolean }) {
  return (
    <p
      className={`font-mono text-[11.5px] tracking-[0.14em] uppercase mb-3 ${
        clair ? "text-white/65" : "text-[var(--accent)]"
      }`}
    >
      {children}
    </p>
  );
}

function BlocCta({ accroche, note }: { accroche: string; note: string }) {
  return (
    <div className="text-center mt-11">
      <p className="text-[19px] font-semibold tracking-tight text-[var(--text-primary)] mb-4 text-balance">
        {accroche}
      </p>
      <Link
        href="#trouver-ma-fiche"
        className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[15.5px] font-semibold px-8 py-3.5 rounded-full transition-all duration-250 hover:-translate-y-0.5"
      >
        Trouver ma fiche <span aria-hidden="true">&rarr;</span>
      </Link>
      <small className="block mt-3 text-[12.5px] text-[var(--text-tertiary)]">{note}</small>
    </div>
  );
}

function BlocCtaSombre({ accroche, note }: { accroche: string; note: string }) {
  return (
    <div className="text-center mt-11">
      <p className="text-[19px] font-semibold tracking-tight text-white mb-4 text-balance">
        {accroche}
      </p>
      <Link
        href="#trouver-ma-fiche"
        className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[15.5px] font-semibold px-8 py-3.5 rounded-full transition-all duration-250 hover:-translate-y-0.5"
      >
        Trouver ma fiche <span aria-hidden="true">&rarr;</span>
      </Link>
      <small className="block mt-3 text-[12.5px] text-white/55">{note}</small>
    </div>
  );
}

function Sceau({ haut, gros, bas }: { haut: string; gros: string; bas: string }) {
  return (
    <div
      aria-hidden="true"
      className="w-[152px] h-[152px] mx-auto rounded-full border-[3px] border-dashed border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] flex flex-col items-center justify-center text-center -rotate-6 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105"
    >
      <span className="font-mono text-[9px] tracking-[0.14em]">{haut}</span>
      <b className="text-[21px] font-black tracking-tight my-0.5">{gros}</b>
      <span className="font-mono text-[9px] tracking-[0.14em]">{bas}</span>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function ProLandingPage() {
  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section id="trouver-ma-fiche" className="scroll-mt-24 px-4 pt-24 pb-20 sm:pt-28 sm:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-2.5 mb-11">
            <span className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-white text-[13.5px] font-semibold px-4 py-2 rounded-full">
              <b className="font-bold">2</b> premiers projets offerts
            </span>
            {["0 abonnement", "0 commission", "0 engagement"].map((b) => (
              <span
                key={b}
                className="inline-flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-[13.5px] font-medium px-4 py-2 rounded-full"
              >
                {b}
              </span>
            ))}
          </div>

          <h1 className="text-[32px] sm:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] leading-[1.07] tracking-tight mb-7 max-w-[15ch] mx-auto text-balance">
            9,90 € le client.{" "}
            <span className="text-[var(--accent)]">Et ce prix ne bouge jamais.</span>
          </h1>

          <p className="text-[16.5px] sm:text-xl text-[var(--text-secondary)] max-w-[44ch] mx-auto leading-relaxed mb-11">
            Aucun abonnement. Aucune commission. Vous ne payez que les clients que vous
            décidez d&apos;appeler.
          </p>

          <HeroSiretLookup />
        </div>
      </section>

      {/* ---------- Compteurs ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border-color)] border-y border-[var(--border-color)]">
        {[
          { v: 35163, s: "", l: "communes couvertes" },
          { v: 107, s: "", l: "départements" },
          { v: 57, s: "", l: "métiers" },
        ].map((c) => (
          <div key={c.l} className="bg-[var(--bg-primary)] px-5 py-8 text-center">
            <b className="block text-[26px] sm:text-4xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
              <CompteurAnime valeur={c.v} suffixe={c.s} />
            </b>
            <span className="block text-[13px] text-[var(--text-secondary)] mt-1">{c.l}</span>
          </div>
        ))}
        <div className="bg-[var(--bg-primary)] px-5 py-8 text-center">
          <b className="block text-[26px] sm:text-4xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
            9,90 €
          </b>
          <span className="block text-[13px] text-[var(--text-secondary)] mt-1">
            le contact, jamais plus
          </span>
        </div>
      </div>

      {/* ---------- Le prix ---------- */}
      <section className="bg-[#101010] border-y border-white/10 px-4 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <Sourcil clair>Le marché, tarifs à l&apos;appui</Sourcil>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-[1.05] tracking-tight mb-4 max-w-[20ch]">
            Un prix qui ne bouge jamais.
          </h2>
          <p className="text-zinc-400 max-w-[56ch] mb-11 leading-relaxed">
            Chez les autres, la facture monte avec la taille du chantier, le métier et le
            département. Le beau chantier est celui qui coûte le plus cher. Voici ce
            qu&apos;un artisan paie réellement, d&apos;après six sources par plateforme
            relevées le 22 août 2026.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {MARCHE.map((m) => (
              <div
                key={m.nom}
                className="flex flex-col border border-white/12 rounded-[20px] bg-white/[0.03] p-6"
              >
                <h3 className="text-[15px] font-semibold text-zinc-400 mb-3">{m.nom}</h3>
                <div className="text-3xl sm:text-[38px] font-extrabold tracking-tight tabular-nums text-zinc-200 leading-none">
                  {m.montant}
                </div>
                <div className="text-[13px] text-zinc-500 mt-2 leading-snug">{m.unite}</div>
                <div className="mt-auto pt-4 text-[12.5px] text-red-400">{m.revers}</div>
              </div>
            ))}

            <div className="relative flex flex-col border border-[var(--accent)] rounded-[20px] p-6 bg-gradient-to-b from-[rgba(255,90,54,0.2)] to-[rgba(255,90,54,0.05)] md:scale-[1.04]">
              <span className="absolute -top-3 left-6 bg-[var(--accent)] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Workwave.fr
              </span>
              <h3 className="text-[15px] font-bold text-white mb-3">Le même contact</h3>
              <div className="text-[40px] sm:text-[60px] font-extrabold tracking-tight tabular-nums text-white leading-none">
                9,90 €
              </div>
              <div className="text-[13px] text-white/85 mt-2 leading-snug">
                quel que soit le chantier, le métier, le département et le mois. Affiché
                avant que vous décidiez.
              </div>
              <div className="mt-auto pt-4 text-[12.5px] font-semibold text-emerald-300">
                Aucun engagement, 2 premiers offerts
              </div>
            </div>
          </div>

          <BlocCtaSombre
            accroche="Votre fiche est déjà en ligne. Réclamez-la, elle est à vous."
            note="Deux minutes, votre numéro d'entreprise suffit."
          />

          <p className="mt-6 text-[12px] text-zinc-600 max-w-[80ch] leading-relaxed">
            Tarifs concurrents relevés le 22 août 2026, six sources publiques par
            plateforme : conditions générales, comparatifs sectoriels, avis et forums
            d&apos;artisans. Habitatpresto ne publie pas de tarif fixe, il varie selon le
            métier et le département, et les montants ci-dessus sont ceux que les artisans
            déclarent payer. StarOfService fonctionne par crédits, de 2 € à 12 € le contact.
            Quotatis, hemea et AlloTravaux ne publient aucun tarif vérifiable.
          </p>
        </div>
      </section>

      {/* ---------- Ce que vous obtenez ---------- */}
      <section className="px-4 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <Sourcil>Ce que vous obtenez</Sourcil>
          <h2 className="text-[27px] sm:text-[42px] font-extrabold text-[var(--text-primary)] leading-[1.08] tracking-tight mb-3">
            Tout est compris. Rien n&apos;est facturé.
          </h2>
          <p className="text-[var(--text-secondary)] max-w-[58ch] mb-9 leading-relaxed">
            Pas de formule, pas d&apos;option, pas de palier. Une seule ligne peut vous être
            facturée sur toute la page, et c&apos;est vous qui décidez quand.
          </p>

          <PileOffre lignes={OFFRE} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div className="border border-[var(--accent)] bg-[var(--accent-muted)] rounded-[18px] px-6 py-5">
              <span className="block text-[13.5px] text-[var(--text-secondary)]">
                Vos 2 premiers projets, offerts. Ce que vous sortez avant ça
              </span>
              <b className="block text-[34px] font-extrabold tracking-tight tabular-nums text-[var(--accent)] mt-1">
                0 €
              </b>
              <i className="block not-italic text-[12.5px] font-semibold text-[var(--accent)] mt-2">
                Sans carte bancaire, sans engagement, sans risque.
              </i>
            </div>
            <div className="border border-[var(--border-color)] rounded-[18px] px-6 py-5">
              <span className="block text-[13.5px] text-[var(--text-secondary)]">
                Avec un abonnement à 6 mois d&apos;engagement
              </span>
              <b className="block text-[34px] font-extrabold tracking-tight tabular-nums text-[var(--text-secondary)] mt-1">
                1 116 € minimum
              </b>
              <i className="block not-italic text-[12.5px] text-[var(--text-tertiary)] mt-2">
                À sortir avant votre premier chantier.
              </i>
            </div>
          </div>

          <BlocCta
            accroche="Votre page, vos chantiers, vos 2 premiers projets. Tout est prêt."
            note="Sans carte bancaire, sans engagement."
          />
        </div>
      </section>

      {/* ---------- Zero risque ---------- */}
      <section className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] px-4 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <Sourcil>Ce que vous risquez en essayant</Sourcil>
            <h2 className="text-[27px] sm:text-[42px] font-extrabold text-[var(--text-primary)] leading-[1.08] tracking-tight mb-9">
              Rien. Absolument rien.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group border border-[var(--border-color)] rounded-[22px] bg-[var(--bg-primary)] px-7 py-8 text-center transition-all duration-250 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg">
              <Sceau haut="RECEVOIR" gros="GRATUIT" bas="A VIE" />
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mt-6 mb-2.5 text-balance">
                Recevoir les chantiers ne coûte jamais rien.
              </h3>
              <p className="text-[15px] text-[var(--text-secondary)] text-left leading-relaxed">
                Tous les projets de votre zone arrivent dans votre boîte mail, gratuitement,
                aussi longtemps que vous le voulez. Vous ne sortez un euro que le jour où un
                chantier vous plaît assez pour vouloir le numéro du client. Zéro chantier
                intéressant ce mois-ci ? Zéro euro.
              </p>
            </div>

            <div className="group border border-[var(--border-color)] rounded-[22px] bg-[var(--bg-primary)] px-7 py-8 text-center transition-all duration-250 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-lg">
              <Sceau haut="2 PREMIERS PROJETS" gros="OFFERTS" bas="SANS CARTE" />
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mt-6 mb-2.5 text-balance">
                Vos deux premiers projets sont offerts.
              </h3>
              <p className="text-[15px] text-[var(--text-secondary)] text-left leading-relaxed">
                Pas de carte bancaire à donner, pas de période d&apos;essai qui se transforme
                en prélèvement, pas de contrat à résilier. Vous débloquez vos deux premiers
                projets, vous appelez les clients, et vous jugez sur pièces avant de payer
                quoi que ce soit.
              </p>
            </div>
          </div>

          <p className="text-center text-[var(--text-tertiary)] text-sm max-w-[62ch] mx-auto mt-7">
            Rien à résilier non plus : votre page reste en ligne gratuitement, que vous
            débloquiez un client ou aucun.
          </p>

          <BlocCta
            accroche="Réclamez votre fiche, débloquez vos 2 premiers projets."
            note="Vos 2 premiers projets sont offerts, sans carte bancaire."
          />
        </div>
      </section>

      {/* ---------- Trésorerie ---------- */}
      <section className="px-4 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <Sourcil>Votre trésorerie</Sourcil>
          <h2 className="text-[27px] sm:text-[42px] font-extrabold text-[var(--text-primary)] leading-[1.08] tracking-tight mb-3">
            Un mois sans chantier ne doit rien vous coûter.
          </h2>
          <p className="text-[var(--text-secondary)] max-w-[60ch] mb-8 leading-relaxed">
            Janvier, février, un arrêt, un creux. L&apos;abonnement tombe quand même, tous
            les mois, que le téléphone sonne ou non. Chez nous, un mois sans contact pris,
            c&apos;est zéro euro. Voici la même année, vue des deux côtés.
          </p>

          <BarresAnnee />

          <div className="relative overflow-hidden mt-8 rounded-[28px] px-8 py-12 text-center text-white bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] shadow-[0_18px_50px_rgba(255,90,54,0.28)]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-20%,rgba(255,255,255,0.28),transparent_60%)]"
            />
            <span className="relative block font-mono text-[11.5px] tracking-[0.18em] uppercase text-white/80">
              Ce que vous gardez
            </span>
            <b className="relative block text-[60px] sm:text-[100px] font-black tracking-[-0.055em] leading-[0.92] tabular-nums my-3">
              <CompteurAnime valeur={1935} suffixe=" €" duree={1800} />
            </b>
            <span className="relative block text-lg sm:text-2xl font-bold tracking-tight">
              sur votre compte, la première année
            </span>
            <span className="relative block mt-5 pt-5 border-t border-white/25 text-[14.5px] text-white/90">
              Et jusqu&apos;à 4 167 € si vous êtes dans la fourchette haute du marché.
            </span>
          </div>

          <p className="text-[12.5px] text-[var(--text-tertiary)] mt-4 leading-relaxed">
            Exemple sur 12 mois avec 3 mois creux et 30 contacts pris dans l&apos;année. Le
            montant de l&apos;abonnement retenu ici, 186 € par mois, est la borne la plus
            basse de ce que les artisans déclarent payer. Relevé le 22 août 2026, six
            sources par plateforme. Dans la fourchette haute, 372 € par mois, l&apos;année
            coûte 4 464 €.
          </p>

          <BlocCta
            accroche="Gardez cet argent sur votre compte plutôt que sur celui d'une plateforme."
            note="Aucun prélèvement mensuel, jamais."
          />
        </div>
      </section>

      {/* ---------- Simplicité ---------- */}
      <section className="bg-[#101010] border-y border-white/10 px-4 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <Sourcil clair>La simplicité</Sourcil>
          <h2 className="text-3xl sm:text-[46px] font-extrabold text-white leading-[1.06] tracking-tight mb-4 max-w-[20ch]">
            Vous savez déjà vous en servir.
          </h2>
          <p className="text-zinc-400 max-w-[56ch] mb-10 leading-relaxed">
            Rien à installer, rien à apprendre, rien à surveiller. Le chantier arrive dans
            votre boîte mail, vous le lisez, vous décidez. C&apos;est tout le mode
            d&apos;emploi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/12 rounded-[22px] overflow-hidden">
            {ETAPES.map((e, i) => (
              <div
                key={e.n}
                className={`px-6 py-7 transition-colors duration-250 hover:bg-[rgba(255,90,54,0.08)] ${
                  i > 0 ? "border-t sm:border-t-0 sm:border-l border-white/10" : ""
                } ${i === 2 ? "lg:border-l sm:border-t lg:border-t-0" : ""}`}
              >
                <span className="inline-block font-mono text-[11.5px] text-[var(--accent)] border border-[var(--accent)] rounded-md px-2 py-0.5 mb-4">
                  {e.n}
                </span>
                <h3 className="text-[17px] font-bold tracking-tight text-white mb-1.5">
                  {e.titre}
                </h3>
                <p className="text-[14.5px] text-zinc-400 leading-relaxed">{e.texte}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5 mt-7">
            {SANS.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 border border-white/14 rounded-full px-4 py-2 text-[13.5px] text-zinc-400"
              >
                <i className="not-italic font-bold text-red-400">&times;</i> {t}
              </span>
            ))}
          </div>

          <BlocCtaSombre
            accroche="Commencez maintenant, vous serez prêt avant la fin de votre pause."
            note="Étape 1 : votre numéro d'entreprise."
          />
        </div>
      </section>

      {/* ---------- Le moment où vous décidez ---------- */}
      <section className="px-4 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div>
            <Sourcil>Le moment où vous décidez</Sourcil>
            <h2 className="text-[27px] sm:text-[42px] font-extrabold text-[var(--text-primary)] leading-[1.08] tracking-tight mb-3">
              Vous lisez le chantier, et vous savez déjà ce qu&apos;il coûte.
            </h2>
            <p className="text-[var(--text-secondary)] max-w-[58ch] mb-8 leading-relaxed">
              Le projet arrive en entier : métier, commune, urgence, budget, description
              écrite par le client. Comme ailleurs. Ce qui change, c&apos;est le prix
              affiché en bas du mail. Ailleurs il monte avec la taille du chantier, donc les
              meilleurs sont les plus chers. Ici, c&apos;est 9,90 €, le même qu&apos;hier et
              que demain.
            </p>
            <ul className="list-none p-0 m-0">
              {[
                [
                  "Le prix ne dépend pas de la taille du chantier",
                  "Une toiture à 15 000 € vous coûte 9,90 €. Un dépannage à 300 € aussi.",
                ],
                [
                  "Ni de votre métier, ni de votre département",
                  "Pas de tarif à la tête du client, pas de zone plus chère qu'une autre.",
                ],
                [
                  "Pas pour vous ? Vous ne payez rien",
                  "Trop loin, mauvais métier, budget hors sujet : vous passez, et ça reste gratuit.",
                ],
              ].map(([titre, detail]) => (
                <li
                  key={titre}
                  className="grid grid-cols-[26px_1fr] gap-3 py-3.5 border-t border-[var(--border-color)] first:border-t-0"
                >
                  <i className="not-italic text-[17px] text-emerald-600 dark:text-emerald-400">
                    &#10003;
                  </i>
                  <div>
                    <b className="block font-semibold text-[var(--text-primary)] mb-0.5">
                      {titre}
                    </b>
                    <span className="text-[14.5px] text-[var(--text-secondary)] leading-relaxed">
                      {detail}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Aperçu de l'email de chantier. Les coordonnées sont floutées :
              c'est exactement ce que voit un pro avant de débloquer. */}
          <div className="border border-[var(--border-color)] rounded-[18px] bg-[var(--bg-primary)] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] font-mono text-[12.5px] text-[var(--text-tertiary)]">
              contact@workwave.fr &middot; Nouveau chantier
            </div>
            <div className="p-6">
              <h3 className="text-[17px] font-bold tracking-tight text-[var(--text-primary)] mb-0.5">
                Couvreur à Valenciennes
              </h3>
              <p className="text-[13.5px] text-[var(--text-secondary)] mb-4">
                Nord (59) &middot; déposé il y a 2 heures
              </p>
              <dl className="m-0">
                {[
                  ["Urgence", "Cette semaine", false],
                  ["Budget", "5 000 € à 15 000 €", false],
                  [
                    "Chantier",
                    "Réfection complète d'une toiture en tuiles plates, environ 120 m², charpente à vérifier",
                    false,
                  ],
                  ["Prénom", "Christian", false],
                  ["Téléphone", "06 12 34 56 78", true],
                  ["Email", "christian.b@exemple.fr", true],
                ].map(([cle, val, floute]) => (
                  <div
                    key={cle as string}
                    className="grid grid-cols-[104px_1fr] gap-3 py-2 border-t border-[var(--border-color)] first:border-t-0 text-[14.5px]"
                  >
                    <dt className="text-[var(--text-secondary)]">{cle as string}</dt>
                    <dd
                      className={`m-0 font-medium text-[var(--text-primary)] ${
                        floute ? "blur-[5px] select-none" : ""
                      }`}
                    >
                      {val as string}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 bg-[var(--accent-muted)] border border-[var(--accent)] rounded-xl px-4 py-3 text-[13.5px] text-[var(--text-primary)]">
                Coordonnées visibles pour{" "}
                <b className="text-[var(--accent)]">9,90 €</b>. Vos 2 premiers sont offerts.
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <BlocCta
            accroche="Recevez le prochain chantier de votre commune."
            note="Recevoir est gratuit. Vous ne payez que si un client vous intéresse."
          />
        </div>
      </section>

      {/* ---------- Simulateur ---------- */}
      <section className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] px-4 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <Sourcil>Le calcul, sans habillage</Sourcil>
          <h2 className="text-[27px] sm:text-[42px] font-extrabold text-[var(--text-primary)] leading-[1.08] tracking-tight mb-3">
            Combien vous coûte une année de clients ?
          </h2>
          <p className="text-[var(--text-secondary)] max-w-[58ch] mb-8 leading-relaxed">
            Choisissez le nombre de clients que vous voulez appeler dans le mois. Chez nous
            le montant suit votre activité. Chez un abonnement, il ne bouge pas : vous payez
            pareil que vous appeliez un client ou vingt.
          </p>

          <SimulateurCout />

          <BlocCta
            accroche="Le calcul est fait. Il ne reste qu'à réclamer votre fiche."
            note="Deux minutes, et vos 2 premiers projets sont offerts."
          />
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      {/* JSON-LD FAQPage : le contenu reflete exactement la FAQ visible
          ci-dessous (variable `faqs`). Conforme guidelines Google. */}
      <JsonLd data={getFaqSchema(faqs)} />
      <section className="px-4 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-12 tracking-tight">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-[var(--border-color)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-base font-medium text-[var(--text-primary)] pr-4">
                    {faq.question}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-250 group-open:rotate-180"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 pr-8">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="bg-[var(--accent)] px-4 py-20 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-[1.06] tracking-tight mb-4 max-w-[17ch] mx-auto">
            Votre fiche vous attend.
          </h2>
          <p className="text-white/90 max-w-[52ch] mx-auto mb-8 leading-relaxed">
            Entrez votre numéro d&apos;entreprise, on la retrouve. France : SIRET à 14
            chiffres. Belgique : BCE à 10 chiffres.
          </p>
          <Link
            href="#trouver-ma-fiche"
            className="inline-flex items-center gap-2 bg-white text-[var(--accent)] hover:bg-white/90 font-bold px-10 py-4 rounded-full text-base transition-all duration-250 hover:-translate-y-0.5"
          >
            Trouver ma fiche <span aria-hidden="true">&rarr;</span>
          </Link>
          <small className="block mt-4 text-[13px] text-white/80">
            Gratuit à vie. Sans abonnement, sans commission, sans engagement, sans carte
            bancaire.
          </small>
        </div>
      </section>
    </main>
  );
}
