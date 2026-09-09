import Link from "next/link";
import {
  getStatistiquesAdmin,
  lirePeriode,
  PERIODES,
  type Compare,
  type CompteurRobots,
  type Erreurs,
  type Marche,
  type SourceMarche,
  type StatistiquesAdmin,
  type Total,
} from "@/lib/queries/stats-jour";

/**
 * /admin/statistiques : l'entonnoir complet de Workwave.fr, du visiteur réel
 * (Umami) aux coordonnées débloquées (lead_unlocks), avec les clics Google et
 * les robots à part. Créée le 09/09/2026, à côté de /admin/analytics qui ne
 * lit que la table `events` et reste en place.
 *
 * Server Component pur : la période se choisit par lien (?periode=7|28|90),
 * aucun état client. Tout le calcul vit dans lib/queries/stats-jour.ts.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Statistiques",
};

// ── formats ──────────────────────────────────────────────

const fmtNombre = (n: number) => n.toLocaleString("fr-FR");

/** 12,3 -> « 12,3 % » */
const fmtPct = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`;

/** AAAA-MM-JJ -> JJ/MM/AAAA */
function fmtJour(jour: string): string {
  const [a, m, j] = jour.split("-");
  return `${j}/${m}/${a}`;
}

/** AAAA-MM-JJ -> « lun. 08/09 » (jour UTC, comme stats_jour.jour) */
function fmtJourCourt(jour: string): string {
  const d = new Date(`${jour}T00:00:00Z`);
  const semaine = d.toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" });
  const [, m, j] = jour.split("-");
  return `${semaine} ${j}/${m}`;
}

const LIBELLE_SOURCE: Record<SourceMarche, keyof Erreurs> = {
  stats_jour: "statsJour",
  events: "events",
  projects: "projets",
  lead_unlocks: "unlocks",
};

// ── briques ──────────────────────────────────────────────

/** Un nombre, ou « pas encore » quand la mesure n'existe pas (NULL), jamais 0. */
function Nombre({ valeur, suffixe = "" }: { valeur: number | null; suffixe?: string }) {
  if (valeur === null) return <PasEncore />;
  return (
    <span className="tabular-nums">
      {fmtNombre(valeur)}
      {suffixe}
    </span>
  );
}

function PasEncore() {
  return (
    <span className="text-sm italic" style={{ color: "var(--admin-text-tertiary)" }}>
      pas encore
    </span>
  );
}

/** Écart en % entre deux périodes. `hausseNegative` inverse les couleurs (erreurs, aspirateurs). */
function Ecart({ pct, hausseNegative = false }: { pct: number | null; hausseNegative?: boolean }) {
  if (pct === null) {
    return (
      <span className="text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
        sans comparaison
      </span>
    );
  }
  const bonne = hausseNegative ? pct < 0 : pct > 0;
  const couleur = pct === 0 ? "var(--admin-text-tertiary)" : bonne ? "var(--admin-success)" : "var(--admin-danger)";
  const signe = pct > 0 ? "+" : "";
  return (
    <span className="text-sm font-medium tabular-nums" style={{ color: couleur }}>
      {signe}
      {fmtPct(pct)}
    </span>
  );
}

function BlocErreur({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm"
      style={{
        backgroundColor: "rgba(251,110,91,0.10)",
        border: "1px solid rgba(251,110,91,0.35)",
        color: "var(--admin-danger)",
      }}
    >
      Requête en erreur, aucun chiffre affiché : {message}
    </div>
  );
}

function Carte({
  titre,
  sousTitre,
  erreur,
  droite,
  children,
}: {
  titre: string;
  sousTitre?: string;
  erreur?: string | null;
  droite?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--admin-text)" }}>
            {titre}
          </h2>
          {sousTitre && (
            <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
              {sousTitre}
            </p>
          )}
        </div>
        {droite}
      </div>
      {erreur ? <BlocErreur message={erreur} /> : children}
    </section>
  );
}

function Couverture({ total, nbJours }: { total: Total; nbJours: number }) {
  if (total.valeur === null || total.joursMesures >= nbJours) return null;
  return (
    <span className="text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
      {" "}
      sur {total.joursMesures} j mesuré{total.joursMesures > 1 ? "s" : ""}
    </span>
  );
}

/** Tuile de la ligne de tête : valeur, période précédente, écart. */
function Tuile({
  titre,
  compare,
  nbJours,
  suffixe = "",
}: {
  titre: string;
  compare: Compare;
  nbJours: number;
  suffixe?: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium" style={{ color: "var(--admin-text-secondary)" }}>
          {titre}
        </span>
        <Ecart pct={compare.ecartPct} />
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums" style={{ color: "var(--admin-text)" }}>
        <Nombre valeur={compare.actuel.valeur} suffixe={suffixe} />
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
        <Couverture total={compare.actuel} nbJours={nbJours} />
        {compare.actuel.valeur !== null && compare.actuel.joursMesures < nbJours ? " · " : ""}
        période précédente : <Nombre valeur={compare.precedent.valeur} suffixe={suffixe} />
      </p>
    </div>
  );
}

// ── entonnoir ────────────────────────────────────────────

function celluleTh(texte: string, alignDroite = true) {
  return (
    <th
      className={`text-sm font-medium py-2 px-3 ${alignDroite ? "text-right" : "text-left"}`}
      style={{ color: "var(--admin-text-secondary)", borderBottom: "1px solid var(--admin-border)" }}
    >
      {texte}
    </th>
  );
}

function LigneMarche({
  m,
  erreurs,
  sousLigne = false,
}: {
  m: Marche;
  erreurs: Erreurs;
  sousLigne?: boolean;
}) {
  const erreur = erreurs[LIBELLE_SOURCE[m.source]];
  const groupe = !!m.sous;
  return (
    <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
      <td className={`py-2.5 px-3 ${sousLigne ? "pl-8" : ""}`}>
        <span
          className={`text-sm ${sousLigne ? "" : "font-medium"}`}
          style={{ color: sousLigne ? "var(--admin-text-secondary)" : "var(--admin-text)" }}
        >
          {m.libelle}
        </span>
        {m.indice && (
          <span className="block text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
            {m.indice}
          </span>
        )}
      </td>
      {groupe ? (
        <td colSpan={4} className="py-2.5 px-3 text-sm text-right" style={{ color: "var(--admin-text-tertiary)" }}>
          {erreur ? <span style={{ color: "var(--admin-danger)" }}>{erreur}</span> : "voir les écrans ci-dessous"}
        </td>
      ) : erreur ? (
        <td colSpan={4} className="py-2.5 px-3 text-sm text-right" style={{ color: "var(--admin-danger)" }}>
          {erreur}
        </td>
      ) : (
        <>
          <td className="py-2.5 px-3 text-right text-sm font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>
            <Nombre valeur={m.actuel} />
          </td>
          <td className="py-2.5 px-3 text-right text-sm tabular-nums" style={{ color: "var(--admin-text-secondary)" }}>
            {m.conversionPct === null ? "" : fmtPct(m.conversionPct)}
          </td>
          <td className="py-2.5 px-3 text-right text-sm tabular-nums" style={{ color: "var(--admin-text-secondary)" }}>
            <Nombre valeur={m.precedent} />
            {m.conversionPrecPct !== null && (
              <span className="block text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
                {fmtPct(m.conversionPrecPct)}
              </span>
            )}
          </td>
          <td className="py-2.5 px-3 text-right">
            <Ecart pct={m.ecartPct} />
          </td>
        </>
      )}
    </tr>
  );
}

function Entonnoir({ marches, erreurs }: { marches: Marche[]; erreurs: Erreurs }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            {celluleTh("Marche", false)}
            {celluleTh("Période")}
            {celluleTh("Conversion")}
            {celluleTh("Période précédente")}
            {celluleTh("Écart")}
          </tr>
        </thead>
        <tbody>
          {marches.map((m) => (
            <LigneMarcheEtSous key={m.cle} m={m} erreurs={erreurs} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LigneMarcheEtSous({ m, erreurs }: { m: Marche; erreurs: Erreurs }) {
  return (
    <>
      <LigneMarche m={m} erreurs={erreurs} />
      {m.sous?.map((s) => (
        <LigneMarche key={s.cle} m={s} erreurs={erreurs} sousLigne />
      ))}
    </>
  );
}

// ── robots ───────────────────────────────────────────────

function TuileRobot({ c, nbJours }: { c: CompteurRobots; nbJours: number }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "var(--admin-hover)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
          {c.libelle}
        </span>
        <Ecart pct={c.ecartPct} hausseNegative={c.hausseNegative} />
      </div>
      <p className="text-2xl font-semibold tabular-nums mt-1" style={{ color: "var(--admin-text)" }}>
        <Nombre valeur={c.actuel.valeur} />
        <Couverture total={c.actuel} nbJours={nbJours} />
      </p>
      <p className="text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
        période précédente : <Nombre valeur={c.precedent.valeur} />
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--admin-text-secondary)" }}>
        {c.description}
      </p>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const nbJours = lirePeriode(sp.periode);
  const s: StatistiquesAdmin = await getStatistiquesAdmin(nbJours);
  const { actuelle, precedente } = s.periode;
  const e = s.erreurs;
  const ratio = s.ratioCle;

  return (
    <div>
      {/* En-tête + sélecteur de période */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
            Statistiques
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
            Audience et entonnoir de Workwave.fr · du {fmtJour(actuelle.debut)} au {fmtJour(actuelle.fin)} (
            {nbJours} jours, jusqu&apos;à hier) · comparé du {fmtJour(precedente.debut)} au{" "}
            {fmtJour(precedente.fin)}
          </p>
          {/* L'heure de la derniere ecriture du serveur. Si elle n'avance plus,
              le cron est mort : c'est le seul signal, ne pas le retirer. */}
          <p className="text-sm mt-1" style={{ color: s.derniereMajServeur ? "var(--admin-text-secondary)" : "#c8321f" }}>
            {s.derniereMajServeur
              ? `Chiffres serveur (visiteurs, robots) mis à jour le ${fmtJour(s.derniereMajServeur.slice(0, 10))} à ${s.derniereMajServeur.slice(11, 16)} UTC`
              : "Chiffres serveur (visiteurs, robots) : jamais écrits, le script du serveur n'a pas encore tourné"}
          </p>
        </div>
        <nav
          className="inline-flex items-center gap-1 p-1 rounded-lg"
          style={{ backgroundColor: "var(--admin-hover)", border: "1px solid var(--admin-border)" }}
          aria-label="Période"
        >
          {PERIODES.map((p) => {
            const actif = p === nbJours;
            return (
              <Link
                key={p}
                href={`/admin/statistiques?periode=${p}`}
                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-150"
                style={{
                  backgroundColor: actif ? "var(--admin-card)" : "transparent",
                  color: actif ? "var(--admin-text)" : "var(--admin-text-secondary)",
                }}
              >
                {p} jours
              </Link>
            );
          })}
        </nav>
      </div>

      {/* G) Comment lire */}
      <div
        className="rounded-xl p-4 mb-4 text-sm space-y-1.5"
        style={{
          backgroundColor: "var(--admin-accent-soft)",
          border: "1px solid rgba(255,90,54,0.30)",
          color: "var(--admin-text)",
        }}
      >
        <p className="font-semibold">Comment lire cette page</p>
        <p>
          Les visiteurs réels sont des sessions Umami : un navigateur qui a exécuté le JavaScript du site. Les
          robots, les aspirateurs et les requêtes sans JavaScript n&apos;y figurent jamais, ils sont comptés à part en
          bas de page.
        </p>
        <p>
          « Formulaire vu » n&apos;est pas une intention : le formulaire est intégré dans les pages métier x ville, un
          simple affichage de page compte. L&apos;intention commence à « formulaire commencé », la première
          interaction.
        </p>
        <p>
          Les lignes Formulaire vu, commencé, écrans et envoyé viennent de la table events, qui ne reçoit que les
          visiteurs ayant accepté les cookies (app/api/track). Les visiteurs réels et les sessions listing (Umami)
          comptent tout le monde. Une conversion listing vers formulaire vu serait donc minorée du taux de refus des
          cookies : elle n&apos;est pas calculée. Lire les conversions ENTRE marches events (vu, commencé, envoyé),
          jamais depuis Umami.
        </p>
        <p>
          « pas encore » signifie que la mesure n&apos;existe pas encore en base (NULL) : Search Console a 2 jours de
          retard et la table démarre le 09/09/2026. Ce n&apos;est jamais un zéro.
        </p>
      </div>

      {/* A) Ligne de tête */}
      {e.statsJour ? (
        <div className="mb-4">
          <BlocErreur message={e.statsJour} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
          <Tuile titre="Visiteurs réels" compare={s.tete.sessions} nbJours={nbJours} />
          <Tuile titre="Vues de page" compare={s.tete.vues} nbJours={nbJours} />
          <Tuile titre="Clics Google (Search Console)" compare={s.tete.clicsGsc} nbJours={nbJours} />
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--admin-text-secondary)" }}>
              Part des clics Google
            </span>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm" style={{ color: "var(--admin-text)" }}>
                  Listings métier x lieu
                </span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>
                  <Nombre valeur={s.tete.partListingPct.actuel.valeur} suffixe=" %" />
                  <span className="ml-2 font-normal" style={{ color: "var(--admin-text-tertiary)" }}>
                    avant : <Nombre valeur={s.tete.partListingPct.precedent.valeur} suffixe=" %" />
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm" style={{ color: "var(--admin-text)" }}>
                  Fiches /artisan/
                </span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>
                  <Nombre valeur={s.tete.partFichePct.actuel.valeur} suffixe=" %" />
                  <span className="ml-2 font-normal" style={{ color: "var(--admin-text-tertiary)" }}>
                    avant : <Nombre valeur={s.tete.partFichePct.precedent.valeur} suffixe=" %" />
                  </span>
                </span>
              </div>
            </div>
            <p className="text-sm mt-2" style={{ color: "var(--admin-text-tertiary)" }}>
              le reste : accueil, blog, guides, pages pro
            </p>
          </div>
        </div>
      )}

      {/* B) Entonnoir + C) Ratio clé */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2">
          <Carte
            titre="Entonnoir"
            sousTitre="Du visiteur réel aux coordonnées débloquées, une marche par ligne. La conversion se lit depuis la marche chiffrée juste au-dessus."
          >
            <Entonnoir marches={s.entonnoir} erreurs={e} />
          </Carte>
        </div>
        <Carte
          titre="Le ratio clé"
          sousTitre="Projets valides pour 1 000 clics Google sur un listing"
          erreur={e.statsJour ?? e.projets}
        >
          <p className="text-4xl font-semibold tracking-tight tabular-nums" style={{ color: "var(--admin-accent)" }}>
            {ratio.actuel.valeur === null ? (
              <PasEncore />
            ) : (
              ratio.actuel.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })
            )}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-secondary)" }}>
            {ratio.actuel.joursMesures > 0
              ? `${fmtNombre(ratio.actuel.projets)} projets pour ${fmtNombre(ratio.actuel.clics)} clics, sur ${ratio.actuel.joursMesures} jour${ratio.actuel.joursMesures > 1 ? "s" : ""} où Search Console est mesuré`
              : "aucun jour de la période n'a encore ses clics Search Console"}
          </p>
          <div className="flex items-center justify-between gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--admin-border)" }}>
            <span className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
              période précédente :{" "}
              <span className="font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>
                {ratio.precedent.valeur === null ? (
                  <PasEncore />
                ) : (
                  ratio.precedent.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })
                )}
              </span>
              {ratio.precedent.joursMesures > 0 && (
                <span style={{ color: "var(--admin-text-tertiary)" }}> ({ratio.precedent.joursMesures} j)</span>
              )}
            </span>
            <Ecart pct={ratio.ecartPct} />
          </div>
          <p className="text-sm mt-3" style={{ color: "var(--admin-text)" }}>
            C&apos;est le seul chiffre qui sépare un problème de trafic d&apos;un problème de formulaire : s&apos;il
            tient alors que les projets baissent, c&apos;est le trafic qui manque ; s&apos;il baisse à clics égaux,
            c&apos;est la page ou le formulaire qui a changé.
          </p>
        </Carte>
      </div>

      {/* D) Par jour */}
      <div className="mb-4">
        <Carte
          titre="Jour par jour"
          sousTitre="Du plus récent au plus ancien. Les colonnes Search Console des 2 derniers jours arrivent avec 2 jours de retard."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  {celluleTh("Jour", false)}
                  {celluleTh("Visiteurs")}
                  {celluleTh("Sessions listing")}
                  {celluleTh("Formulaire commencé")}
                  {celluleTh("Envoyés")}
                  {celluleTh("Projets valides")}
                  {celluleTh("Clics Google")}
                </tr>
              </thead>
              <tbody>
                {s.parJour.map((j) => (
                  <tr key={j.jour} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                    <td className="py-2 px-3 text-sm" style={{ color: "var(--admin-text)" }}>
                      {fmtJourCourt(j.jour)}
                    </td>
                    <CelluleJour valeur={j.sessions} erreur={e.statsJour} />
                    <CelluleJour valeur={j.sessionsListing} erreur={e.statsJour} />
                    <CelluleJour valeur={j.commences} erreur={e.events} />
                    <CelluleJour valeur={j.envoyes} erreur={e.events} />
                    <CelluleJour valeur={j.projetsValides} erreur={e.projets} fort />
                    <CelluleJour valeur={j.clicsGsc} erreur={e.statsJour} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carte>
      </div>

      {/* E) Sources */}
      <div className="mb-4">
        <Carte
          titre="D'où viennent les visiteurs"
          sousTitre="Site d'origine de la première vue de chaque session, en part des visiteurs réels de la période"
          erreur={e.statsJour}
        >
          {s.sources.sessionsMesurees.valeur === null ? (
            <p className="text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
              Aucun jour de la période n&apos;a encore ses sessions Umami : rien à répartir.
            </p>
          ) : (
            <div className="space-y-2.5">
              {s.sources.lignes.map((src) => (
                <div key={src.cle} className="flex items-center gap-3">
                  <span className="text-sm shrink-0" style={{ color: "var(--admin-text-secondary)", width: 96 }}>
                    {src.libelle}
                  </span>
                  <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: "var(--admin-hover)" }}>
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.max(src.partPct ?? 0, src.actuel.valeur ? 1 : 0)}%`,
                        backgroundColor: "var(--admin-accent)",
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0 text-right" style={{ color: "var(--admin-text)", width: 72 }}>
                    <Nombre valeur={src.actuel.valeur} />
                  </span>
                  <span className="text-sm tabular-nums shrink-0 text-right" style={{ color: "var(--admin-text-secondary)", width: 64 }}>
                    {src.partPct === null ? "" : fmtPct(src.partPct)}
                  </span>
                  <span className="text-sm tabular-nums shrink-0 text-right" style={{ color: "var(--admin-text-tertiary)", width: 120 }}>
                    avant : <Nombre valeur={src.precedent.valeur} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </Carte>
      </div>

      {/* F) Robots */}
      <div className="mb-4">
        <Carte
          titre="Ce qui n'est pas des visiteurs"
          sousTitre="Journal du proxy Traefik : robots, passages de Google, aspirateurs et erreurs serveur. Aucune de ces lignes n'entre dans les visiteurs réels."
          erreur={e.statsJour}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            {s.robots.totaux.map((c) => (
              <TuileRobot key={c.cle} c={c} nbJours={nbJours} />
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  {celluleTh("Jour", false)}
                  {celluleTh("Robots déclarés")}
                  {celluleTh("Passages Google")}
                  {celluleTh("5xx à Google")}
                  {celluleTh("Pages aspirées")}
                  {celluleTh("Adresses aspirantes")}
                  {celluleTh("5xx, toutes")}
                </tr>
              </thead>
              <tbody>
                {s.robots.parJour.map((j) => (
                  <tr key={j.jour} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                    <td className="py-2 px-3 text-sm" style={{ color: "var(--admin-text)" }}>
                      {fmtJourCourt(j.jour)}
                    </td>
                    <CelluleJour valeur={j.robotsDeclares} erreur={null} />
                    <CelluleJour valeur={j.googlePassages} erreur={null} />
                    <CelluleJour valeur={j.google5xx} erreur={null} alerteSiPositif />
                    <CelluleJour valeur={j.aspirateurPages} erreur={null} />
                    <CelluleJour valeur={j.aspirateurAdresses} erreur={null} />
                    <CelluleJour valeur={j.err5xxTotal} erreur={null} alerteSiPositif />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carte>
      </div>

      <p className="text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
        Jours UTC, période close hier. Comptes de test exclus des déblocages (pro_id 4393, 99999, 1432477). Projets
        valides = table projects hors statuts deleted et suspicious. Sources : stats_jour (Umami, journal Traefik,
        Search Console), events, projects, lead_unlocks. Généré le{" "}
        {new Date(s.genereLe).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.
      </p>
    </div>
  );
}

/** Cellule numérique d'un tableau par jour : NULL = « pas encore », source en erreur = tiret et titre explicatif. */
function CelluleJour({
  valeur,
  erreur,
  fort = false,
  alerteSiPositif = false,
}: {
  valeur: number | null;
  erreur: string | null;
  fort?: boolean;
  alerteSiPositif?: boolean;
}) {
  if (erreur) {
    return (
      <td className="py-2 px-3 text-right text-sm" style={{ color: "var(--admin-danger)" }} title={erreur}>
        erreur
      </td>
    );
  }
  const alerte = alerteSiPositif && valeur !== null && valeur > 0;
  return (
    <td
      className={`py-2 px-3 text-right text-sm tabular-nums ${fort ? "font-semibold" : ""}`}
      style={{ color: alerte ? "var(--admin-danger)" : fort ? "var(--admin-text)" : "var(--admin-text-secondary)" }}
    >
      <Nombre valeur={valeur} />
    </td>
  );
}
