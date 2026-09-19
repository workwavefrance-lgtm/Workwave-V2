import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import type { BlogPost } from '@/lib/queries/blog';
import s from './editorial-glass.module.css';

function DateLabel({date}:{date:string|null}) {
  return date ? <time dateTime={date}>{new Date(date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</time> : null;
}
export default function BlogGlass({posts,page,totalPages}:{posts:BlogPost[];page:number;totalPages:number}) {
  const [featured,...articles] = posts;
  return <main className={s.page} data-glass>
    <header className={s.heading}><div><p className={s.kicker}>Le carnet Workwave</p><h1>Des idées pour commencer.<br /><span>Des repères pour avancer.</span></h1><p>Conseils, guides et budgets : prenez le temps de préparer votre projet, puis trouvez avec qui le réaliser.</p></div><Link href="/guide-des-prix" className={s.secondary}>Explorer les guides de prix →</Link></header>
    {featured ? <><Link href={`/blog/${featured.slug}`} className={s.featured}><div><p className={s.kicker}>À la une du carnet</p><h2>{featured.title}</h2><p>{featured.meta_description}</p><span className={s.read}>Lire l’article →</span></div><div className={s.featureMeta}><span>{featured.tags?.[0] || 'Préparer son projet'}</span><DateLabel date={featured.published_at}/></div></Link>
    <section className={s.articles} aria-label="Les conseils et guides Workwave">{articles.map(post=><Link href={`/blog/${post.slug}`} key={post.id} className={s.card}><div className={s.tags}>{post.tags?.slice(0,2).map(t=><span key={t}>{t}</span>)}</div><h2>{post.title}</h2><p>{post.meta_description}</p><div className={s.cardEnd}><DateLabel date={post.published_at}/><span>Lire →</span></div></Link>)}</section></> : <p className={s.empty}>Le carnet se prépare. Retrouvez nos guides de prix pour commencer à préciser votre besoin.</p>}
    <Pagination currentPage={page} totalPages={totalPages} baseUrl="/blog"/>
    <section className={s.project}><div><p className={s.kicker}>De l’idée au projet</p><h2>Vous savez ce que vous voulez ?<br /><span>Racontez-nous.</span></h2><p>Expliquez votre besoin. Les professionnels concernés et intéressés pourront vous contacter.</p></div><Link href="/deposer-projet" data-project-cta="blog-hub" className={s.primary}>Décrire mon projet →</Link></section>
  </main>;
}
