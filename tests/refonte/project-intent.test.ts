import test from 'node:test';
import assert from 'node:assert/strict';
import { saveProjectIntent,takeProjectIntent } from '../../lib/project-intent';
test('the functional draft is consumed once, bounded, and tolerates blocked storage',()=>{
 const values=new Map<string,string>();
 const old=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 try{
   Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{setItem:(k:string,v:string)=>values.set(k,v),getItem:(k:string)=>values.get(k)??null,removeItem:(k:string)=>values.delete(k)}});
   assert.equal(saveProjectIntent('  repeindre le salon  '),true);assert.equal(takeProjectIntent(),'repeindre le salon');assert.equal(takeProjectIntent(),'');
   saveProjectIntent('x'.repeat(2000));assert.equal(takeProjectIntent().length,1000);
   values.set('ww-project-intent-v1',JSON.stringify({need:'ancien',at:Date.now()-3600000}));assert.equal(takeProjectIntent(),'');
   values.set('ww-project-intent-v1','{broken');assert.equal(takeProjectIntent(),'');
   Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw new Error('storage denied');}});
   assert.equal(saveProjectIntent('salon'),false);assert.equal(takeProjectIntent(),'');
 }finally{if(old)Object.defineProperty(globalThis,'sessionStorage',old);else Reflect.deleteProperty(globalThis,'sessionStorage');}
});
