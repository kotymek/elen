export const fmt = n => new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1}).format(n);
export const percent = n => n > 0 && n < .1 ? '<0,1%' : fmt(n)+'%';
export const unitCount = n => n+' '+(n===1?'jednostka wytwórcza':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'jednostki wytwórcze':'jednostek wytwórczych');
export const shiftDate = (date, days) => new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
export const validDate = (date,max) => /^\d{4}-\d{2}-\d{2}$/.test(date||'') && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date && date>='2024-06-14' && date<=max;
export const timestamp = utc => Date.parse(utc.replace(' ','T')+'Z');
export function groups(units) {
  const result=new Map();
  for(const u of units){const g=result.get(u.plant)||{plant:u.plant,code:'',energy:0,samples:0,count:0,units:[]};g.energy+=u.energy;g.samples+=u.samples;g.count++;g.units.push(u);result.set(u.plant,g);}
  return [...result.values()].sort((a,b)=>b.energy-a.energy);
}
// Incomplete plant intervals are gaps rather than misleading partial sums.
export function plantPeriods(units) {
  const result=new Map();
  for(const u of units) for(const p of u.periods||[]){const v=result.get(p.utc)||{...p,power:0,count:0};v.power+=p.power;v.count++;result.set(p.utc,v);}
  return [...result.values()].sort((a,b)=>a.utc.localeCompare(b.utc)).map(p=>({...p,power:p.count===units.length?p.power:null}));
}
export function dailyPlant(data, plant, code='') {
  const units=data.units.filter(u=>u.plant===plant&&(!code||u.code===code));
  return units.length&&units.every(u=>u.samples===data.expected)?units.reduce((s,u)=>s+u.energy,0):null;
}
export function dayInsight(data){
  const s=data.system, parts=[];
  if(s?.total>0&&s.wind!=null&&s.solar!=null) parts.push('Wiatr i słońce odpowiadały za '+percent((s.wind+s.solar)/s.total*100)+' generacji KSE.');
  const leader=groups(data.units)[0];
  if(leader) parts.push('Największa raportowana produkcja na liście: '+leader.plant+' ('+fmt(leader.energy/1000)+' GWh).');
  return parts.join(' ')||'Brak wystarczających danych do podsumowania tej doby.';
}
export function niceCeiling(value){const step=10**Math.floor(Math.log10(Math.max(1,value)));return Math.ceil(value/step)*step||1;}
