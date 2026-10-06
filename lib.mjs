export function yesterday(now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  return new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
}
export function aggregate(rows, date) {
  const unique = new Map();
  for (const r of rows) {
    if(r.business_date !== date || !['Generation','Generacja'].includes(r.operating_mode_eng || r.operating_mode)) continue;
    if(r.value === null || r.value === '' || !Number.isFinite(Number(r.value))) continue;
    const key = r.resource_code+'|'+r.dtime_utc;
    if(!unique.has(key) || (r.publication_ts_utc||'') > (unique.get(key).publication_ts_utc||'')) unique.set(key,r);
  }
  const units = new Map(), periods = new Map();
  for(const r of unique.values()) {
    const u = units.get(r.resource_code) || {code:r.resource_code,plant:r.power_plant,energy:0,peak:0,samples:0};
    const power = Number(r.value);
    u.energy += power/4; u.peak = Math.max(u.peak,power); u.samples++;
    units.set(u.code,u);
    const p = periods.get(r.dtime_utc) || {utc:r.dtime_utc,label:r.period,power:0};
    p.power += power; periods.set(r.dtime_utc,p);
  }
  const offset = s => Date.parse(s+'T00:00:00Z') - Date.parse(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',dateStyle:'short',timeStyle:'medium'}).format(new Date(s+'T00:00:00Z')).replace(' ','T')+'Z');
  const next = new Date(Date.parse(date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
  const expected = (86400000 + offset(next)-offset(date))/900000;
  return {date,expected,units:[...units.values()].sort((a,b)=>b.energy-a.energy),periods:[...periods.values()].sort((a,b)=>a.utc.localeCompare(b.utc)),records:unique.size};
}
