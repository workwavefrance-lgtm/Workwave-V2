import { ACQUISITION_KEY, publicPath, pageFamily, sanitizeAcquisition, ctaId, type Acquisition } from './acquisition';
export function analyticsAccepted() { return typeof document!=='undefined' && document.cookie.split(';').some(c=>c.trim()==='consent_analytics=accepted'); }
export function clearAcquisition(){try{sessionStorage.removeItem(ACQUISITION_KEY);}catch{/* Optional storage. */}}
export function acquisitionContext(cta?:string): Acquisition | null {
  if(typeof window==='undefined')return null;
  if(!analyticsAccepted()){clearAcquisition();return null;}
  const path=publicPath(location.pathname);if(!path)return null;
  try{
    let context=sanitizeAcquisition(JSON.parse(sessionStorage.getItem(ACQUISITION_KEY)||'null'));
    if(!context)context={version:1,sessionId:crypto.randomUUID(),entryPath:path,entryFamily:pageFamily(path),startedAt:Date.now()};
    if(ctaId(cta))context.lastCta=cta;
    sessionStorage.setItem(ACQUISITION_KEY,JSON.stringify(context));return context;
  }catch{return null;}
}
