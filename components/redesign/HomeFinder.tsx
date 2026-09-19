'use client';
import { useState } from 'react';
import SearchForm from '@/components/search/SearchForm';
import s from './public-glass.module.css';
export default function HomeFinder({categories}:{categories:{slug:string;name:string;vertical:string}[]}){
  const [mode,setMode]=useState<'depot'|'listing'>('depot');
  return <section id="recherche" className={s.finder} aria-label="Commencer mon projet ou chercher un professionnel"><div className={s.tabs} role="group" aria-label="Votre parcours"><button type="button" aria-pressed={mode==='depot'} onClick={()=>setMode('depot')}>Déposer un projet</button><button type="button" aria-pressed={mode==='listing'} onClick={()=>setMode('listing')}>Chercher dans l’annuaire</button></div><SearchForm categories={categories} destination={mode}/><p>{mode==='depot'?'Expliquez votre besoin. Les professionnels concernés et intéressés pourront vous contacter.':'Choisissez votre métier et votre ville, puis découvrez les profils.'}</p></section>;
}
