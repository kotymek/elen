import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aggregate,yesterday} from './lib.mjs';
const row={business_date:'2026-10-05',resource_code:'A',power_plant:'Test',operating_mode_eng:'Generation',dtime_utc:'2026-10-04 22:15:00',period:'00:00 - 00:15',value:100,publication_ts_utc:'2026-10-06 01:00:00'};
test('MW to MWh, revisions, missing values and storage demand',()=>{
 const result=aggregate([row,{...row,value:200,publication_ts_utc:'2026-10-06 02:00:00'},{...row,resource_code:'B',value:null},{...row,resource_code:'C',operating_mode_eng:'Pumping'}],'2026-10-05');
 assert.equal(result.units.length,1);assert.equal(result.units[0].energy,50);assert.equal(result.units[0].samples,1);assert.equal(result.expected,96);
});
test('DST days have 92 and 100 quarters',()=>{assert.equal(aggregate([],'2026-03-29').expected,92);assert.equal(aggregate([],'2026-10-25').expected,100);});
test('previous date uses Warsaw at midnight and year boundary',()=>{assert.equal(yesterday(new Date('2026-01-01T23:30:00Z')),'2026-01-01');assert.equal(yesterday(new Date('2025-12-31T23:30:00Z')),'2025-12-31');});
