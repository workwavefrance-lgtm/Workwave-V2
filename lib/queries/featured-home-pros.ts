import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public-client';
export type FeaturedHomePro = {slug:string;name:string;photo:string;trade:string;city:string};
const selection=['lf-concept-00021','homerenov91-00011','elagage-precis-00030'];
export const getFeaturedHomePros=cache(async ():Promise<FeaturedHomePro[]>=>{
  const {data,error}=await createPublicClient().from('pros').select('slug,name,photos,category:categories(name),city:cities(name)').in('slug',selection).eq('is_active',true).is('deleted_at',null).or('etat_admin.is.null,etat_admin.neq.F');
  if(error||!data)return [];
  return selection.flatMap(slug=>{
    const row=data.find(p=>p.slug===slug);if(!row)return [];
    const photo=Array.isArray(row.photos)?row.photos.find((value:unknown)=>{
      if(typeof value!=='string')return false;
      try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='eifypjlyzgfpunxrouwo.supabase.co'&&u.pathname.startsWith('/storage/v1/object/public/');}catch{return false;}
    }):undefined;
    const category=Array.isArray(row.category)?row.category[0]:row.category;
    const city=Array.isArray(row.city)?row.city[0]:row.city;
    return photo&&category?.name&&city?.name?[{slug,name:row.name,photo,trade:category.name,city:city.name}]:[];
  });
});
