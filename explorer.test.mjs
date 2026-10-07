import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aggregate,systemSummary} from './public/lib.mjs';
import {plantPeriods,dailyPlant,validDate,percent,unitCount,dayInsight,shiftDate} from './public/explorer.mjs';
import {dayStart,alignPrevious,linePath} from './public/charts.mjs';
const row={business_date:'2026-10-05',resource_code:'A',power_plant:'Test',operating_mode_eng:'Generation',dtime_utc:'2026-10-04 22:15:00',period:'00:00 - 00:15',value:100,publication_ts_utc:'2026-10-06 01:00:00'};
test('plant series preserve revised measurements and gaps for missing units',()=>{
 const data=aggregate([row,{...row,value:200,publication_ts_utc:'2026-10-06 02:00:00'},{...row,resource_code:'B',value:50},{...row,dtime_utc:'2026-10-04 22:30:00',value:70}],row.business_date);
 assert.equal(data.units[0].periods[0].power,200);assert.deepEqual(plantPeriods(data.units).map(p=>p.power),[250,null]);assert.equal(dailyPlant(data,'Test'),null);assert.equal(dailyPlant(data,'Absent'),null);
 assert.equal(dailyPlant({...data,expected:1,units:[{...data.units[1],energy:0}]},'Test'),0);
});
test('system chart preserves missing total independently from valid wind and PV',()=>{
 const summary=systemSummary([{...row,jg:null,jnwrb:50,wi:20,pv:0}],row.business_date,1);
 assert.equal(summary.periods[0].power,null);assert.equal(summary.periods[0].wind,20);assert.equal(summary.periods[0].solar,0);assert.equal(summary.total,null);
});
test('dates are bounded, real calendar dates and shift safely across year boundaries',()=>{
 assert.equal(validDate('2026-02-30','2026-10-06'),false);assert.equal(validDate('2026-10-07','2026-10-06'),false);assert.equal(validDate('2024-06-13','2026-10-06'),false);assert.equal(validDate('2024-06-14','2026-10-06'),true);assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');
});
test('percentages and Polish plurals avoid misleading zero and malformed labels',()=>{
 assert.equal(percent(.045),'<0,1%');assert.equal(percent(0),'0%');assert.equal(unitCount(1),'1 jednostka wytwórcza');assert.equal(unitCount(3),'3 jednostki wytwórcze');assert.equal(unitCount(12),'12 jednostek wytwórczych');assert.equal(unitCount(22),'22 jednostki wytwórcze');assert.equal(unitCount(112),'112 jednostek wytwórczych');
});
test('insights do not invent renewable shares when components are missing',()=>{
 assert.match(dayInsight({units:[],system:{total:100,wind:20,solar:10}}),/30%/);assert.doesNotMatch(dayInsight({units:[],system:{total:100,wind:null,solar:10}}),/%/);
});
test('Warsaw midnight and previous-day alignment respect DST gaps and repeated hours',()=>{
 assert.equal(new Date(dayStart('2026-03-29')).toISOString(),'2026-03-28T23:00:00.000Z');assert.equal(new Date(dayStart('2026-03-30')).toISOString(),'2026-03-29T22:00:00.000Z');
 const regular=Array.from({length:96},(_,i)=>({utc:new Date(dayStart('2026-10-24')+(i+1)*900000).toISOString().slice(0,19),power:i}));
 const autumn=alignPrevious(regular,'2026-10-25',100);assert.equal(autumn.length,100);assert.equal(autumn.filter(p=>p.power===null).length,4);assert.equal(autumn[16].power,12);
 const spring=alignPrevious(regular,'2026-03-29',92);assert.equal(spring.length,92);assert.equal(spring[8].power,12);
});
test('chart lines break at nulls and missing intervals',()=>{
 const points=[{utc:'2026-10-04 22:15:00',power:1},{utc:'2026-10-04 22:30:00',power:null},{utc:'2026-10-04 22:45:00',power:2},{utc:'2026-10-04 23:15:00',power:3}];const path=linePath(points,t=>t,v=>v);assert.equal((path.match(/M/g)||[]).length,3);assert.equal((path.match(/L/g)||[]).length,0);
});
