import {production} from './data.mjs';
import {yesterday} from './lib.mjs';
import {fmt,percent,unitCount,shiftDate,validDate,groups,plantPeriods,dailyPlant,dayInsight,timestamp} from './explorer.mjs';
import {drawChart,sparkline,alignPrevious,clock,svgNode} from './charts.mjs';
import {drawMap,locations} from './map.mjs';
const $=id=>document.getElementById(id), text=(id,value)=>$(id).textContent=value;
let data,mode='plants',controller,comparisonController,historyController,comparison,detailSelection;
const maxDate=yesterday();
$('date').max=maxDate;
function readURL(){const p=new URLSearchParams(location.search);$('date').value=validDate(p.get('date'),maxDate)?p.get('date'):maxDate;$('search').value=p.get('q')||'';mode=p.get('view')==='units'?'units':'plants';$('compare').checked=p.get('compare')==='1';}
function syncURL(){const url=new URL(location.href);for(const key of ['date','q','kind','view','compare'])url.searchParams.delete(key);url.searchParams.set('date',$('date').value);if($('search').value)url.searchParams.set('q',$('search').value);if(mode!=='plants')url.searchParams.set('view',mode);if($('compare').checked)url.searchParams.set('compare','1');history.replaceState(null,'',url);}
function selection(){if(!data)return [];const query=$('search').value.toLocaleLowerCase('pl');return (mode==='plants'?groups(data.units):data.units).filter(u=>(u.plant+' '+u.code).toLocaleLowerCase('pl').includes(query)).sort((a,b)=>b.energy-a.energy);}
function render(){
 for(const id of ['plants','units']){$(id).classList.toggle('active',mode===id);$(id).setAttribute('aria-pressed',String(mode===id));}
 const rows=selection(),total=data?.units.reduce((s,u)=>s+u.energy,0)||0;$('rows').replaceChildren();$('empty').hidden=!data||rows.length>0;
 for(const u of rows){const tr=document.createElement('tr'),name=document.createElement('td'),button=document.createElement('button'),small=document.createElement('small');button.className='plant-link';button.textContent=u.plant;button.addEventListener('click',()=>openDetail(u));small.textContent=u.code||unitCount(u.count);name.append(button,small);tr.append(name);
 const energy=document.createElement('td');energy.textContent=fmt(u.energy)+' MWh';tr.append(energy);
 const rhythm=document.createElement('td');rhythm.append(sparkline(u.units?plantPeriods(u.units):u.periods,data.date,data.expected));tr.append(rhythm);
 const share=document.createElement('td');share.textContent=percent(total?u.energy/total*100:0);const bar=document.createElement('span'),inner=document.createElement('i');bar.className='bar';inner.style.width=(total?u.energy/total*100:0)+'%';bar.append(inner);share.append(bar);tr.append(share);
 const coverage=document.createElement('td');coverage.textContent=percent(u.samples/(data.expected*(u.count||1))*100);if(u.samples!==data.expected*(u.count||1))coverage.className='incomplete';tr.append(coverage);$('rows').append(tr);
 }
}
function chart(){
 if(!data)return;
 const series=[{name:'KSE',color:'#1d3c32',width:3,periods:data.system?.periods||[]},{name:'Jednostki z listy',color:'#728449',dash:'5 3',periods:plantPeriods(data.units)},{name:'Wiatr',color:'#297ca0',periods:(data.system?.periods||[]).map(p=>({...p,power:p.wind}))},{name:'Słońce / PV',color:'#b77c15',periods:(data.system?.periods||[]).map(p=>({...p,power:p.solar}))}];
 if(comparison)series.push({name:'KSE · '+comparison.date,color:'#897496',dash:'7 5',periods:alignPrevious(comparison.system?.periods||[],data.date,data.expected)});
 $('chart-legend').replaceChildren();for(const s of series){const label=document.createElement('span');label.textContent=(s.dash?'┄ ':'━ ')+s.name;label.style.color=s.color;$('chart-legend').append(label);}
 drawChart($('chart'),{date:data.date,expected:data.expected,series,readout:$('chart-readout')});
 const p=(data.system?.periods||[]).filter(p=>p.power!=null);if(p.length){const low=p.reduce((a,b)=>a.power<b.power?a:b),high=p.reduce((a,b)=>a.power>b.power?a:b);text('extrema',(data.system.total==null?'W dostępnych pomiarach: ':'')+'Minimum KSE: '+fmt(low.power/1000)+' GW o '+clock(timestamp(low.utc)-900000)+' · maksimum: '+fmt(high.power/1000)+' GW o '+clock(timestamp(high.utc)-900000)+'.');}else text('extrema','');
}
function summary(){
 const s=data.system,listed=data.units.reduce((v,u)=>v+u.energy,0),complete=data.units.filter(u=>u.samples===data.expected).length,full=data.units.length>0&&complete===data.units.length,value=n=>n==null?'—':fmt(n/1000);
 text('total',value(s?.total));text('wind',value(s?.wind));text('solar',value(s?.solar));text('listed',value(listed));
 const difference=s?.total!=null&&full?s.total-listed:null,share=difference!==null&&difference>=0&&s.total>0?listed/s.total*100:null;
 text('unlisted',value(difference));$('volume-bar').hidden=share===null;$('listed-bar').style.width=(share??0)+'%';text('share',share===null?'Brak pełnych danych do porównania.':percent(share)+' generacji KSE ma dostępny podział na jednostki z listy.');
 text('system-note',s?.total==null?'Raport zbiorczy KSE jest niedostępny lub niekompletny. Niepełnej doby nie przedstawiamy jako całkowitej produkcji.':'Generacja KSE obejmuje jednostki grafikowe i jednostki nieuczestniczące aktywnie w rynku bilansującym. Wiatr i PV są częścią sumy — nie dodajemy ich ponownie.');
 text('storage',s?.storageGeneration!=null?'Magazyny oddały do sieci '+value(s.storageGeneration)+' GWh (wliczone w KSE). Energia ładowania: '+value(s.storageCharging==null?null:Math.abs(s.storageCharging))+' GWh.':'');
 text('count',data.units.length);text('coverage',complete+'/'+data.units.length);text('expected',data.expected+' interwałów na jednostkę');text('quality-badge',complete+'/'+data.units.length+' pełnych serii'+(s?.total==null?' · KSE niekompletne':''));text('insight',dayInsight(data));
}
async function loadComparison(){
 comparisonController?.abort();comparison=null;text('compare-status','');if(data)chart();if(!$('compare').checked||!data)return;
 const date=shiftDate(data.date,-1);if(!validDate(date,maxDate)){text('compare-status','Brak wcześniejszego dnia w archiwum.');return;}
 const request=new AbortController();comparisonController=request;const selectedDate=data.date;text('compare-status','Pobieranie poprzedniego dnia…');
 try {const previous=await production(date,AbortSignal.any([request.signal,AbortSignal.timeout(120000)]));if(request.signal.aborted||data?.date!==selectedDate)return;comparison=previous;chart();
 const current=data.system?.total,old=previous.system?.total;let message=old>0&&current!=null?'Zmiana KSE: '+(current-old>=0?'+':'')+fmt((current-old)/old*100)+'% względem '+date+'.':'Brak pełnych danych do porównania energii dobowej.';
 if(previous.expected!==data.expected)message+=' Doby mają różną długość; linie dopasowano do czasu lokalnego.';text('compare-status',message);
 }catch(e){if(!request.signal.aborted){text('compare-status','Nie udało się pobrać porównania. Wyłącz i włącz porównanie, aby ponowić.');}}
}
function reset(){data=null;comparison=null;render();$('detail').close();for(const id of ['chart','chart-readout','chart-legend'])$(id).replaceChildren();for(const id of ['count','coverage','total','wind','solar','listed','unlisted'])text(id,'—');$('volume-bar').hidden=true;for(const id of ['share','storage','system-note','extrema','compare-status','updated','quality-badge'])text(id,'');$('csv').disabled=true;text('insight','Przygotowujemy podsumowanie dnia…');drawMap(null,$('map'),$('map-list'),$('map-note'),openDetail);}
async function load(){
 if(!validDate($('date').value,maxDate)){text('status','Wybierz datę od 14.06.2024 do wczoraj.');return;}
 controller?.abort();comparisonController?.abort();historyController?.abort();controller=new AbortController();const current=controller,date=$('date').value;syncURL();reset();$('previous').disabled=date==='2024-06-14';$('next').disabled=date===maxDate;text('status','Pobieranie danych PSE…');
 try {const result=await production(date,AbortSignal.any([current.signal,AbortSignal.timeout(120000)]));if(current.signal.aborted)return;data=result;
 text('status',data.units.length?'Dane PSE · '+data.date+' · raport dobowy':'PSE nie opublikowało danych jednostek dla tej doby.');text('updated','Pobrano: '+new Date(data.fetchedAt).toLocaleString('pl-PL',{timeZone:'Europe/Warsaw'}));$('csv').disabled=!data.units.length;render();summary();chart();drawMap(data,$('map'),$('map-list'),$('map-note'),openDetail);loadComparison();
 }catch(e){if(!current.signal.aborted){text('status','Nie udało się pobrać danych. '+e.message+' ');text('insight','Podsumowanie będzie dostępne po pobraniu danych.');const retry=document.createElement('button');retry.textContent='Spróbuj ponownie';retry.addEventListener('click',load);$('status').append(retry);}}
}
function openDetail(u){
 historyController?.abort();detailSelection={plant:u.plant,code:u.code||''};const units=data.units.filter(v=>v.plant===u.plant&&(!u.code||u.code===v.code));
 text('detail-title',u.plant+(u.code?' · '+u.code:''));text('detail-date',data.date);text('detail-summary',fmt(u.energy/1000)+' GWh · '+unitCount(units.length)+' · pokrycie danych '+percent(units.reduce((n,v)=>n+v.samples,0)/(units.length*data.expected)*100));
 $('detail-location').replaceChildren();const site=locations.find(l=>l.names.includes(u.plant));if(site){const link=document.createElement('a');link.href=site.source;link.target='_blank';link.rel='noopener';link.textContent='Źródło lokalizacji ↗';$('detail-location').append(link);}
 drawChart($('detail-chart'),{date:data.date,expected:data.expected,series:[{name:u.code||u.plant,color:'#3e765a',periods:plantPeriods(units)}],readout:$('detail-readout')});
 $('history-chart').replaceChildren();$('history-table').replaceChildren();text('history-status','Wybierz zakres, aby pobrać historię.');document.querySelectorAll('[data-days]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
 $('detail-units').replaceChildren();for(const unit of units){const row=document.createElement('div');row.className='unit-row';const name=document.createElement('span');name.textContent=unit.code;const value=document.createElement('strong');value.textContent=fmt(unit.energy/1000)+' GWh';row.append(name,sparkline(unit.periods,data.date,data.expected),value);$('detail-units').append(row);}
 if(!$('detail').open)$('detail').showModal();$('detail').scrollTop=0;
}
function renderHistory(rows){
 const max=Math.max(1,...rows.map(r=>r.energy||0)),svg=svgNode('svg',{viewBox:'0 0 900 190',role:'img','aria-label':'Historia produkcji w GWh. Dokładne wartości w tabeli poniżej.'});
 svg.append(svgNode('text',{x:20,y:12},'Maks. '+fmt(max/1000)+' GWh'));
 rows.forEach((r,i)=>{const x=20+i*860/rows.length,width=Math.max(4,860/rows.length-8);if(r.energy!=null){const height=r.energy/max*135;const rect=svgNode('rect',{x,y:150-height,width,height:Math.max(1,height),rx:3,fill:'#4a7e5c'});rect.append(svgNode('title',{},r.date+': '+fmt(r.energy/1000)+' GWh'));svg.append(rect);}else svg.append(svgNode('text',{x:x+width/2,y:145,'text-anchor':'middle'},'—'));if(i%Math.max(1,Math.ceil(rows.length/7))===0)svg.append(svgNode('text',{x:x+width/2,y:178,'text-anchor':'middle'},r.date.slice(5)));});
 $('history-chart').replaceChildren(svg);const table=document.createElement('table');const head=document.createElement('thead'),hr=document.createElement('tr');for(const label of ['Doba','Produkcja','Dane']){const th=document.createElement('th');th.textContent=label;hr.append(th);}head.append(hr);table.append(head);const body=document.createElement('tbody');for(const row of rows){const tr=document.createElement('tr');for(const value of [row.date,row.energy==null?'—':fmt(row.energy/1000)+' GWh',row.state]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}table.append(body);const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Dokładne wartości i kompletność danych';details.append(summary,table);$('history-table').replaceChildren(details);
}
async function loadHistory(days){
 if(!data||!detailSelection)return;historyController?.abort();historyController=new AbortController();const request=historyController,selection={...detailSelection},end=data.date;
 document.querySelectorAll('[data-days]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.days)===days);b.setAttribute('aria-pressed',String(Number(b.dataset.days)===days));});
 const dates=Array.from({length:days},(_,i)=>shiftDate(end,i-days+1)).filter(d=>validDate(d,maxDate)),rows=dates.map(date=>({date,energy:null,state:'Oczekuje'}));renderHistory(rows);
 // Sequential fetching limits load on PSE. A closed dialog cancels further work.
 for(let i=0;i<dates.length;i++){
  if(request.signal.aborted)return;text('history-status',`Pobieranie historii: ${i+1}/${dates.length} dni…`);
  try{const result=dates[i]===data?.date?data:await production(dates[i],AbortSignal.any([request.signal,AbortSignal.timeout(120000)]),{unitsOnly:true});if(request.signal.aborted)return;rows[i].energy=dailyPlant(result,selection.plant,selection.code);rows[i].state=rows[i].energy==null?'Brak pełnej serii':'Pełna seria';}
  catch(e){if(request.signal.aborted)return;rows[i].state='Błąd pobierania';}
  renderHistory(rows);
 }
 if(!request.signal.aborted)text('history-status','Pełne dane: '+rows.filter(r=>r.energy!=null).length+'/'+dates.length+' dni. Wybierz zakres ponownie, aby odświeżyć brakujące dni.');
}
$('date').addEventListener('change',load);
for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{$('date').value=shiftDate($('date').value,delta);load();});
$('search').addEventListener('input',()=>{render();syncURL();});
for(const id of ['plants','units'])$(id).addEventListener('click',()=>{mode=id;render();syncURL();});
$('compare').addEventListener('change',()=>{syncURL();loadComparison();});
$('share-link').addEventListener('click',async()=>{syncURL();try{await navigator.clipboard.writeText(location.href);text('share-status','Link skopiowany.');}catch{text('share-status','Skopiuj adres z paska przeglądarki.');}});
$('close-detail').addEventListener('click',()=>$('detail').close());$('detail').addEventListener('close',()=>historyController?.abort());
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}});
for(const button of document.querySelectorAll('[data-days]'))button.addEventListener('click',()=>loadHistory(Number(button.dataset.days)));
$('csv').addEventListener('click',()=>{if(!data)return;const cell=s=>'"'+String(s).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const csv='\uFEFF'+[['Elektrownia','Kod JW','Energia MWh','Interwały'],...selection().map(u=>[u.plant,u.code,u.energy,u.samples])].map(r=>r.map(cell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='elen-'+data.date+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
window.addEventListener('popstate',()=>{readURL();load();});readURL();load();
