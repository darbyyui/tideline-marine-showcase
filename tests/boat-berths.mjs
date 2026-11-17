import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../three.module.js';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function assignBoatBerths('),source.indexOf('function stagePreparedBoat('));
const create=new Function('T',`const boatCatalog=new Map(),boatBerths={};let berthAnchor=null,berthSlot=0;${code};return {boatCatalog,boatBerths,assignBoatBerths};`);
for(const first of ['sail','luxury']){
 const state=create(T);
 for(const id of ['sail','luxury'])state.boatCatalog.set(id,{id,scale:id==='luxury'?5.2:1});
 state.assignBoatBerths(first);
 assert.equal(state.boatBerths[first].length(),0);
 const before=Object.fromEntries(Object.entries(state.boatBerths).map(([id,p])=>[id,p.toArray()]));
 for(let i=0;i<30;i++)state.boatCatalog.set('extra-'+i,{id:'extra-'+i,scale:i%2?5.2:1});
 state.assignBoatBerths(first==='sail'?'luxury':'sail');
 for(const [id,p] of Object.entries(before))assert.deepEqual(state.boatBerths[id].toArray(),p,'existing berth must not move');
 const ids=Object.keys(state.boatBerths);
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const gap=6*(state.boatCatalog.get(ids[i]).scale+state.boatCatalog.get(ids[j]).scale)+12;
  assert.ok(state.boatBerths[ids[i]].distanceTo(state.boatBerths[ids[j]])>=gap,'boats need size-aware clearance');
 }
}
console.log('PASS: yacht-first/sail-first, 32 distinct berths, stable positions after adding ships');
