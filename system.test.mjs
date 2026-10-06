import {test} from 'node:test';
import assert from 'node:assert/strict';
import {systemSummary} from './public/lib.mjs';
const row={business_date:'2026-10-05',dtime_utc:'2026-10-04 22:15:00',publication_ts_utc:'2026-10-06 01:00:00',period:'00:00 - 00:15',jg:100,jnwrb:60,wi:20,pv:10,jgm1:4,jgm2:2,jgm:-8};
test('system total includes wind and solar without counting them twice',()=>{
 const s=systemSummary([row],'2026-10-05',1);
 assert.equal(s.total,40);assert.equal(s.wind,5);assert.equal(s.solar,2.5);assert.equal(s.storageGeneration,1.5);assert.equal(s.storageCharging,-2);
});
test('incomplete day and null values are not presented as full daily energy',()=>{
 assert.equal(systemSummary([row],'2026-10-05',96).total,null);
 const s=systemSummary([{...row,jnwrb:null,pv:null}],'2026-10-05',1);
 assert.equal(s.total,null);assert.equal(s.solar,null);assert.equal(s.wind,5);
});
test('latest system revision replaces older publication',()=>{
 const s=systemSummary([row,{...row,jg:200,publication_ts_utc:'2026-10-06 02:00:00'}],'2026-10-05',1);
 assert.equal(s.total,65);assert.equal(s.samples,1);
});
