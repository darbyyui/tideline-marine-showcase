import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ASSET_MANIFEST} from '../asset-manifest.mjs';
import {decodeWaterData} from '../asset-loader.mjs';
const root=new URL('../',import.meta.url);
for(const [path,entry] of Object.entries(ASSET_MANIFEST.assets)){
 const bytes=readFileSync(new URL(path,root));assert.equal(bytes.length,entry.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,path);
}
for(const [kind,entry] of Object.entries(ASSET_MANIFEST.water)){
 assert.ok(ASSET_MANIFEST.assets[entry.path],kind+' precomputation missing');
 const water=await decodeWaterData(readFileSync(new URL(entry.path,root)),entry.revision);
 assert.ok(water.volumeBounds[0]<water.volumeBounds[1]);assert.ok(water.volumeBounds[2]<water.volumeBounds[3]);
 assert.ok(water.volumeData.some((v,i)=>i%4===2&&v===1),kind+' hull is empty');
}
for(const page of ['index.html','template.html']){
 const html=readFileSync(new URL(page,root),'utf8');
 for(const name of ['asset-manifest.mjs','asset-loader.mjs']){
  const version=createHash('sha256').update(readFileSync(new URL(name,root))).digest('hex').slice(0,16);
  assert.ok(html.includes(name+'?v='+version),page+' stale module version '+name);
 }
}
console.log('PASS: every model/sidecar fingerprint, water schema, nonempty hull and HTML import version');
