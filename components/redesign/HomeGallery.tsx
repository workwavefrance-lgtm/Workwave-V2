'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { FeaturedHomePro } from '@/lib/queries/featured-home-pros';
import s from './public-glass.module.css';
export default function HomeGallery({pros}:{pros:FeaturedHomePro[]}){
 const [index,setIndex]=useState(0);const pro=pros[index];if(!pro)return <div className={s.heroEmpty}><span>Une idée pour votre maison ?</span><strong>Faites le premier pas.</strong></div>;
 return <div className={s.heroVisual}><Image src={pro.photo} alt={`Photo publiée dans la galerie de ${pro.name}`} fill sizes="(max-width:760px) 100vw, 48vw" priority className={s.heroImage}/><Link prefetch={false} className={s.photoCredit} href={`/artisan/${pro.slug}`}><strong>{pro.name}</strong><span>{pro.trade} · {pro.city} ↗</span></Link><div className={s.photoChoices} role="group" aria-label="Galeries professionnelles">{pros.map((p,i)=><button key={p.slug} type="button" aria-pressed={i===index} onClick={()=>setIndex(i)}>{p.trade}</button>)}</div></div>;
}
