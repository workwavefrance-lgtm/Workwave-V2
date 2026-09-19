import Image from 'next/image';
import Link from 'next/link';
import s from './profile-glass.module.css';

type Props = {
  name: string; category: string; city: string; claimed: boolean; closed: boolean;
  rge: boolean; freeQuote: boolean; phone: string | null; projectHref: string;
  directoryHref: string; specialties: {name:string;href:string}[]; cover: string | null; photos: string[];
};

export function ProfileGlassHero(p: Props) {
  const pictures = [...new Set([p.cover, ...p.photos].filter((v): v is string => !!v))].slice(0, 2);
  return <>
    <header className={s.heading}>
      <div>
        <p className={s.eyebrow}>{p.category}{p.city ? ` · ${p.city}` : ''}</p>
        <h1>{p.name}</h1>
        <p className={s.tagline}>{p.closed ? 'Les informations de cet établissement, et les alternatives pour votre projet.' : 'Un professionnel à découvrir. Un projet à imaginer.'}</p>
        <div className={s.badges}>
          <span>{p.closed ? 'Établissement fermé' : p.claimed ? 'Fiche réclamée' : 'Fiche de l’annuaire'}</span>
          {p.rge && !p.closed && <span>RGE · source ADEME</span>}
          {p.freeQuote && p.claimed && !p.closed && <span>Devis gratuit proposé</span>}
          {p.specialties.map(c => <Link key={c.href} href={c.href}>{c.name}</Link>)}
          <Link href={p.directoryHref}>Voir les professionnels du secteur →</Link>
        </div>
      </div>
      <div className={s.actions}>
        {!p.closed && p.phone && <a className={s.secondary} href={`tel:${p.phone}`}>Appeler ce professionnel</a>}
        <Link className={s.primary} href={p.projectHref} data-project-cta="profile-hero">{p.closed ? 'Trouver un autre professionnel' : 'Décrire mon projet'} <span aria-hidden>→</span></Link>
        <small>Gratuit pour les particuliers · Sans engagement</small>
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
