import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {aggregate,yesterday} from './lib.mjs';
const cache = new Map(), pending = new Map();
async function load(date) {
  if(cache.get(date)?.expires > Date.now()) return cache.get(date).data;
  if(pending.has(date)) return pending.get(date);
  const task = (async()=>{
    let url = new URL('https://api.raporty.pse.pl/api/gen-jw');
    url.searchParams.set('$filter',`business_date eq '${date}'`); url.searchParams.set('$first','5000');
    const rows = [], visited = new Set();
    while(url) {
      if(url.origin !== 'https://api.raporty.pse.pl' || visited.has(url.href) || visited.size > 100) throw new Error('Nieprawidłowa paginacja PSE');
      visited.add(url.href);
      const response = await fetch(url,{signal:AbortSignal.timeout(30000)});
      if(!response.ok) throw new Error(`PSE: HTTP ${response.status}`);
      const page = await response.json();
      if(!Array.isArray(page.value)) throw new Error('Nieprawidłowa odpowiedź PSE');
      rows.push(...page.value); url = page.nextLink ? new URL(page.nextLink,url) : null;
    }
    const data = {...aggregate(rows,date),fetchedAt:new Date().toISOString()};
    cache.set(date,{data,expires:Date.now()+900000}); return data;
  })();
  pending.set(date,task);
  try { return await task; } finally {pending.delete(date);}
}
createServer(async(req,res)=>{
  const url = new URL(req.url,'http://localhost');
  if(url.pathname === '/api/production') {
    const date = url.searchParams.get('date') || yesterday();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date || date>yesterday() || date<'2024-06-14') {
      res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Wybierz datę od 14.06.2024 do wczoraj.'}));
    }
    try {const data = await load(date);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(data));}
    catch(e) {if(!res.headersSent) res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Nie udało się pobrać danych PSE. Spróbuj ponownie.',detail:e.message}));}
    return;
  }
  const files = {'/':'index.html','/app.js':'app.js','/style.css':'style.css','/data.mjs':'data.mjs','/lib.mjs':'lib.mjs'};
  if(!files[url.pathname]) {res.writeHead(404); return res.end();}
  res.setHeader('Content-Type',/\.m?js$/.test(url.pathname)?'text/javascript; charset=utf-8':url.pathname.endsWith('.css')?'text/css':'text/html; charset=utf-8');
  res.end(await readFile(new URL('./public/'+files[url.pathname],import.meta.url)));
}).listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('ELEN: http://localhost:3000'));
