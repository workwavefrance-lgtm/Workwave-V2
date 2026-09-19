/** Public, consented attribution only. No query, fragment, referrer or free text. */
export type Acquisition = { version: 1; sessionId: string; entryPath: string; entryFamily: string; lastCta?: string; startedAt: number };
export const ACQUISITION_KEY = 'ww-acquisition-v1';
export const ACQUISITION_TTL = 30 * 60 * 1000;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const PRIVATE = /^(?:admin|api|auth|pro|ai|en|avis|unsubscribe(?:-all|-review)?|enquete-pro|test|compte|connexion|inscription|reset|reinitialiser|deposer-projet\/(?:merci|supprimer))(?:\/|$)/;
export function publicPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 1000 || !value.startsWith('/') || value.startsWith('//')) return null;
  const path=value.split(/[?#]/)[0].replace(/\/$/,'') || '/';
  if(path.length>220 || !/^\/[a-z0-9/-]*$/.test(path) || /\/\//.test(path) || /\d{9}/.test(path) || /\/(?:supprimer|verification)(?:\/|$)/.test(path) || PRIVATE.test(path.slice(1))) return null;
  return path;
}
export function pageFamily(path: string): string {
  if(path==='/')return 'home';
  if(path.startsWith('/artisan/'))return 'fiche';
  if(path.startsWith('/blog'))return 'blog';
  if(path.startsWith('/guide-des-prix'))return 'prix';
  if(path==='/deposer-projet')return 'depot';
  if(path.startsWith('/recherche'))return 'recherche';
  if(path.startsWith('/departement'))return 'departement';
  if(path.includes('/guide'))return 'guide';
  return 'autre-page-publique';
}
export function ctaId(value: unknown): string | undefined {
  return typeof value==='string' && /^[a-z][a-z0-9_-]{0,59}$/.test(value) ? value : undefined;
}
export function sanitizeAcquisition(value: unknown, now=Date.now()): Acquisition | null {
  if(!value || typeof value!=='object' || Array.isArray(value))return null;
  const v=value as Record<string,unknown>,entryPath=publicPath(v.entryPath);
  if(v.version!==1 || typeof v.sessionId!=='string' || !UUID.test(v.sessionId) || !entryPath || typeof v.startedAt!=='number' || !Number.isFinite(v.startedAt) || v.startedAt>now || now-v.startedAt>ACQUISITION_TTL)return null;
  return {version:1,sessionId:v.sessionId,entryPath,entryFamily:pageFamily(entryPath),startedAt:v.startedAt,...(ctaId(v.lastCta)?{lastCta:ctaId(v.lastCta)}:{})};
}
export function parseAcquisition(value: unknown, consent: boolean): Acquisition | null {
  if(!consent || typeof value!=='string' || value.length>1000)return null;
  try{return sanitizeAcquisition(JSON.parse(value));}catch{return null;}
}
export function safeEventMetadata(value: unknown): Record<string,unknown> {
  const result:Record<string,unknown>={};
  if(!value || typeof value!=='object')return result;
  const v=value as Record<string,unknown>;
  for(const key of ['step','initialStep','proId'])if(Number.isSafeInteger(v[key]) && Number(v[key])>0 && Number(v[key])<1e9)result[key]=v[key];
  if(typeof v.inline==='boolean')result.inline=v.inline;
  if(typeof v.name==='string' && ['Métier','Quand','Projet','Coordonnées','Besoin','Vérification'].includes(v.name))result.name=v.name;
  const path=publicPath(v.path);if(path)result.path=path;
  const cta=ctaId(v.cta);if(cta)result.cta=cta;
  return result;
}
