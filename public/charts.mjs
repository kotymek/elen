import {fmt,timestamp} from './explorer.mjs';
const NS='http://www.w3.org/2000/svg';
const observers=new WeakMap();
export function svgNode(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
export function dayStart(date){const t=Date.parse(date+'T00:00:00Z');const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',hour:'2-digit',hourCycle:'h23'}).format(t));return t-hour*3600000;}
export function clock(t){return new Intl.DateTimeFormat('pl-PL',{timeZone:'Europe/Warsaw',hour:'2-digit',minute:'2-digit'}).format(t);}
export function alignPrevious(periods,date,expected){
  const source=new Map();
  for(const p of periods){const key=clock(timestamp(p.utc)-900000);const list=source.get(key)||[];list.push(p);source.set(key,list);}
  const start=dayStart(date),seen=new Map();
  return Array.from({length:expected},(_,i)=>{const time=start+i*900000,key=clock(time),occurrence=seen.get(key)||0;seen.set(key,occurrence+1);const p=source.get(key)?.[occurrence];return {utc:new Date(time+900000).toISOString().slice(0,19).replace('T',' '),power:p?.power??null};});
}
export function linePath(points,x,y){let path='',last;for(const p of points){if(p.power==null||!Number.isFinite(p.power)){last=undefined;continue;}const t=timestamp(p.utc)-900000;path+=(last!==undefined&&t-last===900000?' L':' M')+x(t)+','+y(p.power);last=t;}return path;}
export function sparkline(periods,date,expected){
  const svg=svgNode('svg',{viewBox:'0 0 110 28',class:'spark','aria-hidden':'true'}),start=dayStart(date),max=Math.max(1,...periods.map(p=>p.power||0));
  svg.append(svgNode('path',{d:linePath(periods,t=>2+(t-start)/(expected*900000)*106,v=>25-v/max*22),fill:'none',stroke:'currentColor','stroke-width':1.6}));return svg;
}
export function drawChart(host,{date,expected,series,readout}){
  observers.get(host)?.disconnect();host.replaceChildren();if(readout)readout.replaceChildren();
  if(!series.some(s=>s.periods.some(p=>p.power!=null))){host.textContent='Brak danych wykresu.';return;}
  const width=Math.max(300,host.clientWidth),right=width-16,span=right-44;
  const start=dayStart(date),end=start+expected*900000,raw=Math.max(1,...series.flatMap(s=>s.periods.map(p=>p.power||0)));
  const magnitude=10**Math.floor(Math.log10(raw/4)),step=[1,2,5,10].find(n=>n*magnitude>=raw/4)*magnitude,max=Math.ceil(raw/step)*step;
  const x=t=>44+(t-start)/(end-start)*span,y=v=>235-v/max*207;
  const svg=svgNode('svg',{viewBox:`0 0 ${width} 280`,role:'group','aria-label':'Wykres mocy w GW, czas polski. Strzałki zmieniają interwał.',tabindex:0});
  for(let v=0;v<=max;v+=step){svg.append(svgNode('line',{x1:44,x2:right,y1:y(v),y2:y(v),stroke:'#e4eae2'}),svgNode('text',{x:35,y:y(v)+4,'text-anchor':'end'},fmt(v/1000)));}
  for(let t=start;t<end;t+=4*3600000)svg.append(svgNode('text',{x:x(t),y:263,'text-anchor':'middle'},clock(t)));
  for(const s of series)svg.append(svgNode('path',{d:linePath(s.periods,x,y),fill:'none',stroke:s.color,'stroke-width':s.width||2.5,'stroke-dasharray':s.dash||'none'}));
  const cursor=svgNode('line',{x1:52,x2:52,y1:24,y2:235,stroke:'#577466','stroke-dasharray':'3 4',visibility:'hidden'});svg.append(cursor);host.append(svg);
  let selected=0;
  const lookups=series.map(s=>new Map(s.periods.map(p=>[timestamp(p.utc)-900000,p.power])));
  function select(index){selected=Math.max(0,Math.min(expected-1,index));const time=start+selected*900000;cursor.setAttribute('x1',x(time));cursor.setAttribute('x2',x(time));cursor.setAttribute('visibility','visible');
    if(readout){const offset=new Intl.DateTimeFormat('pl-PL',{timeZone:'Europe/Warsaw',timeZoneName:'shortOffset',hour:'2-digit',minute:'2-digit'}).format(time);readout.replaceChildren();const title=document.createElement('strong');title.textContent=offset+'–'+clock(time+900000);readout.append(title);series.forEach((s,i)=>{const span=document.createElement('span');const power=lookups[i].get(time);span.textContent=s.name+': '+(power==null?'brak danych':fmt(power)+' MW');readout.append(span);});}
  }
  svg.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect();select(Math.round(((e.clientX-rect.left)/rect.width*width-44)/span*expected));});
  svg.addEventListener('click',e=>{const rect=svg.getBoundingClientRect();select(Math.round(((e.clientX-rect.left)/rect.width*width-44)/span*expected));});
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>{if(host.clientWidth>0&&Math.abs(host.clientWidth-width)>1)drawChart(host,{date,expected,series,readout});});observers.set(host,observer);observer.observe(host);}
  svg.addEventListener('focus',()=>select(selected));
  svg.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();select(e.key==='Home'?0:e.key==='End'?expected-1:selected+(e.key==='ArrowRight'?1:-1));}});
}
