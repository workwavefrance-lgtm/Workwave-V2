"use client";

import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { submitProject, type FormState } from '@/app/(public)/deposer-projet/actions';
import { projectSchema } from '@/lib/project-validation';
import CityAutocomplete from '@/components/project/CityAutocomplete';
import { takeProjectIntent } from '@/lib/project-intent';
import { acquisitionContext } from '@/lib/analytics/acquisition-client';
import { trackClient } from '@/lib/analytics/client-track';
import { EVENTS } from '@/lib/analytics/events';
import s from './deposit-glass.module.css';

type Category = { id: number; name: string; vertical: string };
type Props = { categories: Category[]; defaultCategoryId?: number; defaultCity?: { id: number; name: string } | null; defaultDescription?: string; embedded?: boolean };
const DELAYS = [{ value: 'today', label: 'Aujourd’hui' }, { value: 'this_week', label: 'Cette semaine' }, { value: 'this_month', label: 'Ce mois-ci' }, { value: 'not_urgent', label: 'Je ne suis pas pressé' }];
const STEPS = ['Votre besoin', 'Votre contact', 'Vérification'];
const NEED = ['description', 'categoryId', 'cityId', 'urgency'];
// Meme seuil que la regle serveur (lib/project-validation.ts). Sans indication
// visible, un champ qui refuse la soumission donne l'impression d'un bug :
// signale le 20/09/2026 sur le formulaire en production.
const DESCRIPTION_MIN = 20;
const INITIAL: FormState = { success: false };

