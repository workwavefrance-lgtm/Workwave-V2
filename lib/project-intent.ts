/** Functional, short-lived handoff. Never included in analytics or a URL. */
const KEY='ww-project-intent-v1';
const TTL=15*60*1000;
export function saveProjectIntent(need:string):boolean{
 try{sessionStorage.setItem(KEY,JSON.stringify({need:need.trim().slice(0,1000),at:Date.now()}));return true;}catch{return false;}
}
export function takeProjectIntent():string{
 try{const raw=sessionStorage.getItem(KEY);sessionStorage.removeItem(KEY);if(!raw)return '';const value=JSON.parse(raw);return typeof value.need==='string'&&typeof value.at==='number'&&value.at<=Date.now()&&Date.now()-value.at<TTL?value.need.slice(0,1000):'';}catch{return '';}
}
