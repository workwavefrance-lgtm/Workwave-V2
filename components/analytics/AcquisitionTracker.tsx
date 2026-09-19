"use client";
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { acquisitionContext } from '@/lib/analytics/acquisition-client';
import { trackClient } from '@/lib/analytics/client-track';
import { EVENTS } from '@/lib/analytics/events';
import { publicPath, ctaId } from '@/lib/analytics/acquisition';
/** Read-only public paths; no query string, DOM copy, needs or contact details. */
export default function AcquisitionTracker(){
  const pathname=usePathname();
  const lastView=useRef('');
  useEffect(()=>{
    const observe=()=>{const context=acquisitionContext();if(!context){lastView.current='';return;}const key=context.sessionId+':'+pathname;if(lastView.current!==key){lastView.current=key;trackClient(EVENTS.PAGE_VIEW,{path:pathname});}};
    const click=(event:MouseEvent)=>{
      if(!(event.target instanceof Element))return;
      const element=event.target.closest<HTMLElement>('[data-project-cta],a[href]');if(!element)return;
      let cta=ctaId(element.dataset.projectCta);
      if(!cta&&element instanceof HTMLAnchorElement){const url=new URL(element.href,location.origin);if(url.origin===location.origin&&url.pathname==='/deposer-projet')cta='deposit-link';}
      if(!cta||!publicPath(pathname))return;
      observe();acquisitionContext(cta);trackClient(EVENTS.PROJECT_CTA_CLICKED,{cta,path:pathname});
    };
    observe();document.addEventListener('click',click,true);window.addEventListener('ww-consent-change',observe);
    return()=>{document.removeEventListener('click',click,true);window.removeEventListener('ww-consent-change',observe);};
  },[pathname]);
  return null;
}
