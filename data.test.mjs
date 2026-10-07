import {test} from 'node:test';
import assert from 'node:assert/strict';
import {production,report} from './public/data.mjs';
test('history requests only units, reuses cache, and aborts even for cached days',async()=>{
 const original=globalThis.fetch,calls=[];globalThis.fetch=async url=>{calls.push(String(url));return {ok:true,json:async()=>({value:[]})};};
 try{await production('2026-09-01',undefined,{unitsOnly:true});await production('2026-09-01',undefined,{unitsOnly:true});assert.equal(calls.length,1);assert.match(calls[0],/gen-jw/);const controller=new AbortController();controller.abort();await assert.rejects(production('2026-09-01',controller.signal,{unitsOnly:true}),{name:'AbortError'});}finally{globalThis.fetch=original;}
});
test('summary failure leaves units available and can be retried',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async url=>{calls++;if(String(url).includes('his-wlk-cal'))throw new Error('offline');return {ok:true,json:async()=>({value:[]})};};
 try{const result=await production('2026-09-02');assert.equal(result.system,null);assert.deepEqual(result.units,[]);await production('2026-09-02');assert.equal(calls,4);}finally{globalThis.fetch=original;}
});
test('pagination rejects foreign origins and cycles without fetching them',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({value:[],nextLink:'https://example.com/data'})};};
 try{await assert.rejects(report('gen-jw','2026-09-03'),/paginacja/);assert.equal(calls,1);globalThis.fetch=async url=>({ok:true,json:async()=>({value:[],nextLink:String(url)})});await assert.rejects(report('gen-jw','2026-09-03'),/paginacja/);}finally{globalThis.fetch=original;}
});
