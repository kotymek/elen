export function yesterday(now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  return new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
}
export function systemSummary(rows, date, expected) {
  const latest = new Map();
  for (const r of rows) {
    if(r.business_date !== date) continue;
    if(!latest.has(r.dtime_utc) || (r.publication_ts_utc||'') > (latest.get(r.dtime_utc).publication_ts_utc||'')) latest.set(r.dtime_utc,r);
  }
  const valid = n => n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n));
  const series = [...latest.values()].sort((a,b)=>a.dtime_utc.localeCompare(b.dtime_utc));
  const energy = fields => series.length === expected && series.every(r=>fields.every(f=>valid(r[f]))) ? series.reduce((s,r)=>s+fields.reduce((v,f)=>v+Number(r[f]),0)/4,0) : null;
  return {total:energy(['jg','jnwrb']),scheduled:energy(['jg']),other:energy(['jnwrb']),wind:energy(['wi']),solar:energy(['pv']),storageGeneration:energy(['jgm1','jgm2']),storageCharging:energy(['jgm']),samples:series.length,periods:series.map(r=>({utc:r.dtime_utc,label:r.period,power:valid(r.jg)&&valid(r.jnwrb)?Number(r.jg)+Number(r.jnwrb):null,wind:valid(r.wi)?Number(r.wi):null,solar:valid(r.pv)?Number(r.pv):null}))};
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
    const u = units.get(r.resource_code) || {code:r.resource_code,plant:r.power_plant,energy:0,peak:0,samples:0,periods:[]};
    const power = Number(r.value);
    u.energy += power/4; u.peak = Math.max(u.peak,power); u.samples++;
    u.periods.push({utc:r.dtime_utc,label:r.period,power});
    units.set(u.code,u);
    const p = periods.get(r.dtime_utc) || {utc:r.dtime_utc,label:r.period,power:0};
    p.power += power; periods.set(r.dtime_utc,p);
  }
  const offset = s => Date.parse(s+'T00:00:00Z') - Date.parse(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',dateStyle:'short',timeStyle:'medium'}).format(new Date(s+'T00:00:00Z')).replace(' ','T')+'Z');
  const next = new Date(Date.parse(date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
  const expected = (86400000 + offset(next)-offset(date))/900000;
  for(const u of units.values()) u.periods.sort((a,b)=>a.utc.localeCompare(b.utc));
  return {date,expected,units:[...units.values()].sort((a,b)=>b.energy-a.energy),periods:[...periods.values()].sort((a,b)=>a.utc.localeCompare(b.utc)),records:unique.size};
}
