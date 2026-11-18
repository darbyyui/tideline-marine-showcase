"""Create isolated baking / verification pages; these are never release assets."""
from pathlib import Path
import sys,re
root=Path(__file__).resolve().parents[1]
verify='--verify' in sys.argv
name='verify-water-local.html' if verify else 'bake-local.html'
s=(root/'index.html').read_text().replace('/index\\.html$/','/(?:index|'+name.replace('.',r'\.')+')$/',1)
if verify:
 s=s.replace('async function buildHullVolumeAsync(...args){await runGeometryWork(buildHullVolumeSteps(...args));}',"async function buildHullVolumeAsync(){throw Error('Unexpected runtime hull calculation');}")
 s=s.replace('async function updateProfileAsync(...args){await runGeometryWork(updateProfileSteps(...args));}',"async function updateProfileAsync(){throw Error('Unexpected runtime profile calculation');}")
else:
 s=s.replace('async function loadPreparedWaterData(kind){','async function loadPreparedWaterData(kind){return null;',1)
s=s.replace("  entry.state='ready';",'''  entry.state='ready';
  const bakeResult={};
  for(const candidate of boatCatalog.values())if(candidate.assets){
   const a=candidate.assets,kind=candidate.id==='xo270'?'motor':candidate.id;
   if(!ASSET_MANIFEST.water[kind])continue;
   bakeResult[kind]={schema:1,revision:ASSET_MANIFEST.water[kind].revision,profile:Array.from(a.profileData),volume:Array.from(a.volumeData),bounds:a.volumeBounds.toArray(),opening:(a.opening||[]).map(p=>p.toArray())};
  }
  let bakeOutput=document.getElementById('bake-output');
  if(!bakeOutput){bakeOutput=document.createElement('script');bakeOutput.id='bake-output';bakeOutput.type='application/json';document.body.append(bakeOutput);}
  bakeOutput.textContent=JSON.stringify(bakeResult);bakeOutput.dataset.count=String(Object.keys(bakeResult).length);
  let bakeStatus=document.getElementById('bake-status');
  if(!bakeStatus){bakeStatus=document.createElement('p');bakeStatus.id='bake-status';bakeStatus.style.cssText='position:fixed;left:20px;bottom:20px;padding:12px;background:#123;color:white;z-index:9999';document.body.append(bakeStatus);}
  bakeStatus.textContent='船身資料已完成：'+Object.keys(bakeResult).length+' / 3';
''',1)
(root/name).write_text(s)
print(name,'verification' if verify else 'forced recomputation')
