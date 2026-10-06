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
  const p=data.periods;if(!p.length){$('chart').textContent='Brak danych wykresu.';return;}
  const start=Date.parse(p[0].utc.replace(' ','T')+'Z')-900000,end=start+data.expected*900000,max=Math.max(1,...p.map(x=>x.power));
  const x=t=>55+(t-start)/(end-start)*920,y=v=>175-v/max*150;
  let path='',previous;
  for(const v of p){const time=Date.parse(v.utc.replace(' ','T')+'Z');path+=(previous&&time-previous===900000?' L':' M')+x(time)+','+y(v.power);previous=time;}
  const labels=p.filter((_,i)=>i%Math.max(1,Math.floor(p.length/6))===0).map(v=>`<text x="${x(Date.parse(v.utc.replace(' ','T')+'Z'))}" y="205" text-anchor="middle">${v.label.slice(0,5)}</text>`).join('');
  $('chart').innerHTML=`<svg viewBox="0 0 1000 220" role="img" aria-label="Moc raportowanych jednostek w ciągu doby">${[0,.5,1].map(v=>`<line x1="55" x2="975" y1="${y(max*v)}" y2="${y(max*v)}" stroke="#e8ede3"/><text x="0" y="${y(max*v)+4}">${fmt(max*v)}</text>`).join('')}<path d="${path}" fill="none" stroke="#759b50" stroke-width="3"/>${labels}</svg>`;
}
async function load(){
  controller?.abort();controller=new AbortController();const current=controller;
  data=null;render();$('chart').replaceChildren();for(const id of ['energy','count','coverage'])$(id).textContent='—';$('csv').disabled=true;$('updated').textContent='';$('status').textContent='Pobieranie danych PSE…';
  try{const response=await fetch('/api/production?date='+$('date').value,{signal:current.signal});const result=await response.json();if(!response.ok)throw new Error(result.error);data=result;
    $('energy').textContent=fmt(data.units.reduce((s,u)=>s+u.energy,0));$('count').textContent=fmt(data.units.length);$('coverage').textContent=data.units.filter(u=>u.samples===data.expected).length+'/'+data.units.length;
    $('expected').textContent=data.expected+' interwałów na jednostkę';$('status').textContent=data.units.length?'Dane PSE · '+data.date+' · ranking obejmuje jednostki dostępne w raporcie':'PSE nie opublikowało danych dla tej doby.';
    $('updated').textContent='Pobrano: '+new Date(data.fetchedAt).toLocaleString('pl-PL',{timeZone:'Europe/Warsaw'});$('csv').disabled=!data.units.length;render();chart();
  }catch(e){if(e.name!=='AbortError'){$('status').textContent=e.message;$('empty').hidden=false;}}
}
$('date').addEventListener('change',load);for(const id of ['search','kind'])$(id).addEventListener('input',render);
for(const id of ['plants','units'])$(id).addEventListener('click',()=>{mode=id;$('plants').classList.toggle('active',mode==='plants');$('units').classList.toggle('active',mode==='units');render();});
$('csv').addEventListener('click',()=>{const cell=s=>'"'+String(s).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const text='\uFEFF'+[['Elektrownia','Kod JW','Energia MWh','Interwały'],...selection().map(u=>[u.plant,u.code,u.energy,u.samples])].map(r=>r.map(cell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='elen-'+data.date+'.csv';a.click();URL.revokeObjectURL(url);});
load();
