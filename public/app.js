import {production} from './data.mjs?v=2';
const $ = id=>document.getElementById(id), fmt = n=>new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1}).format(n);
let data,mode='plants',controller;
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const yesterday = new Date(Date.parse(today+'T12:00:00Z')-86400000).toISOString().slice(0,10);
$('date').max=yesterday; $('date').value=yesterday;
function selection(){
  if(!data)return [];
  let list=data.units;
  if(mode==='plants'){
    const groups=new Map();
    for(const u of list){const g=groups.get(u.plant)||{plant:u.plant,code:'',energy:0,samples:0,count:0};g.energy+=u.energy;g.samples+=u.samples;g.count++;groups.set(u.plant,g);}list=[...groups.values()];
  }
  const query=$('search').value.toLocaleLowerCase('pl');
  return list.filter(u=>(u.plant+' '+u.code).toLocaleLowerCase('pl').includes(query)&&($('kind').value!=='pv'||/\bpv\b|fotowolta/i.test(u.plant))).sort((a,b)=>b.energy-a.energy);
}
function render(){
  const rows=selection(), total=data?.units.reduce((s,u)=>s+u.energy,0)||0;
  $('rows').replaceChildren();$('empty').hidden=rows.length>0;
  for(const u of rows){
    const tr=document.createElement('tr');
    const values=[u.plant,fmt(u.energy)+' MWh',fmt(total?u.energy/total*100:0)+'%',fmt(u.samples/(data.expected*(u.count||1))*100)+'%'];
    values.forEach((value,i)=>{const td=document.createElement('td');td.textContent=value;if(i===0){const small=document.createElement('small');small.textContent=u.code||u.count+' jednostek wytwórczych';td.append(small);}if(i===2){const bar=document.createElement('span');bar.className='bar';const inner=document.createElement('i');inner.style.width=(total?u.energy/total*100:0)+'%';bar.append(inner);td.append(bar);}tr.append(td);});$('rows').append(tr);
  }
}
function chart(){
  const p=data.system?.periods.length ? data.system.periods : data.periods;if(!p.length){$('chart').textContent='Brak danych wykresu.';return;}
  const start=Date.parse(p[0].utc.replace(' ','T')+'Z')-900000,end=start+data.expected*900000,max=Math.max(1,...p.map(x=>x.power),...data.periods.map(x=>x.power));
  const x=t=>55+(t-start)/(end-start)*920,y=v=>175-v/max*150;
  const line = series => {let path='',previous;for(const v of series){const time=Date.parse(v.utc.replace(' ','T')+'Z');path+=(previous&&time-previous===900000?' L':' M')+x(time)+','+y(v.power);previous=time;}return path;};
  const labels=p.filter((_,i)=>i%Math.max(1,Math.floor(p.length/6))===0).map(v=>`<text x="${x(Date.parse(v.utc.replace(' ','T')+'Z'))}" y="205" text-anchor="middle">${v.label.slice(0,5)}</text>`).join('');
  $('chart').innerHTML=`<svg viewBox="0 0 1000 220" role="img" aria-label="Porównanie generacji KSE i jednostek z listy">${[0,.5,1].map(v=>`<line x1="55" x2="975" y1="${y(max*v)}" y2="${y(max*v)}" stroke="#e8ede3"/><text x="0" y="${y(max*v)+4}">${fmt(max*v)}</text>`).join('')}${data.system?.periods.length?`<path d="${line(p)}" fill="none" stroke="#1d3c32" stroke-width="3"/>`:''}<path d="${line(data.periods)}" fill="none" stroke="#92aa60" stroke-width="2"/>${labels}</svg>`;
}
function summary(){
  const s=data.system, listed=data.units.reduce((v,u)=>v+u.energy,0), full=data.units.length>0&&data.units.every(u=>u.samples===data.expected);
  const value=n=>n===null||n===undefined?'—':fmt(n/1000);
  $('total').textContent=value(s?.total);$('wind').textContent=value(s?.wind);$('solar').textContent=value(s?.solar);
  $('listed').textContent=value(listed);
  const difference=s?.total!==null&&s?.total!==undefined&&full ? s.total-listed : null;
  $('unlisted').textContent=value(difference);
  const share=difference!==null&&difference>=0&&s.total>0?listed/s.total*100:null;
  $('volume-bar').hidden=share===null;$('listed-bar').style.width=(share??0)+'%';
  $('share').textContent=share===null?'Brak pełnych danych do porównania.':fmt(share)+'% generacji KSE ma dostępny podział na jednostki w tej liście.';
  $('system-note').textContent=s?.total===null||!s?'Raport zbiorczy KSE jest niedostępny lub niekompletny. Niepełnej doby nie przedstawiamy jako całkowitej produkcji.':'Łączna generacja KSE = JG + jednostki poza aktywnym udziałem w rynku bilansującym. Wiatr i PV są częścią tej sumy — nie dodajemy ich ponownie.';
  $('storage').textContent=s?.storageGeneration!==null&&s?.storageGeneration!==undefined?'W sumie KSE: generacja magazynów '+value(s.storageGeneration)+' GWh. Ładowanie: '+value(s.storageCharging===null?null:Math.abs(s.storageCharging))+' GWh, pokazane osobno.':'';
}
async function load(){
  controller?.abort();controller=new AbortController();const current=controller;
  data=null;render();$('chart').replaceChildren();for(const id of ['energy','count','coverage','total','wind','solar','listed','unlisted'])$(id).textContent='—';$('volume-bar').hidden=true;for(const id of ['share','storage','system-note'])$(id).textContent='';$('csv').disabled=true;$('updated').textContent='';$('status').textContent='Pobieranie danych PSE…';
  try{data=await production($('date').value,AbortSignal.any([current.signal,AbortSignal.timeout(120000)]));
    $('energy').textContent=fmt(data.units.reduce((s,u)=>s+u.energy,0));$('count').textContent=fmt(data.units.length);$('coverage').textContent=data.units.filter(u=>u.samples===data.expected).length+'/'+data.units.length;
    $('expected').textContent=data.expected+' interwałów na jednostkę';$('status').textContent=data.units.length?'Dane PSE · '+data.date+' · ranking obejmuje jednostki dostępne w raporcie':'PSE nie opublikowało danych dla tej doby.';
    $('updated').textContent='Pobrano: '+new Date(data.fetchedAt).toLocaleString('pl-PL',{timeZone:'Europe/Warsaw'});$('csv').disabled=!data.units.length;render();summary();chart();
  }catch(e){if(e.name!=='AbortError'){$('status').textContent='Nie udało się pobrać danych. '+e.message+' ';const retry=document.createElement('button');retry.textContent='Spróbuj ponownie';retry.addEventListener('click',load);$('status').append(retry);$('empty').hidden=false;}}
}
$('date').addEventListener('change',load);for(const id of ['search','kind'])$(id).addEventListener('input',render);
for(const id of ['plants','units'])$(id).addEventListener('click',()=>{mode=id;$('plants').classList.toggle('active',mode==='plants');$('units').classList.toggle('active',mode==='units');render();});
$('csv').addEventListener('click',()=>{const cell=s=>'"'+String(s).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const text='\uFEFF'+[['Elektrownia','Kod JW','Energia MWh','Interwały'],...selection().map(u=>[u.plant,u.code,u.energy,u.samples])].map(r=>r.map(cell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='elen-'+data.date+'.csv';a.click();URL.revokeObjectURL(url);});
load();

