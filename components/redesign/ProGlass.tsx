import Image from 'next/image';
import Link from 'next/link';
import HeroSiretLookup from '@/components/landing/HeroSiretLookup';
import JsonLd from '@/components/seo/JsonLd';
import { getFaqSchema } from '@/lib/utils/schema';
import { getFeaturedHomePros } from '@/lib/queries/featured-home-pros';
import { FREE_UNLOCK_COUNT } from '@/lib/billing/free-unlocks';
import s from './pro-glass.module.css';

const questions = [
  { question: 'Qu’est-ce qui est gratuit ?', answer: `La fiche et la réception des demandes adaptées à votre activité. Les ${FREE_UNLOCK_COUNT} premiers déblocages sont offerts selon l’offre actuelle ; les suivants coûtent 9,90 € TTC par contact.` },
  { question: 'Dois-je prendre un abonnement ?', answer: 'Non. Vous choisissez les contacts à débloquer. Il n’y a ni abonnement ni commission sur les chantiers que vous réalisez.' },
  { question: 'Est-ce qu’un chantier est garanti ?', answer: 'Non. Le nombre de demandes dépend notamment du métier et du secteur. Débloquer des coordonnées permet de prendre contact ; le client reste libre de son choix.' },
  { question: 'Ma fiche existe déjà. Que faire ?', answer: 'Retrouvez-la avec votre numéro d’entreprise. Si elle est déjà rattachée à votre compte, connectez-vous à votre espace. Le support peut vous aider en cas de difficulté.' },
  { question: 'Mon email est confirmé : ma fiche est-elle activée ?', answer: 'La vérification de l’email est une étape. L’accès à la gestion de la fiche est accordé après validation de votre lien avec l’entreprise.' },
];

export default async function ProGlass() {
  const [pro] = await getFeaturedHomePros();
  return <main className={s.page} data-glass>
    <JsonLd data={getFaqSchema(questions)} />
    <section className={s.hero}>
      <div><p className={s.kicker}>Workwave · Pour les professionnels</p>
        <h1>Votre savoir-faire.<br /><span>Les projets qui vont avec.</span></h1>
        <p className={s.intro}>Présentez votre activité, recevez les demandes de votre secteur et choisissez les contacts qui vous intéressent.</p>
        <Link className={s.primary} href="/pro/retrouver-fiche">Retrouver ma fiche gratuitement →</Link>
        <p className={s.small}>Sans abonnement. Sans commission sur vos prestations.</p>
        <Link className={s.textLink} href="/pro/connexion">Déjà inscrit ? Accéder à mon espace →</Link>
      </div>
      {pro ? <Link href={`/artisan/${pro.slug}`} className={s.picture}><Image src={pro.photo} alt={`Réalisation publiée par ${pro.name}`} fill priority sizes="(max-width:800px) 100vw, 45vw" /><span><strong>{pro.name}</strong><small>{pro.trade} · {pro.city}</small>Voir sa fiche ↗</span></Link> : <div className={s.offer}><p className={s.kicker}>Votre activité mérite d’être vue</p><h2>Une fiche.<br />Votre signature.</h2><p>Vos prestations, vos informations et vos réalisations au même endroit.</p></div>}
    </section>
    <section className={s.offer} id="offre"><div><p className={s.kicker}>Une offre qui laisse le choix</p><h2>La fiche est gratuite.<br /><span>Les contacts, c’est vous qui décidez.</span></h2><p>Découvrez les demandes disponibles avant de choisir celles dont vous souhaitez débloquer les coordonnées.</p></div><div className={s.price}><strong>{FREE_UNLOCK_COUNT} contacts offerts</strong><p>Puis <b>9,90 € TTC</b> par contact débloqué.</p><small>Pas de chantier garanti. Aucun abonnement.</small><Link href="/pro/retrouver-fiche" className={s.primary}>Commencer gratuitement →</Link></div></section>
    <section className={s.section}><p className={s.kicker}>Une fiche qui vous ressemble</p><h2>Montrez ce que vous faites.<br /><span>Donnez envie d’en parler.</span></h2><div className={s.cards}>{[
      ['Vos réalisations parlent.', 'Des photos soignées, une présentation claire et vos prestations aident les visiteurs à comprendre ce que vous faites.'],
      ['Votre activité, votre zone.', 'Précisez votre métier et votre secteur d’intervention pour recevoir les demandes pertinentes disponibles.'],
      ['La relation reste directe.', 'Une fois les coordonnées débloquées, échangez avec le porteur du projet, précisez le besoin et proposez votre devis.'],
    ].map(([title, text], i) => <article key={title}><span className={s.number}>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className={`${s.section} ${s.steps}`}><div><p className={s.kicker}>Du premier pas à votre fiche</p><h2>Un parcours clair.<br /><span>À chaque étape.</span></h2><Link href="/pro/retrouver-fiche" className={s.textLink}>Retrouver mon entreprise →</Link></div><ol>{[
      ['Retrouvez votre entreprise.', 'Utilisez votre SIRET français ou votre numéro BCE belge. Si votre fiche manque, renseignez votre activité.'],
      ['Confirmez votre email.', 'Un code permet de vérifier que vous avez accès à cette adresse.'],
      ['Le rattachement est vérifié.', 'Notre équipe vérifie votre lien avec l’entreprise avant de vous donner accès à la gestion de sa fiche.'],
      ['Faites vivre votre présentation.', 'Après validation, complétez vos informations et vos réalisations depuis votre espace.'],
    ].map(([title,text],i)=><li key={title}><span className={s.number}>0{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
    <section id="trouver-ma-fiche" className={s.lookup}><p className={s.kicker}>Votre prochain pas</p><h2>Votre entreprise a sa place.<br /><span>Commençons par la retrouver.</span></h2><HeroSiretLookup /><Link href="/pro/creer-fiche" className={s.textLink}>Mon entreprise n’a pas encore de fiche →</Link></section>
    <section className={`${s.section} ${s.steps}`}><div><p className={s.kicker}>Avant de vous lancer</p><h2>Des réponses.<br /><span>Sans détour.</span></h2></div><div>{questions.map(q=><details key={q.question} className={s.question}><summary>{q.question}</summary><p>{q.answer}</p></details>)}</div></section>
  </main>;
}
