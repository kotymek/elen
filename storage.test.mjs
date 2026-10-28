import {test} from 'node:test';
import assert from 'node:assert/strict';
import {systemSummary} from './public/lib.mjs';
import {powerAxis} from './public/charts.mjs';
const row={business_date:'2026-10-27',dtime_utc:'2026-10-26 23:15:00',publication_ts_utc:'2026-10-28 01:00:00',jg:100,jnwrb:60,jgm1:4,jgm2:2,jgm:-8};
test('storage series show both directions without changing KSE total',()=>{
 const s=systemSummary([row],row.business_date,1);
 assert.equal(s.periods[0].storageGeneration,6);assert.equal(s.periods[0].storageCharging,-8);
 assert.equal(s.storageGeneration,1.5);assert.equal(s.storageCharging,-2);assert.equal(s.total,40);
});
test('missing storage components stay null and do not erase the other direction',()=>{
 const s=systemSummary([{...row,jgm2:null}],row.business_date,1);
 assert.equal(s.periods[0].storageGeneration,null);assert.equal(s.storageGeneration,null);assert.equal(s.periods[0].storageCharging,-8);
 const t=systemSummary([{...row,jgm:null}],row.business_date,1);assert.equal(t.periods[0].storageCharging,null);assert.equal(t.storageCharging,null);assert.equal(t.periods[0].storageGeneration,6);
});
test('storage zero, revised observations and incomplete daily totals remain distinct',()=>{
 const s=systemSummary([row,{...row,jgm1:0,jgm2:0,jgm:0,publication_ts_utc:'2026-10-28 02:00:00'}],row.business_date,96);
 assert.equal(s.periods[0].storageGeneration,0);assert.equal(s.periods[0].storageCharging,0);assert.equal(s.storageGeneration,null);assert.equal(s.storageCharging,null);
 assert.equal(systemSummary([{...row,jgm:8}],row.business_date,1).periods[0].storageCharging,-8);
});
test('power axis contains charging and generation and always includes zero',()=>{
 for(const values of [[-1400,22000],[-850,-10],[0],[null,undefined],[-.1,.1],[1500,2000]]){
  const {min,max,step}=powerAxis(values);assert.ok(step>0&&max>min);assert.ok(min<=0&&max>=0);
  for(const value of values.filter(v=>typeof v==='number'))assert.ok(value>=min&&value<=max);
  assert.ok(Math.abs(min/step-Math.round(min/step))<1e-8);
 }
});