export default function DepositGlass({ categories, defaultCategoryId, defaultCity, defaultDescription, embedded = false }: Props) {
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState(defaultDescription ?? '');
  const [categoryId, setCategoryId] = useState(String(defaultCategoryId ?? ''));
  const [extras, setExtras] = useState<number[]>([]);
  const [city, setCity] = useState(defaultCity ?? null);
  const [urgency, setUrgency] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const title = useRef<HTMLHeadingElement>(null);
  const started = useRef(false), intentRead = useRef(false), viewed = useRef(false);
  const previousStep = useRef(-1);
  const selected = categories.find(c => c.id === Number(categoryId));
  const chosenIds = categoryId ? [Number(categoryId), ...extras.filter(id => id !== Number(categoryId))] : [];

  function move(target: number) {
    setStep(target);
    requestAnimationFrame(() => { title.current?.focus(); title.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); });
  }
  const [state, action, pending] = useActionState(async (previous: FormState, data: FormData) => {
    data.set('acquisition', JSON.stringify(acquisitionContext()));
    for (const field of ['firstName','email','phone']) data.set(field, String(data.get(field) ?? '').trim());
    let result: FormState;
    try { result = await submitProject(previous, data); }
    catch (error) {
      unstable_rethrow(error);
      return { success: false, message: 'La confirmation n’a pas pu être reçue. Vérifiez votre email avant de réessayer.' };
    }
    if (result.errors) {
      setErrors(result.errors);
      move(Object.keys(result.errors).some(key => NEED.includes(key)) ? 0 : 1);
    }
    return result;
  }, INITIAL);

  useEffect(() => {
    if (intentRead.current) return;
    intentRead.current = true;
    const need = takeProjectIntent();
    // Hydrate an external browser draft once; never store contact details.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (need && !defaultDescription) setDescription(need);
  }, [defaultDescription]);
  useEffect(() => {
    if (!viewed.current) { viewed.current = true; trackClient(EVENTS.PROJECT_FORM_VIEWED, { initialStep: 1, inline: false }); }
    if (previousStep.current !== step) {
      previousStep.current = step;
      trackClient(EVENTS.PROJECT_STEP_REACHED, { step: step+1, name: ['Besoin', 'Coordonnées', 'Vérification'][step] });
    }
  }, [step]);
  function interaction() { if (!started.current) { started.current = true; trackClient(EVENTS.PROJECT_FORM_STARTED, { initialStep: 1, inline: false }); } }
  function clear(field: string) { setErrors(previous => { const next = { ...previous }; delete next[field]; return next; }); }
  function validate(target: number) {
    interaction();
    const values = { description, categoryId, cityId: city?.id ?? '', urgency, firstName: firstName.trim(), email: email.trim(), phone: phone.trim(), consent: consent ? 'on' : '' };
    const result = target === 1
      ? projectSchema.pick({ description: true, categoryId: true, cityId: true, urgency: true }).safeParse(values)
      : projectSchema.pick({ firstName: true, email: true, phone: true, consent: true }).safeParse(values);
    if (!result.success) {
      const next: Record<string,string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      requestAnimationFrame(() => document.getElementById(`deposit-${Object.keys(next)[0]}`)?.focus());
      return;
    }
    setErrors({}); move(target);
  }
  const manquants = Math.max(0, DESCRIPTION_MIN - description.trim().length);
  const error = (field: string) => errors[field] ? <p id={`deposit-error-${field}`} className={s.error} role="alert">{errors[field]}</p> : null;
  const fieldProps = (field: string) => ({ id: `deposit-${field}`, 'aria-invalid': !!errors[field], 'aria-describedby': errors[field] ? `deposit-error-${field}` : undefined });

  // embedded : le meme formulaire place dans une page de listing, sans le grand titre.
  const Container = embedded ? 'div' : 'main';
  return <Container data-glass className={embedded ? s.embedded : s.page}>
    {!embedded && <div className={s.heading}><p className={s.eyebrow}>VOTRE IDÉE MÉRITE DE PRENDRE VIE.</p><h1>Racontez votre projet.<br/><span>Faisons le premier pas.</span></h1><p>Gratuit pour les particuliers. Vous choisissez librement.</p></div>}
    <section className={s.card} aria-labelledby="deposit-step-title">
      <ol className={s.progress} aria-label="Étapes du dépôt">{STEPS.map((label,i) => <li key={label} aria-current={step===i?'step':undefined} data-done={i<step}><span>{i+1}</span>{label}</li>)}</ol>
      <form action={action} noValidate onInput={interaction} onSubmit={event => { if (step<2) { event.preventDefault(); validate(step+1); } }}>
        <h2 id="deposit-step-title" ref={title} tabIndex={-1}>{['De quoi avez-vous envie\u00a0?', 'Faisons connaissance.', 'Tout est prêt\u00a0?'][step]}</h2>
        {state.message && !pending && <p className={s.sendError} role="alert">{state.message} Vos réponses sont conservées.</p>}
        <fieldset hidden={step!==0} disabled={pending} className={s.fields}>
          <p className={s.intro}>Le besoin et le lieu nous aident à orienter votre demande.</p>
          <label htmlFor="deposit-description">Votre projet</label>
          <textarea {...fieldProps('description')} aria-describedby={errors.description ? 'deposit-error-description' : 'deposit-description-hint'} name="description" rows={4} maxLength={5000} value={description} onChange={e=>{setDescription(e.target.value);clear('description');}} placeholder="Ex. : repeindre les murs et le plafond de mon salon de 25 m²."/>
          <div className={s.hintRow}>
            <p className={s.hint} id="deposit-description-hint">Précisez ce qu’il y a à faire, les dimensions ou la situation. Évitez d’y inscrire vos coordonnées.</p>
            <p className={s.counter} data-ok={manquants === 0}>{manquants === 0 ? `${DESCRIPTION_MIN} caractères minimum ✓` : description.trim().length === 0 ? `${DESCRIPTION_MIN} caractères minimum` : `Encore ${manquants} caractère${manquants > 1 ? 's' : ''}`}</p>
          </div>{error('description')}
          <div className={s.pair}><div><label htmlFor="deposit-categoryId">Le métier recherché</label>
            <select {...fieldProps('categoryId')} name="categoryId" value={categoryId} onChange={e=>{setCategoryId(e.target.value);setExtras([]);clear('categoryId');}}><option value="">Choisir un métier</option>
              {[['btp','Bâtiment et travaux'],['domicile','Entretien de la maison'],['personne','Aide à la personne']].map(([vertical,label])=><optgroup key={vertical} label={label}>{categories.filter(c=>c.vertical===vertical).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}
            </select>{error('categoryId')}</div>
            <div><label htmlFor="deposit-cityId">La ville du projet</label><CityAutocomplete inputId="deposit-cityId" defaultCity={defaultCity} onSelect={(id,name)=>{setCity({id,name});clear('cityId');}} onClear={()=>setCity(null)} error={errors.cityId}/></div></div>
          {selected && <details className={s.more}><summary>Votre projet concerne plusieurs métiers ?</summary><p className={s.hint}>Ajoutez ceux dont vous avez besoin. Une demande distincte sera créée pour chaque métier choisi.</p><div className={s.extraChoices}>{categories.filter(c=>c.vertical===selected.vertical&&c.id!==selected.id).map(c=><label key={c.id}><input type="checkbox" checked={extras.includes(c.id)} onChange={e=>setExtras(e.target.checked?[...extras,c.id]:extras.filter(id=>id!==c.id))}/>{c.name}</label>)}</div></details>}
          <label htmlFor="deposit-urgency">Quand souhaitez-vous commencer ?</label><select {...fieldProps('urgency')} name="urgency" value={urgency} onChange={e=>{setUrgency(e.target.value);clear('urgency');}}><option value="">Choisir un délai</option>{DELAYS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select>{error('urgency')}
          <p className={s.hint}>Votre souhait sera précisé avec les professionnels, selon leurs disponibilités.</p>
          <button type="button" className={s.primary} onClick={()=>validate(1)}>Continuer<ArrowRight size={18}/></button><p className={s.hintCenter}>Ensuite, vos coordonnées pour pouvoir échanger.</p>
        </fieldset>
        <fieldset hidden={step!==1} disabled={pending} className={s.fields}>
          <p className={s.intro}>Pour suivre votre demande et permettre aux professionnels concernés de vous répondre.</p>
          <div className={s.recap}><div><strong>{selected?.name} · {city?.name}</strong><p>{description}</p></div><button type="button" onClick={()=>move(0)}>Modifier le projet</button></div>
          <label htmlFor="deposit-firstName">Votre prénom</label><input {...fieldProps('firstName')} name="firstName" autoComplete="given-name" value={firstName} onChange={e=>{setFirstName(e.target.value);clear('firstName');}}/>{error('firstName')}
          <label htmlFor="deposit-email">Votre email</label><input {...fieldProps('email')} name="email" type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);clear('email');}}/>{error('email')}<p className={s.hint}>Pour la confirmation et le suivi de votre demande.</p>
          <label htmlFor="deposit-phone">Votre téléphone</label><input {...fieldProps('phone')} name="phone" type="tel" autoComplete="tel" value={phone} onChange={e=>{setPhone(e.target.value);clear('phone');}}/>{error('phone')}<p className={s.hint}>Pour échanger avec les professionnels concernés.</p>
          <p className={s.privacy}><ShieldCheck size={20}/>Vos coordonnées ne sont pas affichées publiquement. Elles sont accessibles aux professionnels concernés qui traitent votre demande.</p>
          <label className={s.consent}><input {...fieldProps('consent')} name="consent" type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);clear('consent');}}/><span>J’accepte que mes données soient transmises aux professionnels concernés pour traiter ma demande. <Link href="/mentions-legales" target="_blank">Utilisation de mes données ↗</Link></span></label>{error('consent')}
          <button type="button" className={s.primary} onClick={()=>validate(2)}>Vérifier ma demande<ArrowRight size={18}/></button><button type="button" className={s.back} onClick={()=>move(0)}>Revenir à mon projet</button>
        </fieldset>
        <fieldset hidden={step!==2} disabled={pending} className={s.fields}>
          <p className={s.intro}>Relisez une dernière fois. Vous pouvez encore tout modifier.</p>
          <div className={s.review}><div><h3>Votre projet</h3><button type="button" onClick={()=>move(0)}>Modifier le besoin</button></div><p>{description}</p><dl><dt>Métier{chosenIds.length>1?'s':''}</dt><dd>{categories.filter(c=>chosenIds.includes(c.id)).map(c=>c.name).join(', ')}</dd><dt>Lieu</dt><dd>{city?.name}</dd><dt>Délai souhaité</dt><dd>{DELAYS.find(d=>d.value===urgency)?.label}</dd></dl></div>
          <div className={s.review}><div><h3>Pour vous joindre</h3><button type="button" onClick={()=>move(1)}>Modifier mes coordonnées</button></div><p>{firstName}<br/>{email}<br/>{phone}</p></div>
          <p className={s.hint}>Votre demande concerne les professionnels adaptés à votre besoin et à votre secteur. Elle n’est pas adressée uniquement au professionnel dont vous avez consulté la fiche.</p>
          <button type="submit" className={s.primary} disabled={pending}>{pending?'Enregistrement en cours…':'Déposer ma demande gratuitement'}{!pending&&<ArrowRight size={18}/>}</button>
          <p role="status" className={s.hintCenter}>{pending?'Gardez cette page ouverte, nous enregistrons votre demande.':'Vous restez libre de choisir un professionnel et d’accepter son devis.'}</p>
        </fieldset>
        <input type="hidden" name="cityId" value={city?.id??''}/><input type="hidden" name="categoryIds" value={chosenIds.join(',')}/><input type="hidden" name="budget" value="unknown"/>
        <div className={s.honeypot} aria-hidden="true"><label htmlFor="deposit-website">Ne pas remplir</label><input id="deposit-website" name="website" tabIndex={-1} autoComplete="off"/></div>
      </form>
    </section><p className={s.footnote}>Gratuit pour les particuliers · Sans création de compte · Sans engagement</p>
  </Container>;
}
