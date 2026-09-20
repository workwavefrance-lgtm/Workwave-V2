import Image from 'next/image';
import Link from 'next/link';
import s from './profile-glass.module.css';

type Props = {
  name: string; category: string; city: string; claimed: boolean; closed: boolean;
  rge: boolean; freeQuote: boolean; phone: string | null; projectHref: string;
  directoryHref: string; specialties: {name:string;href:string}[]; cover: string | null; photos: string[];
  /** Logo déjà validé côté page (https + hôte autorisé). Sinon on dessine l'initiale. */
  logo?: string | null;
  /** Année d'activité, calculée côté page (founded_year vs Sirene). */
  foundedYear?: string | null;
  /** Rayon d'intervention, passé UNIQUEMENT pour une fiche réclamée. */
  radiusKm?: number | null;
  decennale?: boolean; rcPro?: boolean;
};

/**
 * Haut de fiche, refonte du 20/09/2026 (direction « carte d'identité »).
 *
 * Avant : onze éléments de même taille se suivaient (accroche générique,
 * pastilles de statut, huit liens de métiers), sans hiérarchie. La zone était
 * illisible et l'accroche, identique sur 2,5 millions de fiches, occupait la
 * ligne la plus lue de la page.
 *
 * Maintenant : une seule carte, quatre étages séparés par un filet, qui
 * disparaissent quand ils n'ont rien à dire.
 *   1. identité : logo ou initiale, métier · ville, nom (le H1) ;
 *   2. faits : phrases courtes, lisibles sans rien connaître du site ;
 *   3. métiers : les liens de maillage interne, label « Métiers » ;
 *   4. actions : les deux boutons, à droite du nom sur grand écran.
 *
 * Contraintes tenues : le nom reste le seul H1, les liens de métiers et le lien
 * vers le secteur restent de vrais liens, `data-project-cta` est conservé, et
 * chaque cas (fermée, non réclamée, sans téléphone, sans ville) garde son
 * comportement d'origine.
 */
export function ProfileGlassHero(p: Props) {
  const pictures = [...new Set([p.cover, ...p.photos].filter((v): v is string => !!v))].slice(0, 2);

  // Statut : une phrase, pas notre vocabulaire interne. « Fiche réclamée » ne
  // veut rien dire pour un particulier arrivé de Google.
  const statut = p.closed
    ? 'Établissement fermé'
    : p.claimed
      ? 'Fiche tenue par le professionnel'
      : 'Informations issues des données publiques';

  const faits: string[] = [];
  // « En activité depuis 2001 » sous « Établissement fermé » se contredisait :
  // une fiche fermée dit la date de création, pas une activité en cours.
  if (p.foundedYear) faits.push(p.closed ? `Créé en ${p.foundedYear}` : `En activité depuis ${p.foundedYear}`);
  if (!p.closed && p.radiusKm) {
    faits.push(p.city
      ? `Se déplace jusqu'à ${p.radiusKm} km autour de ${p.city}`
      : `Se déplace jusqu'à ${p.radiusKm} km`);
  }
  if (p.rge && !p.closed) faits.push('Qualification RGE, source ADEME');
  if (!p.closed && (p.decennale || p.rcPro)) {
    // « déclarée » : le pro coche la case dans son tableau de bord, nous ne
    // vérifions aucune attestation. Écrire l'inverse serait une promesse fausse.
    faits.push(p.decennale && p.rcPro
      ? 'Assurance décennale et responsabilité civile déclarées'
      : p.decennale ? 'Assurance décennale déclarée' : 'Responsabilité civile professionnelle déclarée');
  }
  if (p.freeQuote && p.claimed && !p.closed) faits.push('Devis gratuit proposé');

  return <>
    <header className={s.heading}>
      <div className={s.card}>
        <div className={s.top}>
          <div className={s.identity}>
            {p.logo
              ? <Image className={s.logo} src={p.logo} alt={`Logo ${p.name}`} width={64} height={64} />
              : <span className={s.mono} aria-hidden>{p.name.charAt(0)}</span>}
            <div>
              <p className={s.eyebrow}>{p.category}{p.city ? ` · ${p.city}` : ''}</p>
              <h1>{p.name}</h1>
            </div>
          </div>
          <div className={s.actions}>
            {!p.closed && p.phone && <a className={s.secondary} href={`tel:${p.phone}`}>Appeler ce professionnel</a>}
            <Link className={s.primary} href={p.projectHref} data-project-cta="profile-hero">{p.closed ? 'Trouver un autre professionnel' : 'Décrire mon projet'} <span aria-hidden>→</span></Link>
            <small>Gratuit pour les particuliers · Sans engagement</small>
          </div>
        </div>
        <div className={s.facts}>
          <span className={p.claimed && !p.closed ? s.live : undefined}>{statut}</span>
          {faits.map(f => <span key={f}>{f}</span>)}
        </div>
        <div className={s.also}>
          {p.specialties.length > 0 && <span className={s.alsoLabel}>Métiers</span>}
          {p.specialties.map(c => <Link key={c.href} href={c.href}>{c.name}</Link>)}
          <Link className={s.alsoAll} href={p.directoryHref}>Voir les professionnels du secteur →</Link>
        </div>
      </div>
    </header>
    {pictures.length > 0 && !p.closed ? <div className={s.gallery} data-single={pictures.length === 1}>
      {pictures.map((src, i) => <a href={p.photos.length ? "#titre-chantiers" : p.projectHref} key={src} aria-label={`Voir les photos de ${p.name}`}>
        <Image src={src} alt={`${p.name}${p.city ? ` à ${p.city}` : ''} · photo ${i + 1}`} fill priority={i === 0} sizes="(max-width: 700px) 100vw, 60vw" className={src === p.cover ? s.cover : s.photo} />
        <span>Découvrir en images ↗</span>
      </a>)}
    </div> : !p.closed && <div className={s.noPhoto}><span aria-hidden>{p.name.charAt(0)}</span><p>Découvrez son activité et ses informations pratiques.<br />Aucune photo de réalisation n’est publiée sur cette fiche.</p></div>}
  </>;
}

export function ProfileGlassContact({ name, projectHref, phone, closed }: Pick<Props, 'name' | 'projectHref' | 'phone' | 'closed'>) {
  return <aside className={s.contact}>
    <p className={s.eyebrow}>Votre projet commence ici</p>
    <h2>{closed ? 'Votre projet continue.' : 'Et si on en parlait ?'}</h2>
    <p>Décrivez votre besoin. Les professionnels intéressés pourront vous contacter. Vous choisissez librement.</p>
    <Link href={projectHref} className={s.primary} data-project-cta="profile-sidebar">Décrire mon projet <span aria-hidden>→</span></Link>
    <small>Gratuit · Sans engagement</small>
    <p className={s.note}>{closed ? `La demande ne sera pas transmise à cet établissement fermé.` : `Cette demande est destinée aux professionnels concernés, pas uniquement à ${name}.`}</p>
    {!closed && phone && <><hr /><p>Vous préférez joindre directement {name} ?</p><a className={s.secondary} href={`tel:${phone}`}>Appeler ce professionnel</a></>}
  </aside>;
}
